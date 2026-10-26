import { useEffect, useState, type ReactNode } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import type { MenuItem, OrderStatus, SelectedOption } from '../types'
import { STATUS_META } from '../data/constants'
import { useToast } from '../store/useToast'

/** โลโก้ Lita: ก้อนซาวโดว์มองจากด้านบน + รอยกรีด (ear) */
export function LoafMark({ className = 'h-8 w-8', animate = false, tone = 'green' }: { className?: string; animate?: boolean; tone?: 'green' | 'white' }) {
  const body = tone === 'green' ? '#1E5B3F' : '#FFFFFF'
  const cut = tone === 'green' ? '#FFFFFF' : '#1E5B3F'
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden>
      <ellipse cx="32" cy="24" rx="30" ry="21" fill={body} />
      <path
        d="M12 28 C 20 14, 38 9, 52 15"
        stroke={cut}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        className={animate ? 'anim-score' : undefined}
      />
    </svg>
  )
}

export function Logo({ tone = 'green', size = 'md' }: { tone?: 'green' | 'white'; size?: 'md' | 'lg' }) {
  return (
    <div className="flex items-center gap-2">
      <LoafMark tone={tone} className={size === 'lg' ? 'h-9 w-12' : 'h-6 w-8'} />
      <span className={`font-brand leading-none ${size === 'lg' ? 'text-3xl' : 'text-xl'} ${tone === 'green' ? 'text-lita-800' : 'text-white'}`}>
        Lita
      </span>
    </div>
  )
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${m.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

export function MenuThumb({ menu, size = 'md' }: { menu: Pick<MenuItem, 'emoji' | 'imageUrl' | 'name'>; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const dim = {
    sm: 'h-10 w-10 text-xl rounded-lg',
    md: 'h-16 w-16 text-3xl rounded-2xl',
    lg: 'h-24 w-24 text-5xl rounded-3xl',
    xl: 'h-28 w-28 text-6xl rounded-3xl',
  }[size]
  // ถ้ารูปโหลดไม่ขึ้น (URL เสีย / ออฟไลน์) ให้ตกกลับไปใช้ emoji แทนที่จะเป็นรูปแตก
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [menu.imageUrl])

  if (menu.imageUrl && !broken)
    return (
      <img
        src={menu.imageUrl}
        alt={menu.name}
        loading="lazy"
        onError={() => setBroken(true)}
        className={`${dim} shrink-0 bg-lita-50 object-cover`}
      />
    )
  return (
    <div className={`${dim} grid shrink-0 place-items-center bg-lita-50`} aria-hidden>
      <span>{menu.emoji}</span>
    </div>
  )
}

export function QtyStepper({ value, onChange, min = 0, size = 'md' }: { value: number; onChange: (n: number) => void; min?: number; size?: 'sm' | 'md' }) {
  const b = size === 'sm' ? 'h-7 w-7' : 'h-10 w-10'
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white">
      <button type="button" aria-label="ลดจำนวน" className={`${b} grid place-items-center rounded-full text-lita-800 hover:bg-lita-50 disabled:opacity-30`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus className="h-4 w-4" />
      </button>
      <span className={`min-w-7 text-center font-semibold tabular-nums ${size === 'sm' ? 'text-sm' : ''}`}>{value}</span>
      <button type="button" aria-label="เพิ่มจำนวน" className={`${b} grid place-items-center rounded-full text-lita-800 hover:bg-lita-50`} onClick={() => onChange(value + 1)}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

export function OptionText({ options, note }: { options: SelectedOption[]; note?: string }) {
  if (!options.length && !note) return null
  return (
    <p className="mt-0.5 text-xs leading-relaxed text-ink-mute">
      {options.map((o) => o.choiceName + (o.priceDelta ? ` +${o.priceDelta}` : '')).join(', ')}
      {note ? <span className="block italic text-ink-soft">“{note}”</span> : null}
    </p>
  )
}

export function Modal({ open, onClose, children, title, wide = false }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-lita-950/40" onClick={onClose} />
      <div className={`anim-rise relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-xl sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <button onClick={onClose} aria-label="ปิด" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink-soft hover:bg-lita-50">
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function Toaster() {
  const toasts = useToast((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="anim-rise rounded-full bg-lita-950 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {t.message}
        </div>
      ))}
    </div>
  )
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-lita-50 text-lita-700">{icon}</div>
      <p className="font-semibold text-ink">{title}</p>
      {children ? <div className="mt-1 max-w-xs text-sm text-ink-mute">{children}</div> : null}
    </div>
  )
}
