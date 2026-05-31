import { create } from 'zustand';
import { getFirebaseConfig, saveFirebaseConfig } from '../firebaseService';

interface FirebaseConfigState {
  projectId: string;
  setProjectId: (projectId: string) => void;
}

export const useFirebaseConfigStore = create<FirebaseConfigState>((set) => ({
  projectId: getFirebaseConfig().projectId,
  setProjectId: (projectId: string) => {
    set({ projectId });
    saveFirebaseConfig({ projectId });
  },
}));
