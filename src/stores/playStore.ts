import { create } from 'zustand';

interface PlayState {
  activePin: string;
  teamName: string;
  isPlaying: boolean;
  
  setActivePin: (pin: string) => void;
  setTeamName: (name: string) => void;
  setIsPlaying: (playing: boolean) => void;
  resetPlayState: () => void;
}

export const usePlayStore = create<PlayState>((set) => ({
  activePin: '',
  teamName: '',
  isPlaying: false,

  setActivePin: (activePin) => set({ activePin }),
  setTeamName: (teamName) => set({ teamName }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  resetPlayState: () => set({ activePin: '', teamName: '', isPlaying: false }),
}));
