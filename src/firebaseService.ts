import { GameSettings, PuzzlePair } from './types';

// Cấu hình Firebase mặc định (giáo viên có thể thay đổi cấu hình này trong Settings của họ)
interface FirebaseConfig {
  projectId: string;
}

const DEFAULT_PROJECT_ID = 'canva-school-puzzle-demo';
const STORAGE_CONFIG_KEY = 'canva_puzzle_firebase_config';
const LOCAL_GAMES_KEY = 'canva_puzzle_local_games';
const LOCAL_SESSIONS_KEY = 'canva_puzzle_local_sessions';

export interface TeamProgress {
  snappedCount: number;
  totalPieces: number;
  completed: boolean;
  completedTime: number | null; // tính bằng giây
  lastActive: string;
}

export type SessionTeams = Record<string, TeamProgress>;

// Lấy cấu hình Firebase từ LocalStorage hoặc mặc định
export const getFirebaseConfig = (): FirebaseConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading Firebase config from localStorage', e);
  }
  return { projectId: DEFAULT_PROJECT_ID };
};

// Lưu cấu hình Firebase tùy chỉnh
export const saveFirebaseConfig = (config: FirebaseConfig) => {
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
};

// Sinh mã PIN ngẫu nhiên gồm 6 chữ số
export const generatePinCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Lưu Game lên Firebase Firestore REST API hoặc LocalStorage fallback
 */
export const saveGameToCloud = async (
  settings: GameSettings,
  pairs: PuzzlePair[]
): Promise<{ pin: string; isLocal: boolean }> => {
  const pin = generatePinCode();
  const config = getFirebaseConfig();
  
  const gameData = {
    settings,
    pairs,
    createdAt: new Date().toISOString(),
  };

  // 1. Cố gắng lưu lên Firestore REST API
  if (config.projectId && config.projectId !== '') {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/puzzles?documentId=${pin}`;
      
      const firestoreDoc = {
        fields: {
          data: {
            stringValue: JSON.stringify(gameData)
          },
          createdAt: {
            timestampValue: new Date().toISOString()
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firestoreDoc),
      });

      if (response.ok) {
        return { pin, isLocal: false };
      } else {
        console.warn('Firebase Firestore REST API error, falling back to LocalStorage', await response.text());
      }
    } catch (error) {
      console.warn('Fetch Firebase failed, falling back to LocalStorage', error);
    }
  }

  // 2. Fallback sang LocalStorage nếu Firebase lỗi hoặc không có cấu hình
  try {
    const localGamesRaw = localStorage.getItem(LOCAL_GAMES_KEY);
    const localGames = localGamesRaw ? JSON.parse(localGamesRaw) : {};
    localGames[pin] = gameData;
    localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(localGames));
    return { pin, isLocal: true };
  } catch (e) {
    console.error('LocalStorage write error', e);
    throw new Error('Không thể lưu game cục bộ hoặc lên đám mây.');
  }
};

/**
 * Tải Game từ Firebase Firestore REST API hoặc LocalStorage fallback theo mã PIN
 */
export const loadGameFromCloud = async (
  pin: string
): Promise<{ settings: GameSettings; pairs: PuzzlePair[] }> => {
  const config = getFirebaseConfig();

  // 1. Thử tải từ Firestore REST API
  if (config.projectId && config.projectId !== '') {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/puzzles/${pin}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const doc = await response.json();
        const dataStr = doc.fields?.data?.stringValue;
        if (dataStr) {
          const parsed = JSON.parse(dataStr);
          return {
            settings: parsed.settings,
            pairs: parsed.pairs,
          };
        }
      }
    } catch (error) {
      console.warn('Fetch Firebase load failed, checking LocalStorage', error);
    }
  }

  // 2. Thử tải từ LocalStorage
  try {
    const localGamesRaw = localStorage.getItem(LOCAL_GAMES_KEY);
    if (localGamesRaw) {
      const localGames = JSON.parse(localGamesRaw);
      if (localGames[pin]) {
        return {
          settings: localGames[pin].settings,
          pairs: localGames[pin].pairs,
        };
      }
    }
  } catch (e) {
    console.error('LocalStorage read error', e);
  }

  throw new Error(`Không tìm thấy bộ game với mã PIN: ${pin}`);
};

/**
 * Tải tiến độ chơi (Play Session) của các đội từ Firestore/LocalStorage
 */
export const loadSessionProgress = async (pin: string): Promise<SessionTeams> => {
  const config = getFirebaseConfig();

  // Thử tải từ Firebase
  if (config.projectId && config.projectId !== '') {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/sessions/${pin}`;
      const response = await fetch(url);
      if (response.ok) {
        const doc = await response.json();
        const teamsStr = doc.fields?.teams?.stringValue;
        if (teamsStr) {
          return JSON.parse(teamsStr);
        }
      }
    } catch (e) {
      console.warn('Error loading session progress from Firebase', e);
    }
  }

  // Fallback tải từ LocalStorage
  try {
    const localSessionsRaw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    if (localSessionsRaw) {
      const localSessions = JSON.parse(localSessionsRaw);
      if (localSessions[pin]) {
        return localSessions[pin].teams;
      }
    }
  } catch (e) {
    console.error('LocalStorage read error for session', e);
  }

  return {};
};

