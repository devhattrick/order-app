import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, MenuItem, OptionGroup, Order, OrderSource, OrderStatus, OrderType } from '../types'
import { SEED_MENUS, SEED_OPTION_GROUPS, buildSeedOrders } from '../data/seed'
import { dateKey, formatOrderNo, formatQueueNo, uid } from '../utils/format'

export interface CreateOrderInput {
  orderType: OrderType
  tableNo: string | null
  items: CartItem[]
  source: OrderSource
  note?: string
}

interface AppState {
  menus: MenuItem[]
  optionGroups: OptionGroup[]
  orders: Order[]
  createOrder: (input: CreateOrderInput) => Order
  updateOrderStatus: (id: string, status: OrderStatus) => void
  closeTable: (tableNo: string) => void
  upsertMenu: (menu: Omit<MenuItem, 'id' | 'createdAt'> & { id?: string }) => MenuItem
  upsertOptionGroup: (group: Omit<OptionGroup, 'id'> & { id?: string }) => OptionGroup
  deleteOptionGroup: (id: string) => void
  toggleMenuAvailability: (id: string) => void
  deleteMenu: (id: string) => void
  resetDemo: () => void
}

const initialData = () => ({
  menus: SEED_MENUS,
  optionGroups: SEED_OPTION_GROUPS,
  orders: buildSeedOrders(),
})

export const STORAGE_KEY = 'lita-order-app'

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      createOrder: ({ orderType, tableNo, items, source, note }) => {
        const now = new Date()
        const today = dateKey(now)
        const todays = get().orders.filter((o) => dateKey(o.createdAt) === today)
        const seqAll = todays.length + 1
        const seqType = todays.filter((o) => o.orderType === orderType).length + 1
        const menus = get().menus
        const at = now.toISOString()
        const order: Order = {
          id: uid(),
          orderNo: formatOrderNo(now, seqAll),
          queueNo: formatQueueNo(orderType, seqType),
          orderType,
          tableNo: orderType === 'DINE_IN' ? tableNo : null,
          items: items.map((c) => ({
            menuId: c.menuId,
            menuName: c.name,
            category: menus.find((m) => m.id === c.menuId)?.category ?? 'SANDWICH',
            emoji: c.emoji,
            options: c.options,
            unitPrice: c.unitPrice,
            qty: c.qty,
            lineTotal: c.unitPrice * c.qty,
            note: c.note,
          })),
          totalAmount: items.reduce((s, c) => s + c.unitPrice * c.qty, 0),
          status: 'PENDING',
          source,
          note,
          // ซื้อกลับ = ชำระเงินตอนสั่งที่เคาน์เตอร์ก่อนเข้าครัว / ทานที่ร้าน = ชำระตอนเช็คบิล
          paidAt: orderType === 'TAKEAWAY' ? at : null,
          createdAt: at,
          updatedAt: at,
          statusHistory: [{ status: 'PENDING', at }],
        }
        set((s) => ({ orders: [...s.orders, order] }))
        return order
      },

      updateOrderStatus: (id, status) => {
        const at = new Date().toISOString()
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status, updatedAt: at, statusHistory: [...o.statusHistory, { status, at }] } : o,
          ),
        }))
      },

      closeTable: (tableNo) => {
        const at = new Date().toISOString()
        set((s) => ({
          orders: s.orders.map((o) =>
            o.tableNo === tableNo && ['PENDING', 'PREPARING', 'READY', 'SERVED'].includes(o.status)
              ? { ...o, status: 'COMPLETED', paidAt: o.paidAt ?? at, updatedAt: at, statusHistory: [...o.statusHistory, { status: 'COMPLETED', at }] }
              : o,
          ),
        }))
      },

      upsertMenu: (input) => {
        if (input.id) {
          const updated = { ...get().menus.find((m) => m.id === input.id)!, ...input } as MenuItem
          set((s) => ({ menus: s.menus.map((m) => (m.id === input.id ? updated : m)) }))
          return updated
        }
        const created: MenuItem = { ...input, id: `m-${uid().slice(0, 8)}`, createdAt: new Date().toISOString() }
        set((s) => ({ menus: [...s.menus, created] }))
        return created
      },

      upsertOptionGroup: (input) => {
        // กัน defaultChoiceId ชี้ไปยังตัวเลือกที่ถูกลบไปแล้ว
        const clean = {
          ...input,
          defaultChoiceId: input.choices.some((c) => c.id === input.defaultChoiceId) ? input.defaultChoiceId : undefined,
        }
        if (input.id) {
          const updated = { ...clean, id: input.id } as OptionGroup
          set((s) => ({ optionGroups: s.optionGroups.map((g) => (g.id === input.id ? updated : g)) }))
          return updated
        }
        const created: OptionGroup = { ...clean, id: `og-${uid().slice(0, 8)}` }
        set((s) => ({ optionGroups: [...s.optionGroups, created] }))
        return created
      },

      /** ลบกลุ่มตัวเลือก แล้วถอดออกจากทุกเมนูที่อ้างถึง (ออเดอร์เก่าไม่กระทบ เพราะเก็บ snapshot ไว้แล้ว) */
      deleteOptionGroup: (id) =>
        set((s) => ({
          optionGroups: s.optionGroups.filter((g) => g.id !== id),
          menus: s.menus.map((m) =>
            m.optionGroupIds.includes(id) ? { ...m, optionGroupIds: m.optionGroupIds.filter((x) => x !== id) } : m,
          ),
        })),

      toggleMenuAvailability: (id) =>
        set((s) => ({ menus: s.menus.map((m) => (m.id === id ? { ...m, isAvailable: !m.isAvailable } : m)) })),

      deleteMenu: (id) => set((s) => ({ menus: s.menus.filter((m) => m.id !== id) })),

      resetDemo: () => set(initialData()),
    }),
    { name: STORAGE_KEY, version: 2 },
  ),
)

// Sync ข้ามแท็บ: เปิดหน้าลูกค้ากับหน้าร้านคนละแท็บ แล้วข้อมูลอัปเดตตามกันทันที
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) useAppStore.persist.rehydrate()
  })
}
