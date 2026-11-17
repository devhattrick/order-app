import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '../types'

/**
 * ตะกร้า "ที่กำลังคีย์" ของพนักงาน แยกตามโต๊ะ
 *  - 'pos:T1'..'T10' = ตะกร้าที่พนักงานกำลังคีย์ให้โต๊ะนั้น
 *  - 'pos:TAKEAWAY'  = ตะกร้าที่พนักงานคีย์ให้ลูกค้าซื้อกลับ
 *
 * เก็บใน localStorage เพื่อไม่ให้รายการที่คีย์ค้างไว้หายตอนเผลอรีเฟรชหน้า
 * ยังไม่ส่งเข้าครัวจนกว่าจะกดยืนยัน จึงไม่ต้องขึ้นไปอยู่บน server
 */
export type CartKey = string

interface CartState {
  carts: Record<CartKey, CartItem[]>
  addItem: (cart: CartKey, item: CartItem) => void
  setQty: (cart: CartKey, key: string, qty: number) => void
  clear: (cart: CartKey) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      addItem: (cart, item) =>
        set((st) => {
          const list = st.carts[cart] ?? []
          const found = list.find((x) => x.key === item.key)
          const next = found
            ? list.map((x) => (x.key === item.key ? { ...x, qty: x.qty + item.qty } : x))
            : [...list, item]
          return { carts: { ...st.carts, [cart]: next } }
        }),
      setQty: (cart, key, qty) =>
        set((st) => {
          const list = st.carts[cart] ?? []
          const next = qty <= 0 ? list.filter((x) => x.key !== key) : list.map((x) => (x.key === key ? { ...x, qty } : x))
          return { carts: { ...st.carts, [cart]: next } }
        }),
      clear: (cart) => set((st) => ({ carts: { ...st.carts, [cart]: [] } })),
    }),
    { name: 'lita-carts', version: 1 },
  ),
)

const EMPTY: CartItem[] = []
export const useCart = (cart: CartKey) => useCartStore((s) => s.carts[cart] ?? EMPTY)

export const cartTotal = (items: CartItem[]) => items.reduce((s, i) => s + i.unitPrice * i.qty, 0)
export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0)
