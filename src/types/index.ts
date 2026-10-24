export type Category = 'SANDWICH' | 'BREAD' | 'DRINK' | 'DESSERT'

export type OrderType = 'DINE_IN' | 'TAKEAWAY'

/**
 * PENDING    รอรับออเดอร์
 * PREPARING  ครัวกำลังทำ
 * READY      ทำเสร็จ พร้อมเสิร์ฟ/รับ
 * SERVED     เสิร์ฟถึงโต๊ะแล้ว แต่ยังไม่ชำระเงิน (ใช้เฉพาะ DINE_IN)
 * COMPLETED  ปิดบิล/ชำระเงินแล้ว
 */
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED'

export type OrderSource = 'CUSTOMER' | 'POS'

export interface OptionChoice {
  id: string
  name: string
  priceDelta: number
}

export interface OptionGroup {
  id: string
  name: string
  /** SINGLE = เลือกได้ 1 อย่าง (radio), MULTI = เลือกได้หลายอย่าง (checkbox) */
  type: 'SINGLE' | 'MULTI'
  required: boolean
  choices: OptionChoice[]
  defaultChoiceId?: string
}

export interface MenuItem {
  id: string
  name: string
  nameTh: string
  description: string
  price: number
  category: Category
  emoji: string
  imageUrl?: string
  optionGroupIds: string[]
  isAvailable: boolean
  createdAt: string
}

export interface SelectedOption {
  groupId: string
  groupName: string
  choiceId: string
  choiceName: string
  priceDelta: number
}

export interface CartItem {
  key: string
  menuId: string
  name: string
  emoji: string
  basePrice: number
  options: SelectedOption[]
  unitPrice: number
  qty: number
  note?: string
}

export interface OrderItem {
  menuId: string
  menuName: string
  category: Category
  emoji: string
  options: SelectedOption[]
  unitPrice: number
  qty: number
  lineTotal: number
  note?: string
}

export interface StatusLog {
  status: OrderStatus
  at: string
}

export interface Order {
  id: string
  orderNo: string
  queueNo: string
  orderType: OrderType
  tableNo: string | null
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  source: OrderSource
  note?: string
  /** เวลาที่ชำระเงิน — ซื้อกลับ = ตอนสั่ง (prepaid), ทานที่ร้าน = ตอนเช็คบิล (postpaid); null = ยังไม่ชำระ */
  paidAt: string | null
  createdAt: string
  updatedAt: string
  statusHistory: StatusLog[]
}

export interface Table {
  tableNo: string
  seats: number
}
