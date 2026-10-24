import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, OrderType } from '../types'

/**
 * แยกตะกร้าตาม context:
 *  - 'customer'      = ตะกร้าของลูกค้าที่สั่งเองจากมือถือ
 *  - 'pos:T1'..'T10' = ตะกร้าที่พนักงานกำลังคีย์ให้โต๊ะนั้น
 *  - 'pos:TAKEAWAY'  = ตะกร้าที่พนักงานคีย์ให้ลูกค้าซื้อกลับ
 */
export type CartKey = string

interface CustomerSession {
  orderType: OrderType | null
  tableNo: string | null
  lastOrderId?: string | null
}

interface CartState {
  carts: Record<CartKey, CartItem[]>
  session: CustomerSession
  setSession: (s: Partial<CustomerSession>) => void
  addItem: (cart: CartKey, item: CartItem) => void
  setQty: (cart: CartKey, key: string, qty: number) => void
  clear: (cart: CartKey) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      session: { orderType: null, tableNo: null },
      setSession: (s) => set((st) => ({ session: { ...st.session, ...s } })),
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
