/**
 * Service Layer — จุดเดียวที่คุยกับ Backend
 * -------------------------------------------------------------
 * หน้าที่ของไฟล์นี้มี 2 อย่าง
 *   1. เรียก REST endpoint ตาม contract ของ Spring Boot
 *   2. แปลง DTO ฝั่ง server ให้เป็น model ที่ UI ใช้อยู่แล้ว (ดู toMenuItem)
 *
 * ทำ mapping ไว้ที่นี่ที่เดียว เพื่อให้หน้าจอไม่ต้องรู้ว่า API เรียกชื่อ field ว่าอะไร
 * ถ้าวันหลัง backend เปลี่ยนชื่อ field ก็แก้แค่ไฟล์นี้
 */
import { api, toQuery } from "../lib/apiClient";
import type {
  CartItem,
  DashboardSummary,
  MenuCategory,
  MenuItem,
  OptionGroup,
  Order,
  OrderStatus,
  OrderType,
  PublicOrder,
  UserProfile,
} from "../types";
import { ACTIVE_STATUSES } from "../data/constants";

/* ---------------------------------------------------------------- *
 * DTO ฝั่ง server (เฉพาะส่วนที่หน้าตาไม่ตรงกับ model ของ UI)
 * ---------------------------------------------------------------- */

interface MenuItemDto {
  id: string;
  name: string;
  nameTh: string;
  description: string | null;
  price: number;
  categoryId: string;
  emoji: string | null;
  imageUrl: string | null;
  available: boolean;
  optionGroups: OptionGroup[];
}

/**
 * server ส่งกลุ่มตัวเลือกมาเต็มก้อนในแต่ละเมนู แต่ UI เดิมเก็บแค่ id
 * แล้วไปหยิบรายละเอียดจาก store (เพราะกลุ่มเดียวใช้ซ้ำหลายเมนู)
 * จึงย่อให้เหลือ id ตรงนี้
 */
function toMenuItem(dto: MenuItemDto): MenuItem {
  return {
    id: dto.id,
    name: dto.name,
    nameTh: dto.nameTh ?? "",
    description: dto.description ?? "",
    price: dto.price,
    categoryId: dto.categoryId,
    emoji: dto.emoji ?? "🍽️",
    imageUrl: dto.imageUrl ?? undefined,
    optionGroupIds: dto.optionGroups.map((g) => g.id),
    isAvailable: dto.available,
    createdAt: "",
  };
}

/** ตัวเลือกที่เพิ่งสร้างในฟอร์มยังไม่มี id จริง — ส่ง null ให้ server ออก UUID ให้ */
const TEMP_ID_PREFIX = "tmp-";
export const tempChoiceId = () => `${TEMP_ID_PREFIX}${Math.random().toString(36).slice(2, 10)}`;
const toServerId = (id: string | undefined) => (!id || id.startsWith(TEMP_ID_PREFIX) ? null : id);

/* ---------------------------------------------------------------- *
 * Auth
 * ---------------------------------------------------------------- */

export interface LoginResult {
  token: string;
  expiresInSeconds: number;
  user: UserProfile;
}

export const authService = {
  /** POST /api/auth/login */
  login: (username: string, password: string) =>
    api.post<LoginResult>("/api/auth/login", { username, password }),

  /** GET /api/auth/me — ใช้เช็คตอนเปิดแอปว่า token ที่เก็บไว้ยังใช้ได้ */
  me: () => api.get<UserProfile>("/api/auth/me"),
};

/* ---------------------------------------------------------------- *
 * Menu category
 * ---------------------------------------------------------------- *
 * เดิมหมวดหมู่เป็นค่าตายตัวในโค้ด ตอนนี้อยู่ใน database แล้ว
 * ร้านจึงเพิ่ม/แก้ชื่อ/ลบเองได้โดยไม่ต้อง deploy ใหม่
 */

export interface SaveCategoryInput {
  id?: string;
  name: string;
  nameEn?: string;
  sortOrder?: number;
}