/**
 * Đăng ký tiến độ cho một Đội (Team) mới vào Session chơi game
 */
export const registerTeam = async (pin: string, teamName: string, totalPieces: number): Promise<void> => {
  const config = getFirebaseConfig();
  const currentTeams = await loadSessionProgress(pin);

  // Tạo đối tượng team mới
  const newTeam: TeamProgress = {
    snappedCount: 0,
    totalPieces,
    completed: false,
    completedTime: null,
    lastActive: new Date().toISOString(),
  };

  const updatedTeams = {
    ...currentTeams,
    [teamName]: newTeam,
  };

  // Thử cập nhật lên Firebase
  let success = false;
  if (config.projectId && config.projectId !== '') {
    try {
      // Sử dụng PATCH (update) Firestore REST API để cập nhật hoặc tạo mới
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/sessions/${pin}?updateMask.fieldPaths=teams`;
      const firestoreDoc = {
        fields: {
          teams: {
            stringValue: JSON.stringify(updatedTeams)
          }
        }
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firestoreDoc),
      });

      if (response.ok) {
        success = true;
      }
    } catch (e) {
      console.warn('Error registering team on Firebase, saving locally', e);
    }
  }

  // Lưu cục bộ trong LocalStorage
  try {
    const localSessionsRaw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    const localSessions = localSessionsRaw ? JSON.parse(localSessionsRaw) : {};
    localSessions[pin] = {
      teams: updatedTeams,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(localSessions));
  } catch (e) {
    console.error('LocalStorage write error for session registration', e);
  }
};

/**
 * Cập nhật tiến độ lắp ghép của một Đội (Team) lên Server/LocalStorage
 */
export const updateTeamProgress = async (
  pin: string,
  teamName: string,
  snappedCount: number,
  completed: boolean,
  completedTime: number | null = null
): Promise<void> => {
  const config = getFirebaseConfig();
  const currentTeams = await loadSessionProgress(pin);
  const existingTeam = currentTeams[teamName];

  if (!existingTeam) {
    console.warn(`Team ${teamName} not registered in session ${pin}`);
    return;
  }

  const updatedTeam: TeamProgress = {
    ...existingTeam,
    snappedCount,
    completed,
    completedTime: completed ? (completedTime ?? existingTeam.completedTime) : null,
    lastActive: new Date().toISOString(),
  };

  const updatedTeams = {
    ...currentTeams,
    [teamName]: updatedTeam,
  };

  // Thử cập nhật lên Firebase
  if (config.projectId && config.projectId !== '') {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/sessions/${pin}?updateMask.fieldPaths=teams`;
      const firestoreDoc = {
        fields: {
          teams: {
            stringValue: JSON.stringify(updatedTeams)
          }
        }
      };

      await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firestoreDoc),
      });
    } catch (e) {
      console.warn('Error updating team progress on Firebase, saving locally', e);
    }
  }

  // Lưu cục bộ trong LocalStorage
  try {
    const localSessionsRaw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    const localSessions = localSessionsRaw ? JSON.parse(localSessionsRaw) : {};
    localSessions[pin] = {
      teams: updatedTeams,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(localSessions));
  } catch (e) {
    console.error('LocalStorage write error for session progress update', e);
  }
};
