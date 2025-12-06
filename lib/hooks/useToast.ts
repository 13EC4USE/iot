import { create } from "zustand"

export interface Toast {
  id: string
  type: "success" | "error" | "info" | "warning"
  title?: string
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, duration: toast.duration ?? 3000 }],
    }))

    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(
        () => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }))
        },
        toast.duration ?? 3000
      )
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
  clearToasts: () => {
    set({ toasts: [] })
  },
}))

export function useToast() {
  const { addToast, removeToast } = useToastStore()

  return {
    success: (message: string, title?: string) => {
      addToast({ type: "success", message, title })
    },
    error: (message: string, title?: string) => {
      addToast({ type: "error", message, title })
    },
    info: (message: string, title?: string) => {
      addToast({ type: "info", message, title })
    },
    warning: (message: string, title?: string) => {
      addToast({ type: "warning", message, title })
    },
    remove: removeToast,
  }
}
