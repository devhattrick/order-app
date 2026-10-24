import type { MenuItem, OptionGroup, Order, OrderItem, OrderStatus, OrderType, SelectedOption } from '../types'
import { ACTIVE_STATUSES, TABLES } from './constants'
import { formatOrderNo, formatQueueNo, uid } from '../utils/format'

export const SEED_OPTION_GROUPS: OptionGroup[] = [
  {
    id: 'size',
    name: 'ขนาด',
    type: 'SINGLE',
    required: true,
    defaultChoiceId: 'size-r',
    choices: [
      { id: 'size-r', name: 'Regular 12 oz', priceDelta: 0 },
      { id: 'size-l', name: 'Large 16 oz', priceDelta: 20 },
    ],
  },
  {
    id: 'sweet',
    name: 'ระดับความหวาน',
    type: 'SINGLE',
    required: true,
    defaultChoiceId: 'sweet-50',
    choices: [
      { id: 'sweet-0', name: 'ไม่หวาน 0%', priceDelta: 0 },
      { id: 'sweet-25', name: 'หวานน้อย 25%', priceDelta: 0 },
      { id: 'sweet-50', name: 'หวานปกติ 50%', priceDelta: 0 },
      { id: 'sweet-100', name: 'หวานมาก 100%', priceDelta: 0 },
    ],
  },
  {
    id: 'addon',
    name: 'เพิ่มท็อปปิ้ง',
    type: 'MULTI',
    required: false,
    choices: [
      { id: 'add-egg', name: 'ไข่ดาว', priceDelta: 15 },
      { id: 'add-cheese', name: 'ชีสเชดดาร์', priceDelta: 20 },
      { id: 'add-tomato', name: 'มะเขือเทศ', priceDelta: 10 },
      { id: 'add-bacon', name: 'เบคอน', priceDelta: 30 },
      { id: 'add-avo', name: 'อะโวคาโด', priceDelta: 35 },
    ],
  },
  {
    id: 'warm',
    name: 'การเสิร์ฟ',
    type: 'SINGLE',
    required: false,
    defaultChoiceId: 'warm-yes',
    choices: [
      { id: 'warm-yes', name: 'อุ่นร้อน', priceDelta: 0 },
      { id: 'warm-no', name: 'ไม่อุ่น', priceDelta: 0 },
    ],
  },
  {
    id: 'slice',
    name: 'การหั่น',
    type: 'SINGLE',
    required: true,
    defaultChoiceId: 'slice-whole',
    choices: [
      { id: 'slice-whole', name: 'ทั้งก้อน', priceDelta: 0 },
      { id: 'slice-cut', name: 'หั่นสไลซ์', priceDelta: 0 },
    ],
  },
]

const m = (
  id: string,
  name: string,
  nameTh: string,
  description: string,
  price: number,
  category: MenuItem['category'],
  emoji: string,
  optionGroupIds: string[],
): MenuItem => ({
  id,
  name,
  nameTh,
  description,
  price,
  category,
  emoji,
  optionGroupIds,
  isAvailable: true,
  createdAt: '2026-01-01T00:00:00.000Z',
})

