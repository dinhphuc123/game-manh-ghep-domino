import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getFirebaseConfig, saveFirebaseConfig } from '../firebaseService';

interface FirebaseConfigState {
  projectId: string;
  setProjectId: (projectId: string) => void;
}

export const useFirebaseConfigStore = create<FirebaseConfigState>()(
  persist(
    (set) => ({
      projectId: getFirebaseConfig().projectId,
      setProjectId: (projectId: string) => {
        set({ projectId });
        saveFirebaseConfig({ projectId });
      },
    }),
    {
      name: 'canva_puzzle_firebase_config_zustand', // Key in LocalStorage
    }
  )
);
