/**
 * Mock Service Layer
 * -------------------------------------------------------------
 * ตอนนี้ทุก function อ่าน/เขียนผ่าน zustand store (persist ลง localStorage)
 * เมื่อมี Backend (Spring Boot) จริง ให้เปลี่ยน implementation ในไฟล์นี้
 * เป็น fetch/axios ตาม Endpoint ที่ระบุใน comment โดย UI ไม่ต้องแก้
 */
import { useAppStore, type CreateOrderInput } from '../store/useAppStore'
import type { MenuItem, Order, OrderStatus } from '../types'
import { ACTIVE_STATUSES } from '../data/constants'

const store = () => useAppStore.getState()

export const orderService = {
  /** POST /api/orders */
  create: (input: CreateOrderInput): Order => store().createOrder(input),
  /** PATCH /api/orders/{id}/status */
  updateStatus: (id: string, status: OrderStatus) => store().updateOrderStatus(id, status),
  /** POST /api/tables/{tableNo}/close */
  closeTable: (tableNo: string) => store().closeTable(tableNo),
}

export const menuService = {
  /** POST /api/menus  |  PUT /api/menus/{id} */
  save: (menu: Omit<MenuItem, 'id' | 'createdAt'> & { id?: string }) => store().upsertMenu(menu),
  /** PATCH /api/menus/{id}/availability */
  toggleAvailability: (id: string) => store().toggleMenuAvailability(id),
  /** DELETE /api/menus/{id} */
  remove: (id: string) => store().deleteMenu(id),
}

/* ---------- Selectors (ฝั่ง Backend = GET /api/tables) ---------- */

export interface TableState {
  tableNo: string
  orders: Order[]
  total: number
  since: string | null
  /** สถานะที่ "ช้าที่สุด" ของโต๊ะ ใช้แสดงสีบนผัง */
  stage: 'FREE' | OrderStatus
}

const STAGE_RANK: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED']

export function getTableState(orders: Order[], tableNo: string): TableState {
  const active = orders.filter((o) => o.tableNo === tableNo && ACTIVE_STATUSES.includes(o.status))
  if (active.length === 0) return { tableNo, orders: [], total: 0, since: null, stage: 'FREE' }
  const stage = STAGE_RANK.find((s) => active.some((o) => o.status === s)) ?? 'SERVED'
  return {
    tableNo,
    orders: active,
    total: active.reduce((s, o) => s + o.totalAmount, 0),
    since: active.map((o) => o.createdAt).sort()[0],
    stage,
  }
}