export const categoryService = {
  /** GET /api/categories */
  list: () => api.get<MenuCategory[]>("/api/categories"),

  /** POST /api/categories | PUT /api/categories/{id} — ADMIN เท่านั้น */
  save: (input: SaveCategoryInput) => {
    const body = {
      name: input.name,
      nameEn: input.nameEn || null,
      sortOrder: input.sortOrder ?? null,
    };
    return input.id
      ? api.put<MenuCategory>(`/api/categories/${input.id}`, body)
      : api.post<MenuCategory>("/api/categories", body);
  },

  /** DELETE /api/categories/{id} — server ปฏิเสธถ้ายังมีเมนูใช้หมวดนี้อยู่ */
  remove: (id: string) => api.del<void>(`/api/categories/${id}`),
};

/* ---------------------------------------------------------------- *
 * Menu
 * ---------------------------------------------------------------- */

export interface SaveMenuInput {
  id?: string;
  name: string;
  nameTh: string;
  description: string;
  price: number;
  categoryId: string;
  emoji: string;
  imageUrl?: string;
  optionGroupIds: string[];
  isAvailable: boolean;
}

export const menuService = {
  /** GET /api/menus */
  list: async (): Promise<MenuItem[]> => (await api.get<MenuItemDto[]>("/api/menus")).map(toMenuItem),

  /** POST /api/menus (สร้าง) | PUT /api/menus/{id} (แก้ไข) — ADMIN เท่านั้น */
  save: async (input: SaveMenuInput): Promise<MenuItem> => {
    const body = {
      name: input.name,
      nameTh: input.nameTh,
      description: input.description,
      price: input.price,
      categoryId: input.categoryId,
      emoji: input.emoji,
      imageUrl: input.imageUrl ?? null,
      available: input.isAvailable,
      optionGroupIds: input.optionGroupIds,
    };
    const dto = input.id
      ? await api.put<MenuItemDto>(`/api/menus/${input.id}`, body)
      : await api.post<MenuItemDto>("/api/menus", body);
    return toMenuItem(dto);
  },

  /** PATCH /api/menus/{id}/availability — STAFF ทำได้ เพราะเป็นงานหน้างานตอนของหมด */
  setAvailability: async (id: string, available: boolean): Promise<MenuItem> =>
    toMenuItem(await api.patch<MenuItemDto>(`/api/menus/${id}/availability`, { available })),

  /** DELETE /api/menus/{id} — ADMIN เท่านั้น */
  remove: (id: string) => api.del<void>(`/api/menus/${id}`),
};

/* ---------------------------------------------------------------- *
 * Option group
 * ---------------------------------------------------------------- */

export interface SaveOptionGroupInput {
  id?: string;
  name: string;
  type: OptionGroup["type"];
  required: boolean;
  defaultChoiceId?: string;
  choices: { id?: string; name: string; priceDelta: number }[];
}

export const optionGroupService = {
  /** GET /api/option-groups */
  list: () => api.get<OptionGroup[]>("/api/option-groups"),

  /** POST /api/option-groups | PUT /api/option-groups/{id} — ADMIN เท่านั้น */
  save: (input: SaveOptionGroupInput): Promise<OptionGroup> => {
    const body = {
      name: input.name,
      type: input.type,
      required: input.required,
      defaultChoiceId: toServerId(input.defaultChoiceId),
      choices: input.choices.map((c) => ({
        id: toServerId(c.id),
        name: c.name,
        priceDelta: c.priceDelta,
      })),
    };
    return input.id
      ? api.put<OptionGroup>(`/api/option-groups/${input.id}`, body)
      : api.post<OptionGroup>("/api/option-groups", body);
  },

  /** DELETE /api/option-groups/{id} — ADMIN เท่านั้น */
  remove: (id: string) => api.del<void>(`/api/option-groups/${id}`),
};

/* ---------------------------------------------------------------- *
 * Order
 * ---------------------------------------------------------------- */

export interface CreateOrderInput {
  orderType: OrderType;
  tableNo: string | null;
  items: CartItem[];
  note?: string;
}

