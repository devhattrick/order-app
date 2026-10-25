import { useEffect, useRef } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { useConfirmStore } from '../store/useConfirm'

/**
 * Dialog ยืนยันกลางของระบบ — mount ไว้ที่ App ครั้งเดียว
 * เรียกใช้จากที่ไหนก็ได้ด้วย confirm() ใน store/useConfirm
 */
export function ConfirmHost() {
  const current = useConfirmStore((s) => s.current)
  const close = useConfirmStore((s) => s.close)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!current) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
      if (e.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, close])

  if (!current) return null

  const danger = current.tone !== 'primary'
  const Icon = danger ? AlertTriangle : HelpCircle

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center px-5" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-lita-950/50" onClick={() => close(false)} />

      <div className="anim-pop relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl ${danger ? 'bg-[#FBEBE8] text-[#B3261E]' : 'bg-lita-50 text-lita-700'}`}>
          <Icon className="h-5 w-5" />
        </div>

        <h2 id="confirm-title" className="text-lg font-semibold leading-snug text-ink">
          {current.title}
        </h2>
        {current.message ? <p className="mt-1.5 text-sm leading-relaxed text-ink-mute">{current.message}</p> : null}

        <div className="mt-6 flex gap-3">
          <button ref={cancelRef} onClick={() => close(false)} className="btn-soft flex-1 py-3">
            {current.cancelLabel ?? 'ยกเลิก'}
          </button>
          <button
            onClick={() => close(true)}
            className={`btn flex-1 py-3 text-white ${danger ? 'bg-[#B3261E] hover:bg-[#8E1D17]' : 'bg-lita-800 hover:bg-lita-900'}`}
          >
            {current.confirmLabel ?? 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  )
}
