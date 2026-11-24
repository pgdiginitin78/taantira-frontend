import { create } from 'zustand';

let toastIdSeq = 1;

export const useToastStore = create((set) => ({
  toasts: [],

  showToast: ({
    type = 'info',
    title,
    subtitle = '',
    imageUrl = null,
    badgeText = '',
    actionLabel = '',
    actionTo = '',
  }) => {
    const id = toastIdSeq++;
    set((state) => ({
      toasts: [
        ...state.toasts.slice(-2),
        { id, type, title, subtitle, imageUrl, badgeText, actionLabel, actionTo },
      ],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4200);
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
