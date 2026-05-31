import { create } from 'zustand';

interface UIState {
  activeTab: 'poster' | 'cutout';
  isSidebarCollapsed: boolean;
  message: { text: string; type: 'success' | 'error' | 'info' } | null;
  showPublishModal: boolean;
  showJsonModal: boolean;
  jsonInput: string;
  jsonError: string;
  publishing: boolean;
  publishedPin: string;
  isLocalPublish: boolean;
  showTeacherKeyPrint: boolean;
  showCuttingBorders: boolean;
  
  setActiveTab: (tab: 'poster' | 'cutout') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  showFlashMessage: (text: string, type?: 'success' | 'error' | 'info') => void;
  clearFlashMessage: () => void;
  setShowPublishModal: (show: boolean) => void;
  setShowJsonModal: (show: boolean) => void;
  setJsonInput: (input: string) => void;
  setJsonError: (error: string) => void;
  setPublishing: (publishing: boolean) => void;
  setPublishedPin: (pin: string) => void;
  setIsLocalPublish: (isLocal: boolean) => void;
  setShowTeacherKeyPrint: (show: boolean) => void;
  setShowCuttingBorders: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'poster',
  isSidebarCollapsed: false,
  message: null,
  showPublishModal: false,
  showJsonModal: false,
  jsonInput: '',
  jsonError: '',
  publishing: false,
  publishedPin: '',
  isLocalPublish: false,
  showTeacherKeyPrint: true,
  showCuttingBorders: true,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  showFlashMessage: (text, type = 'success') => {
    set({ message: { text, type } });
    setTimeout(() => {
      set({ message: null });
    }, 4000);
  },
  clearFlashMessage: () => set({ message: null }),
  setShowPublishModal: (showPublishModal) => set({ showPublishModal }),
  setShowJsonModal: (showJsonModal) => set({ showJsonModal }),
  setJsonInput: (jsonInput) => set({ jsonInput }),
  setJsonError: (jsonError) => set({ jsonError }),
  setPublishing: (publishing) => set({ publishing }),
  setPublishedPin: (publishedPin) => set({ publishedPin }),
  setIsLocalPublish: (isLocalPublish) => set({ isLocalPublish }),
  setShowTeacherKeyPrint: (showTeacherKeyPrint) => set({ showTeacherKeyPrint }),
  setShowCuttingBorders: (showCuttingBorders) => set({ showCuttingBorders }),
}));
