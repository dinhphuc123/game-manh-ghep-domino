import { create } from 'zustand';

interface GeminiConfigState {
  apiKey: string;
  model: string;
  provider: 'gemini' | 'openrouter';
  openRouterApiKey: string;
  openRouterModel: string;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  setProvider: (provider: 'gemini' | 'openrouter') => void;
  setOpenRouterApiKey: (key: string) => void;
  setOpenRouterModel: (model: string) => void;
}

export const useGeminiConfigStore = create<GeminiConfigState>((set) => ({
  apiKey: localStorage.getItem('gemini_api_key') || '',
  model: localStorage.getItem('gemini_model') || 'gemini-3.5-flash',
  provider: (localStorage.getItem('ai_provider') as 'gemini' | 'openrouter') || 'gemini',
  openRouterApiKey: localStorage.getItem('openrouter_api_key') || '',
  openRouterModel: localStorage.getItem('openrouter_model') || 'google/gemini-2.5-flash',
  setApiKey: (apiKey: string) => {
    set({ apiKey });
    localStorage.setItem('gemini_api_key', apiKey);
  },
  setModel: (model: string) => {
    set({ model });
    localStorage.setItem('gemini_model', model);
  },
  setProvider: (provider: 'gemini' | 'openrouter') => {
    set({ provider });
    localStorage.setItem('ai_provider', provider);
  },
  setOpenRouterApiKey: (key: string) => {
    set({ openRouterApiKey: key });
    localStorage.setItem('openrouter_api_key', key);
  },
  setOpenRouterModel: (model: string) => {
    set({ openRouterModel: model });
    localStorage.setItem('openrouter_model', model);
  },
}));
