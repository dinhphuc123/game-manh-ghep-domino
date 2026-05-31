import { create } from 'zustand';

interface GeminiConfigState {
  apiKey: string;
  model: string;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
}

export const useGeminiConfigStore = create<GeminiConfigState>((set) => ({
  apiKey: localStorage.getItem('gemini_api_key') || '',
  model: localStorage.getItem('gemini_model') || 'gemini-3.5-flash',
  setApiKey: (apiKey: string) => {
    set({ apiKey });
    localStorage.setItem('gemini_api_key', apiKey);
  },
  setModel: (model: string) => {
    set({ model });
    localStorage.setItem('gemini_model', model);
  },
}));
