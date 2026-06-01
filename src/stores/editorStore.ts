import { create } from 'zustand';
import { PuzzlePair, GameSettings } from '../types';
import { MATH_SAMPLE_DATA, GEOGRAPHY_SAMPLE_DATA, ENGLISH_SAMPLE_DATA } from '../sampleData';

interface EditorState {
  pairs: PuzzlePair[];
  settings: GameSettings;
  currentGameId: string;
  questionOrder: number[];
  answerOrder: number[];
  focusedField: { id: string; field: 'question' | 'answer' } | null;
  selectedMathCategory: string;
  showProjection: boolean;
  projectionIndex: number;

  setPairs: (pairs: PuzzlePair[]) => void;
  setSettings: (settings: Partial<GameSettings> | ((prev: GameSettings) => GameSettings)) => void;
  setCurrentGameId: (id: string) => void;
  setQuestionOrder: (order: number[]) => void;
  setAnswerOrder: (order: number[]) => void;
  setFocusedField: (field: { id: string; field: 'question' | 'answer' } | null) => void;
  setSelectedMathCategory: (category: string) => void;
  setShowProjection: (show: boolean) => void;
  setProjectionIndex: (idx: number | ((prev: number) => number)) => void;
  
  addPair: () => void;
  removePair: (id: string) => void;
  updatePair: (id: string, field: 'question' | 'answer' | 'code' | 'stepNumber' | 'stepDescription', value: any) => void;
  scramblePairs: () => void;
  resetScrambleOrders: () => void;
  loadSampleData: (type: 'math' | 'geo' | 'eng') => void;
  swapCutoutItems: (type: 'question' | 'answer', fromIdx: number, toIdx: number) => void;
}

const autoSaveGame = (
  id: string,
  settings: GameSettings,
  pairs: PuzzlePair[]
) => {
  if (!id || pairs.length === 0) return;
  try {
    const raw = localStorage.getItem('canva_puzzle_teacher_games');
    const list = raw ? JSON.parse(raw) : [];
    
    const existingIdx = list.findIndex((g: any) => g.id === id);
    const gameData = {
      id,
      title: settings.title,
      subject: settings.subject,
      settings: settings,
      pairs: pairs,
      publishedPin: existingIdx >= 0 ? list[existingIdx].publishedPin : null,
      createdAt: existingIdx >= 0 ? list[existingIdx].createdAt : new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      list[existingIdx] = gameData;
    } else {
      list.push(gameData);
    }
    localStorage.setItem('canva_puzzle_teacher_games', JSON.stringify(list));
  } catch (e) {
    console.error('Error auto saving game', e);
  }
};

const DEFAULT_SETTINGS: GameSettings = {
  title: 'Hàm số mũ và logarit',
  subject: 'Toán học 12',
  gradeClass: 'Lớp 12A1',
  teacherName: 'Thầy Minh',
  style: 'vibrant',
  showMatchCode: false,
  showDoodleIcons: true,
  activityType: 'Luyện tập',
  columns: 2,
  pieceSize: 1.0,
  saveInk: false,
  puzzleType: 'jigsaw',
  tarsiaShape: 'triangle_16',
  numberShape: '20',
  numberScaleX: 1.0,
  numberScaleY: 1.0,
  dominoShape: '26',
  dominoWidth: 160,
  dominoHeight: 68,
  mazeRows: 4,
  mazeCols: 5,
  mazeStyle: 'animal_cartoon',
  bingoRows: 5,
  bingoCols: 5,
  showHeader: true,
  hasScenario: false,
  scenarioTitle: '',
};


