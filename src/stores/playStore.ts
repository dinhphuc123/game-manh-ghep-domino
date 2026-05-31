import { create } from 'zustand';

export interface PieceStateData {
  x: number;
  y: number;
  isSnapped: boolean;
}

interface PlayState {
  activePin: string;
  teamName: string;
  isPlaying: boolean;
  piecesState: Record<string, PieceStateData>;
  
  setActivePin: (pin: string) => void;
  setTeamName: (name: string) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPiecesState: (pieces: Record<string, PieceStateData>) => void;
  updatePieceState: (pieceId: string, data: Partial<PieceStateData>) => void;
  resetPlayState: () => void;
}

export const usePlayStore = create<PlayState>((set) => ({
  activePin: '',
  teamName: '',
  isPlaying: false,
  piecesState: {},

  setActivePin: (activePin) => set({ activePin }),
  setTeamName: (teamName) => set({ teamName }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  setPiecesState: (piecesState) => set({ piecesState }),
  
  updatePieceState: (pieceId, data) => set((state) => ({
    piecesState: {
      ...state.piecesState,
      [pieceId]: {
        ...(state.piecesState[pieceId] || { x: 0, y: 0, isSnapped: false }),
        ...data,
      },
    },
  })),
  
  resetPlayState: () => set({ 
    activePin: '', 
    teamName: '', 
    isPlaying: false, 
    piecesState: {} 
  }),
}));
