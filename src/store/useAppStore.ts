import { create } from "zustand";
import { menuService, optionGroupService, orderService } from "../services";
import type { MenuItem, OptionGroup, Order } from "../types";

/**
 * ที่เก็บข้อมูลฝั่งหน้าจอ (cache ของข้อมูลจาก Backend)
 * -------------------------------------------------------------
 * ก่อนหน้านี้ store ตัวนี้เป็น "ฐานข้อมูลปลอม" เก็บใน localStorage
 * ตอนนี้ Backend เป็นเจ้าของข้อมูลจริงแล้ว store จึงเหลือหน้าที่แค่
 *   1. โหลดข้อมูลจาก API มาพักไว้ให้ทุกหน้าใช้ร่วมกัน
 *   2. รับ event จาก SSE มาอัปเดตออเดอร์แบบ realtime
 *
 * orders ที่เก็บไว้คือ "ออเดอร์ที่ยังไม่ปิด" เท่านั้น (GET /api/orders/active)
 * เพราะผังโต๊ะกับกระดานครัวใช้แค่ชุดนี้
 * ส่วนประวัติย้อนหลังหน้า History ยิง API แยกพร้อม filter และแบ่งหน้าจาก server
 */

interface AppState {
  menus: MenuItem[];
  optionGroups: OptionGroup[];
  orders: Order[];
  /** โหลดข้อมูลตั้งต้นเสร็จแล้วหรือยัง ใช้กันหน้าจอกระพริบตอนเปิดแอป */
  ready: boolean;
  error: string | null;

  loadAll: () => Promise<void>;
  refreshMenus: () => Promise<void>;
  refreshOptionGroups: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  /** เอาออเดอร์ที่เปลี่ยนแปลง (จาก API response หรือ SSE) มาใส่ในรายการ */
  applyOrder: (order: Order) => void;
  applyOrders: (orders: Order[]) => void;
  reset: () => void;
}

/** ออเดอร์ที่ปิดไปแล้วไม่ต้องค้างในหน้าจอหน้าร้าน — ไปดูที่หน้าประวัติแทน */
const isOpen = (order: Order) => order.status !== "COMPLETED" && order.status !== "CANCELLED";

export const useAppStore = create<AppState>()((set, get) => ({
  menus: [],
  optionGroups: [],
  orders: [],
  ready: false,
  error: null,

  loadAll: async () => {
    try {
      const [menus, optionGroups, orders] = await Promise.all([
        menuService.list(),
        optionGroupService.list(),
        orderService.active(),
      ]);
      set({ menus, optionGroups, orders, ready: true, error: null });
    } catch {
      set({ ready: true, error: "โหลดข้อมูลจากเซิร์ฟเวอร์ไม่สำเร็จ" });
    }
  },

  refreshMenus: async () => set({ menus: await menuService.list() }),

  refreshOptionGroups: async () => set({ optionGroups: await optionGroupService.list() }),

  refreshOrders: async () => set({ orders: await orderService.active() }),

  applyOrder: (order) => {
    const rest = get().orders.filter((o) => o.id !== order.id);
    set({ orders: isOpen(order) ? [...rest, order] : rest });
  },

  applyOrders: (orders) => {
    for (const order of orders) get().applyOrder(order);
  },

  reset: () => set({ menus: [], optionGroups: [], orders: [], ready: false, error: null }),
}));
