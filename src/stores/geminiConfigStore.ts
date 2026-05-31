import { create } from 'zustand';

interface GeminiConfigState {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
}

export const useGeminiConfigStore = create<GeminiConfigState>((set) => ({
  apiKey: localStorage.getItem('gemini_api_key') || '',
  setApiKey: (apiKey: string) => {
    set({ apiKey });
    localStorage.setItem('gemini_api_key', apiKey);
  },
}));
