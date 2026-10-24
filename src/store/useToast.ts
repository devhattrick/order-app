import { create } from 'zustand'

interface Toast {
  id: number
  message: string
}

interface ToastState {
  toasts: Toast[]
  show: (message: string) => void
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (message) => {
    const id = Date.now() + Math.random()
    set((s) => ({ toasts: [...s.toasts, { id, message }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600)
  },
}))

export const toast = (message: string) => useToast.getState().show(message)
