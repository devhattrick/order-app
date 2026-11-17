import type { Order } from '../types'

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const pad = (n: number, len = 3) => String(n).padStart(len, '0')

export const dateKey = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d) : d
  return `${x.getFullYear()}${pad(x.getMonth() + 1, 2)}${pad(x.getDate(), 2)}`
}

const thb = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 })
export const baht = (n: number) => `฿${thb.format(n)}`

export const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

export const dateOf = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })

export const minutesAgo = (iso: string, now = Date.now()) => Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000))

export const sameDay = (a: Date | string, b: Date | string) => dateKey(a) === dateKey(b)

/**
 * ลิงก์หน้าติดตามสถานะออเดอร์ — ใช้ทำ QR บนใบเสร็จ
 *
 * ใช้ trackingToken ที่ server สุ่มให้ ไม่ใช่ id จริงของออเดอร์
 * ลูกค้าจึงเดา url ของออเดอร์โต๊ะอื่นไม่ได้ และเปิดดูได้จากมือถือเครื่องไหนก็ได้
 * เพราะข้อมูลมาจาก API ไม่ใช่ localStorage ของเครื่องที่ออกบิล
 */
export const orderTrackUrl = (order: Pick<Order, 'trackingToken'>) =>
  `${window.location.origin}${window.location.pathname}#/track/${order.trackingToken}`