export const SEED_MENUS: MenuItem[] = [
  m('m-ham', 'Ham & Cheese Melt', 'แฮมชีสเมลต์', 'แฮมรมควัน ชีสเชดดาร์ละลาย บนซาวโดว์ปิ้งเนย', 159, 'SANDWICH', '🥪', ['addon']),
  m('m-avo', 'Avocado Smash Toast', 'อะโวคาโดสแมชโทสต์', 'อะโวคาโดบด มะนาว พริกป่น บนซาวโดว์โฮลวีต', 189, 'SANDWICH', '🥑', ['addon']),
  m('m-tuna', 'Tuna Melt', 'ทูน่าเมลต์', 'ทูน่ามายองเนส หอมแดง ชีสอบ', 169, 'SANDWICH', '🐟', ['addon']),
  m('m-pesto', 'Chicken Pesto Panini', 'ปานินีไก่เพสโต้', 'อกไก่ย่าง ซอสเพสโต้โหระพา มอสซาเรลลา', 179, 'SANDWICH', '🍗', ['addon']),
  m('m-eggb', 'Egg & Bacon Toast', 'โทสต์ไข่เบคอน', 'ไข่คนนุ่ม เบคอนกรอบ บนซาวโดว์คันทรี', 149, 'SANDWICH', '🍳', ['addon']),
  m('m-country', 'Country Sourdough', 'ซาวโดว์คันทรี', 'ก้อนคลาสสิก หมักยีสต์ธรรมชาติ 36 ชั่วโมง', 220, 'BREAD', '🍞', ['slice']),
  m('m-wheat', 'Whole Wheat Sourdough', 'ซาวโดว์โฮลวีต', 'แป้งโฮลวีต 50% เนื้อแน่น หอมธัญพืช', 240, 'BREAD', '🌾', ['slice']),
  m('m-olive', 'Olive & Rosemary', 'ซาวโดว์มะกอกโรสแมรี่', 'มะกอกดำ คาลามาตา และโรสแมรี่สด', 260, 'BREAD', '🫒', ['slice']),
  m('m-garlic', 'Garlic Butter Slice', 'ขนมปังเนยกระเทียม', 'ซาวโดว์สไลซ์หนา ทาเนยกระเทียมอบกรอบ', 89, 'BREAD', '🧄', []),
  m('m-latte', 'Latte', 'ลาเต้', 'เอสเปรสโซ่ช็อตคู่ กับนมสดสตีม', 85, 'DRINK', '☕', ['size', 'sweet']),
  m('m-amer', 'Americano', 'อเมริกาโน่', 'เมล็ดคั่วกลาง กลิ่นถั่วและคาราเมล', 70, 'DRINK', '🫖', ['size', 'sweet']),
  m('m-matcha', 'Matcha Latte', 'มัทฉะลาเต้', 'มัทฉะเกรดพิธีชงจากอุจิ', 95, 'DRINK', '🍵', ['size', 'sweet']),
  m('m-choco', 'Dark Chocolate', 'ช็อกโกแลตเข้มข้น', 'โกโก้ 70% กับนมสด', 85, 'DRINK', '🍫', ['size', 'sweet']),
  m('m-lemon', 'Lemon Honey Soda', 'เลมอนน้ำผึ้งโซดา', 'เลมอนสด น้ำผึ้งป่า โซดาซ่า', 75, 'DRINK', '🍋', ['size', 'sweet']),
  m('m-cinna', 'Sourdough Cinnamon Roll', 'ซินนามอนโรลซาวโดว์', 'แป้งซาวโดว์ม้วนอบเชย ราดครีมชีส', 95, 'DESSERT', '🌀', ['warm']),
  m('m-brownie', 'Sourdough Brownie', 'บราวนี่ซาวโดว์', 'ช็อกโกแลตเข้ม หนึบ ขอบกรอบ', 85, 'DESSERT', '🟫', ['warm']),
  m('m-basque', 'Basque Cheesecake', 'บาสก์ชีสเค้ก', 'หน้าไหม้ เนื้อในเนียนละลาย', 135, 'DESSERT', '🍰', []),
  m('m-banana', 'Banana Bread', 'บานาน่าเบรด', 'กล้วยหอมสุก วอลนัท แป้งซาวโดว์', 90, 'DESSERT', '🍌', ['warm']),
  m('m-croissant', 'Butter Croissant', 'ครัวซองต์เนยสด', 'เนยฝรั่งเศส 27 ชั้น กรอบนอกนุ่มใน', 79, 'DESSERT', '🥐', ['warm']),
]

/* ---------- Generate mock order history (deterministic) ---------- */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// น้ำหนักความนิยมของเมนู (ใช้ให้ Top 5 ดูสมจริง)
const POPULARITY: Record<string, number> = {
  'm-latte': 10, 'm-avo': 8, 'm-ham': 7, 'm-cinna': 7, 'm-croissant': 6, 'm-matcha': 6,
  'm-basque': 5, 'm-amer': 5, 'm-country': 4, 'm-eggb': 4, 'm-tuna': 3, 'm-brownie': 3,
  'm-pesto': 3, 'm-lemon': 3, 'm-choco': 2, 'm-banana': 2, 'm-garlic': 2, 'm-wheat': 2, 'm-olive': 1,
}

// ชั่วโมงเปิดร้าน 8:00–19:00 พร้อมน้ำหนัก peak เช้า/เที่ยง
const HOUR_WEIGHTS: [number, number][] = [
  [8, 6], [9, 9], [10, 7], [11, 6], [12, 9], [13, 7], [14, 4], [15, 5], [16, 4], [17, 3], [18, 2],
]