export interface OrderSearchQuery {
  from?: string;
  to?: string;
  status?: OrderStatus;
  orderType?: OrderType;
  keyword?: string;
  page?: number;
  size?: number;
}

/** ตรงกับ PageResponse<T> ฝั่ง Backend */
export interface PagedOrders {
  content: Order[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const orderService = {
  /** GET /api/orders/active — ออเดอร์ที่ยังไม่ปิด ใช้เป็นข้อมูลตั้งต้นของกระดานครัวและผังโต๊ะ */
  active: () => api.get<Order[]>("/api/orders/active"),

  /**
   * POST /api/orders
   * ส่งแค่ menuId / qty / ตัวเลือก — ไม่ส่งราคา เพราะ server คำนวณเองจาก database
   * เพื่อไม่ให้ใครยิง API แก้ราคาได้
   */
  create: ({ orderType, tableNo, items, note }: CreateOrderInput) =>
    api.post<Order>("/api/orders", {
      orderType,
      tableNo: orderType === "DINE_IN" ? tableNo : null,
      note,
      items: items.map((item) => ({
        menuId: item.menuId,
        qty: item.qty,
        note: item.note,
        options: item.options.map((o) => ({ groupId: o.groupId, choiceId: o.choiceId })),
      })),
    }),

  /** PATCH /api/orders/{id}/status */
  updateStatus: (id: string, status: OrderStatus) =>
    api.patch<Order>(`/api/orders/${id}/status`, { status }),

  /** POST /api/tables/{tableNo}/close — ปิดบิลทุกออเดอร์ของโต๊ะพร้อมกัน */
  closeTable: (tableNo: string) => api.post<Order[]>(`/api/tables/${tableNo}/close`),

  /** GET /api/orders — ประวัติออเดอร์ มี filter และแบ่งหน้าจากฝั่ง server */
  search: (query: OrderSearchQuery) => api.get<PagedOrders>(`/api/orders${toQuery({ ...query })}`),
};

/** GET /api/public/orders/{token} — ลูกค้าสแกน QR ดูสถานะ ไม่ต้อง login */
export const publicOrderService = {
  track: (trackingToken: string) => api.get<PublicOrder>(`/api/public/orders/${trackingToken}`),
};

/* ---------------------------------------------------------------- *
 * Dashboard (ADMIN เท่านั้น — STAFF เรียกแล้วจะได้ 403)
 * ---------------------------------------------------------------- */

export const dashboardService = {
  summary: (days = 14) => api.get<DashboardSummary>(`/api/dashboard/summary?days=${days}`),
};

/* ---------------------------------------------------------------- *
 * Selector: สถานะโต๊ะ
 * ---------------------------------------------------------------- *
 * คำนวณจากออเดอร์ที่ store มีอยู่แล้ว ไม่ต้องยิง API เพิ่ม
 * ทำให้ผังโต๊ะอัปเดตทันทีที่ SSE ส่งออเดอร์ใหม่เข้ามา
 */

export interface TableState {
  tableNo: string;
  orders: Order[];
  total: number;
  since: string | null;
  /** สถานะที่ "ช้าที่สุด" ของโต๊ะ ใช้แสดงสีบนผัง */
  stage: "FREE" | OrderStatus;
}

const STAGE_RANK: OrderStatus[] = ["PENDING", "PREPARING", "READY", "SERVED"];

export function getTableState(orders: Order[], tableNo: string): TableState {
  const active = orders.filter((o) => o.tableNo === tableNo && ACTIVE_STATUSES.includes(o.status));
  if (active.length === 0) return { tableNo, orders: [], total: 0, since: null, stage: "FREE" };
  const stage = STAGE_RANK.find((s) => active.some((o) => o.status === s)) ?? "SERVED";
  return {
    tableNo,
    orders: active,
    total: active.reduce((sum, o) => sum + o.totalAmount, 0),
    since: active.map((o) => o.createdAt).sort()[0],
    stage,
  };
}
