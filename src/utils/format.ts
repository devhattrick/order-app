import type { OrderType } from '../types'

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const pad = (n: number, len = 3) => String(n).padStart(len, '0')

export const dateKey = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d) : d
  return `${x.getFullYear()}${pad(x.getMonth() + 1, 2)}${pad(x.getDate(), 2)}`
}

/** orderNo = YYYYMMDD-NNN (running ต่อวัน) */
export const formatOrderNo = (d: Date, seq: number) => `${dateKey(d)}-${pad(seq)}`

/** queueNo = D-001 (ทานที่ร้าน) / T-001 (ซื้อกลับ) — reset ทุกวัน */
export const formatQueueNo = (type: OrderType, seq: number) => `${type === 'DINE_IN' ? 'D' : 'T'}-${pad(seq)}`

const thb = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 })
export const baht = (n: number) => `฿${thb.format(n)}`

export const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

export const dateOf = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })

export const minutesAgo = (iso: string, now = Date.now()) => Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000))

export const sameDay = (a: Date | string, b: Date | string) => dateKey(a) === dateKey(b)