export function buildSeedOrders(now: Date = new Date()): Order[] {
  const rand = mulberry32(20261024)
  const pick = <T,>(arr: [T, number][]) => {
    const total = arr.reduce((s, [, w]) => s + w, 0)
    let r = rand() * total
    for (const [v, w] of arr) {
      r -= w
      if (r <= 0) return v
    }
    return arr[arr.length - 1][0]
  }
  const menuPool: [string, number][] = Object.entries(POPULARITY)
  const menuById = Object.fromEntries(SEED_MENUS.map((x) => [x.id, x]))
  const groupById = Object.fromEntries(SEED_OPTION_GROUPS.map((g) => [g.id, g]))

  const orders: Order[] = []
  const DAYS = 14

  for (let d = DAYS - 1; d >= 0; d--) {
    const day = new Date(now)
    day.setDate(now.getDate() - d)
    day.setHours(0, 0, 0, 0)
    const isToday = d === 0
    const weekend = day.getDay() === 0 || day.getDay() === 6
    let count = Math.round((weekend ? 34 : 24) + rand() * 10)
    const currentHour = now.getHours()

    const slots: Date[] = []
    for (let i = 0; i < count; i++) {
      const h = pick(HOUR_WEIGHTS)
      if (isToday && h > currentHour) continue
      const t = new Date(day)
      t.setHours(h, Math.floor(rand() * 60), Math.floor(rand() * 60))
      if (isToday && t > now) continue
      slots.push(t)
    }
    slots.sort((a, b) => a.getTime() - b.getTime())
    count = slots.length

    let seqAll = 0
    let seqDine = 0
    let seqTake = 0
    slots.forEach((createdAt, idx) => {
      const orderType: OrderType = rand() < 0.58 ? 'DINE_IN' : 'TAKEAWAY'
      seqAll++
      const queueSeq = orderType === 'DINE_IN' ? ++seqDine : ++seqTake
      const nItems = 1 + Math.floor(rand() * 3)
      const items: OrderItem[] = []
      for (let k = 0; k < nItems; k++) {
        const menu = menuById[pick(menuPool)]
        const options: SelectedOption[] = []
        for (const gid of menu.optionGroupIds) {
          const g = groupById[gid]
          if (g.type === 'SINGLE') {
            const c = rand() < 0.6 ? g.choices.find((x) => x.id === g.defaultChoiceId) ?? g.choices[0] : g.choices[Math.floor(rand() * g.choices.length)]
            options.push({ groupId: g.id, groupName: g.name, choiceId: c.id, choiceName: c.name, priceDelta: c.priceDelta })
          } else if (rand() < 0.45) {
            const c = g.choices[Math.floor(rand() * g.choices.length)]
            options.push({ groupId: g.id, groupName: g.name, choiceId: c.id, choiceName: c.name, priceDelta: c.priceDelta })
          }
        }
        const unitPrice = menu.price + options.reduce((s, o) => s + o.priceDelta, 0)
        const qty = rand() < 0.8 ? 1 : 2
        items.push({
          menuId: menu.id,
          menuName: menu.name,
          category: menu.category,
          emoji: menu.emoji,
          options,
          unitPrice,
          qty,
          lineTotal: unitPrice * qty,
        })
      }
      const totalAmount = items.reduce((s, i) => s + i.lineTotal, 0)

      // วันนี้: ออเดอร์ล่าสุด ๆ ยังอยู่ในสถานะ active เพื่อให้ Board มีของ
      let status: OrderStatus = rand() < 0.03 ? 'CANCELLED' : 'COMPLETED'
      const fromEnd = count - idx
      if (isToday && fromEnd <= 6)
        status = (['SERVED', 'READY', 'PREPARING', 'PREPARING', 'PENDING', 'PENDING'] as OrderStatus[])[6 - fromEnd]
      // SERVED ใช้ได้เฉพาะทานที่ร้าน — ซื้อกลับส่งมอบแล้วจบเป็น COMPLETED เลย
      if (status === 'SERVED' && orderType === 'TAKEAWAY') status = 'READY'

      const history = [{ status: 'PENDING' as OrderStatus, at: createdAt.toISOString() }]
      const flow: OrderStatus[] =
        status === 'CANCELLED'
          ? ['CANCELLED']
          : orderType === 'DINE_IN'
            ? ['PREPARING', 'READY', 'SERVED', 'COMPLETED']
            : ['PREPARING', 'READY', 'COMPLETED']
      let cursor = createdAt.getTime()
      for (const s of flow) {
        cursor += (3 + Math.floor(rand() * 9)) * 60000
        history.push({ status: s, at: new Date(Math.min(cursor, now.getTime())).toISOString() })
        if (s === status) break
      }
      if (status === 'PENDING') history.splice(1)

      orders.push({
        id: uid(),
        orderNo: formatOrderNo(createdAt, seqAll),
        queueNo: formatQueueNo(orderType, queueSeq),
        orderType,
        tableNo: null,
        items,
        totalAmount,
        status,
        source: rand() < 0.5 ? 'CUSTOMER' : 'POS',
        paidAt:
          orderType === 'TAKEAWAY'
            ? status === 'CANCELLED'
              ? null
              : createdAt.toISOString()
            : status === 'COMPLETED'
              ? history[history.length - 1].at
              : null,
        createdAt: createdAt.toISOString(),
        updatedAt: history[history.length - 1].at,
        statusHistory: history,
      })
    })
  }

  // ใส่โต๊ะให้ออเดอร์ทานที่ร้าน: active ของวันนี้ใช้โต๊ะไม่ซ้ำกัน
  const usedToday = new Set<string>()
  const freeTables = ['T2', 'T4', 'T6', 'T9', 'T3', 'T7']
  for (const o of orders) {
    if (o.orderType !== 'DINE_IN') continue
    if (ACTIVE_STATUSES.includes(o.status)) {
      const t = freeTables.find((x) => !usedToday.has(x)) ?? 'T1'
      usedToday.add(t)
      o.tableNo = t
    } else {
      o.tableNo = TABLES[Math.floor(rand() * TABLES.length)].tableNo
    }
  }
  return orders
}
