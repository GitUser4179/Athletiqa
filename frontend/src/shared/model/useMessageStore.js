import { create } from 'zustand';

export const useMessageStore = create((set) => ({
  isOpen: false,
  activeTab: 'chatt',
  // A conversation to open as soon as the chat panel is shown (e.g. from "Kontakta" on a profile)
  pendingConversation: null,
  openChat: () => set({ isOpen: true }),
  openChatWith: (conversation) => set({ isOpen: true, activeTab: 'chatt', pendingConversation: conversation }),
  clearPendingConversation: () => set({ pendingConversation: null }),
  closeChat: () => set({ isOpen: false }),
  setTab: (tab) => set({ activeTab: tab }),
}));
