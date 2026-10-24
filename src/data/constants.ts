import type { Category, Order, OrderStatus, OrderType, Table } from '../types'

export const SHOP_NAME = 'Lita'
export const SHOP_TAGLINE = 'Sourdough bakery & café'

export const CATEGORIES: { id: Category; label: string; labelEn: string }[] = [
  { id: 'SANDWICH', label: 'แซนด์วิช & โทสต์', labelEn: 'Sandwiches' },
  { id: 'BREAD', label: 'ขนมปังซาวโดว์', labelEn: 'Loaves' },
  { id: 'DRINK', label: 'เครื่องดื่ม', labelEn: 'Drinks' },
  { id: 'DESSERT', label: 'ขนม', labelEn: 'Sweets' },
]

export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.id === c)?.label ?? c

export const TABLES: Table[] = Array.from({ length: 10 }, (_, i) => ({
  tableNo: `T${i + 1}`,
  seats: [2, 2, 4, 4, 4, 6, 2, 4, 4, 8][i],
}))

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  DINE_IN: 'ทานที่ร้าน',
  TAKEAWAY: 'ซื้อกลับ',
}

export const STATUS_META: Record<OrderStatus, { label: string; badge: string; dot: string }> = {
  PENDING: { label: 'รอรับออเดอร์', badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  PREPARING: { label: 'กำลังทำ', badge: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sky-500' },
  READY: { label: 'พร้อมเสิร์ฟ', badge: 'bg-lita-50 text-lita-800 ring-lita-200', dot: 'bg-lita-600' },
  SERVED: { label: 'รอเช็คบิล', badge: 'bg-[#FBF5E9] text-[#86672E] ring-[#E7D6B2]', dot: 'bg-wheat' },
  COMPLETED: { label: 'เสร็จสิ้น', badge: 'bg-zinc-100 text-zinc-700 ring-zinc-200', dot: 'bg-zinc-400' },
  CANCELLED: { label: 'ยกเลิก', badge: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
}

/**
 * Flow ของสถานะ แยกตามประเภทออเดอร์
 *  - DINE_IN  : PENDING → PREPARING → READY → SERVED → (เช็คบิลที่ผังโต๊ะ) → COMPLETED
 *  - TAKEAWAY : PENDING → PREPARING → READY → COMPLETED (ชำระเงินไปแล้วตอนสั่ง ส่งมอบ = จบ)
 * คืน null = ไม่มีปุ่มเดินสถานะต่อบนกระดานครัว (ต้องไปปิดบิลที่ผังโต๊ะ)
 */
export function nextStatus(order: Pick<Order, 'status' | 'orderType'>): { to: OrderStatus; action: string } | null {
  switch (order.status) {
    case 'PENDING':
      return { to: 'PREPARING', action: 'เริ่มทำ' }
    case 'PREPARING':
      return { to: 'READY', action: 'ทำเสร็จแล้ว' }
    case 'READY':
      return order.orderType === 'DINE_IN'
        ? { to: 'SERVED', action: 'เสิร์ฟแล้ว' }
        : { to: 'COMPLETED', action: 'ส่งมอบแล้ว' }
    default:
      return null
  }
}

/** สถานะที่ถือว่าออเดอร์ยัง "เปิดอยู่" — โต๊ะยังไม่ว่าง */
export const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED']

/** คอลัมน์บนกระดานครัว */
export const BOARD_COLUMNS: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED']
