import type { Order, OrderItem, OrderStatus, OrderType } from '../types'

/**
 * ฝังสรุปออเดอร์ลงใน URL ของ QR
 * -------------------------------------------------------------
 * ทำไมต้องมี: Demo นี้เก็บข้อมูลใน localStorage ของเบราว์เซอร์ที่สร้างออเดอร์
 * พอลูกค้าสแกน QR ด้วย "มือถือของตัวเอง" เครื่องนั้นมี localStorage คนละก้อน
 * จึงหาออเดอร์ไม่เจอและเด้งกลับหน้าแรก
 *
 * วิธีแก้แบบไม่ต้องมี Backend: encode สรุปออเดอร์ใส่ query ของ URL ไปด้วย
 * มือถือเครื่องไหนก็เปิดดูได้ ออฟไลน์ก็ได้
 *
 * ข้อจำกัด: เป็น "snapshot ณ เวลาที่ออกใบเสร็จ" สถานะไม่อัปเดตตามจริง
 * ตอนต่อ Backend ให้เปลี่ยนเป็น GET /api/orders/{token} แล้วถอด payload นี้ทิ้ง
 */

const VERSION = 1

interface Payload {
  v: number
  n: string // orderNo
  q: string // queueNo
  t: 'DI' | 'TA' // orderType
  tb?: string // tableNo
  s: OrderStatus
  c: number // createdAt (epoch วินาที)
  p?: number // paidAt (epoch วินาที)
  a: number // totalAmount
  i: [string, number, number][] // [ชื่อเมนู, จำนวน, ยอดรวมรายการ]
}

function b64urlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

export function encodeOrderSnapshot(order: Order): string {
  const p: Payload = {
    v: VERSION,
    n: order.orderNo,
    q: order.queueNo,
    t: order.orderType === 'DINE_IN' ? 'DI' : 'TA',
    s: order.status,
    c: Math.floor(new Date(order.createdAt).getTime() / 1000),
    a: order.totalAmount,
    // ตัดที่ 12 รายการ กัน QR แน่นจนสแกนยาก
    i: order.items.slice(0, 12).map((it) => [it.menuName, it.qty, it.lineTotal] as [string, number, number]),
  }
  if (order.tableNo) p.tb = order.tableNo
  if (order.paidAt) p.p = Math.floor(new Date(order.paidAt).getTime() / 1000)
  return b64urlEncode(JSON.stringify(p))
}

/** คืน Order ที่ render ได้เหมือนของจริง หรือ null ถ้า payload เสีย */
export function decodeOrderSnapshot(id: string, raw: string | null): Order | null {
  if (!raw) return null
  try {
    const p = JSON.parse(b64urlDecode(raw)) as Payload
    if (p.v !== VERSION || !p.q) return null

    const createdAt = new Date(p.c * 1000).toISOString()
    const items: OrderItem[] = (p.i ?? []).map(([menuName, qty, lineTotal]) => ({
      menuId: '',
      menuName,
      category: 'SANDWICH',
      emoji: '',
      qty,
      unitPrice: qty ? lineTotal / qty : lineTotal,
      lineTotal,
      options: [],
    }))

    return {
      id,
      orderNo: p.n,
      queueNo: p.q,
      orderType: (p.t === 'DI' ? 'DINE_IN' : 'TAKEAWAY') as OrderType,
      tableNo: p.tb ?? null,
      status: p.s,
      source: 'CUSTOMER',
      items,
      totalAmount: p.a,
      paidAt: p.p ? new Date(p.p * 1000).toISOString() : null,
      createdAt,
      updatedAt: createdAt,
      statusHistory: [{ status: p.s, at: createdAt }],
    }
  } catch {
    return null
  }
}
