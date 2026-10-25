import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** danger = การกระทำที่ย้อนกลับไม่ได้ (ลบ/ยกเลิก) */
  tone?: 'danger' | 'primary'
}

interface Pending extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

interface ConfirmState {
  current: Pending | null
  open: (o: ConfirmOptions) => Promise<boolean>
  close: (ok: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  current: null,
  open: (o) =>
    new Promise<boolean>((resolve) => {
      // ถ้ามี dialog ค้างอยู่ ให้ถือว่าอันเดิมถูกยกเลิก
      get().current?.resolve(false)
      set({ current: { ...o, resolve } })
    }),
  close: (ok) => {
    const cur = get().current
    if (!cur) return
    cur.resolve(ok)
    set({ current: null })
  },
}))

/**
 * ใช้แทน window.confirm — คืน Promise<boolean>
 *   if (!(await confirm({ title: 'ลบรายการ?' }))) return
 */
export const confirm = (o: ConfirmOptions) => useConfirmStore.getState().open(o)