export const useEditorStore = create<EditorState>((set, get) => ({
  pairs: [],
  settings: DEFAULT_SETTINGS,
  currentGameId: '',
  questionOrder: [],
  answerOrder: [],
  focusedField: null,
  selectedMathCategory: 'Tất cả',
  showProjection: false,
  projectionIndex: 0,

  setPairs: (pairs) => {
    set({ pairs });
    get().resetScrambleOrders();
    autoSaveGame(get().currentGameId, get().settings, pairs);
  },
  
  setSettings: (update) => {
    set((state) => {
      const nextSettings = typeof update === 'function' ? update(state.settings) : { ...state.settings, ...update };
      autoSaveGame(state.currentGameId, nextSettings, state.pairs);
      return { settings: nextSettings };
    });
  },

  setCurrentGameId: (currentGameId) => set({ currentGameId }),
  
  setQuestionOrder: (questionOrder) => set({ questionOrder }),
  
  setAnswerOrder: (answerOrder) => set({ answerOrder }),
  
  setFocusedField: (focusedField) => set({ focusedField }),
  
  setSelectedMathCategory: (selectedMathCategory) => set({ selectedMathCategory }),
  
  setShowProjection: (showProjection) => set({ showProjection }),
  
  setProjectionIndex: (update) => set((state) => ({
    projectionIndex: typeof update === 'function' ? update(state.projectionIndex) : update
  })),

  addPair: () => {
    const { pairs, currentGameId, settings } = get();
    const nextIndex = pairs.length + 1;
    const newPair: PuzzlePair = {
      id: `pair-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      question: `Câu hỏi số ${nextIndex}`,
      answer: `Đáp án số ${nextIndex}`,
      code: `Z${nextIndex}`,
    };
    const updatedPairs = [...pairs, newPair];
    set({ pairs: updatedPairs });
    get().resetScrambleOrders();
    autoSaveGame(currentGameId, settings, updatedPairs);
  },

  removePair: (id) => {
    const { pairs, currentGameId, settings } = get();
    const updatedPairs = pairs.filter((p) => p.id !== id);
    set({ pairs: updatedPairs });
    get().resetScrambleOrders();
    autoSaveGame(currentGameId, settings, updatedPairs);
  },

  updatePair: (id, field, value) => {
    const { pairs, currentGameId, settings } = get();
    const updatedPairs = pairs.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    set({ pairs: updatedPairs });
    autoSaveGame(currentGameId, settings, updatedPairs);
  },

  scramblePairs: () => {
    const { questionOrder, answerOrder } = get();
    const qShuffled = [...questionOrder].sort(() => Math.random() - 0.5);
    const aShuffled = [...answerOrder].sort(() => Math.random() - 0.5);
    set({ questionOrder: qShuffled, answerOrder: aShuffled });
  },

  resetScrambleOrders: () => {
    const { pairs } = get();
    const indices = Array.from({ length: pairs.length }, (_, i) => i);
    set({ questionOrder: [...indices], answerOrder: [...indices] });
  },

  loadSampleData: (type) => {
    let sample: PuzzlePair[] = [];
    let title = '';
    let subject = '';
    let gradeClass = '';

    if (type === 'math') {
      sample = [...MATH_SAMPLE_DATA];
      title = 'Hàm số mũ và logarit';
      subject = 'Toán học 12';
      gradeClass = 'Cánh Diều - Lớp 12';
    } else if (type === 'geo') {
      sample = [...GEOGRAPHY_SAMPLE_DATA];
      title = 'Địa lí Tự nhiên Việt Nam';
      subject = 'Địa lí 12';
      gradeClass = 'Ôn thi THPT Quốc gia';
    } else {
      sample = [...ENGLISH_SAMPLE_DATA];
      title = 'Past Tense & Vocabulary Match-up';
      subject = 'Tiếng Anh 12';
      gradeClass = 'Lớp 12D';
    }

    const nextSettings = {
      ...get().settings,
      title,
      subject,
      gradeClass,
    };

    set({
      pairs: sample,
      settings: nextSettings,
    });
    get().resetScrambleOrders();
    autoSaveGame(get().currentGameId, nextSettings, sample);
  },

  swapCutoutItems: (type, fromIdx, toIdx) => {
    const { questionOrder, answerOrder, pairs } = get();
    if (fromIdx < 0 || fromIdx >= pairs.length || toIdx < 0 || toIdx >= pairs.length) return;
    
    if (type === 'question') {
      const newOrder = [...questionOrder];
      const temp = newOrder[fromIdx];
      newOrder[fromIdx] = newOrder[toIdx];
      newOrder[toIdx] = temp;
      set({ questionOrder: newOrder });
    } else {
      const newOrder = [...answerOrder];
      const temp = newOrder[fromIdx];
      newOrder[fromIdx] = newOrder[toIdx];
      newOrder[toIdx] = temp;
      set({ answerOrder: newOrder });
    }
  },
}));
