import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import type { OrderStatus } from '../../types'
import { useAppStore } from '../../store/useAppStore'
import { OptionText, StatusBadge } from '../../components/ui'
import { ReceiptModal } from '../../components/ReceiptModal'
import { ORDER_TYPE_LABEL, STATUS_META } from '../../data/constants'
import { baht, timeOf } from '../../utils/format'

/** ทานที่ร้านมีขั้น "เสิร์ฟแล้ว" เพิ่ม เพราะยังต้องเช็คบิลก่อนจบ */
const FLOW_DINE_IN: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED']
const FLOW_TAKEAWAY: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'COMPLETED']

const HINT: Record<OrderStatus, string> = {
  PENDING: 'ส่งออเดอร์ให้ร้านแล้ว กำลังรอรับคิว',
  PREPARING: 'ครัวกำลังทำอยู่ อีกสักครู่นะคะ',
  READY: 'อาหารพร้อมแล้ว',
  SERVED: 'เสิร์ฟให้แล้ว เรียกพนักงานได้เลยเมื่อต้องการเช็คบิล',
  COMPLETED: 'ชำระเงินเรียบร้อย ขอบคุณที่มาอุดหนุน',
  CANCELLED: 'ออเดอร์นี้ถูกยกเลิก',
}

export default function OrderStatusPage() {
  const { id } = useParams()
  const order = useAppStore((s) => s.orders.find((o) => o.id === id))
  const [receipt, setReceipt] = useState(false)

  if (!order) return <Navigate to="/" replace />

  const FLOW = order.orderType === 'DINE_IN' ? FLOW_DINE_IN : FLOW_TAKEAWAY
  const step = FLOW.indexOf(order.status)
  const done = (s: OrderStatus) => order.statusHistory.find((h) => h.status === s)

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-5">
      {/* บัตรคิว */}
      <div className="rounded-3xl bg-lita-800 px-6 py-7 text-center text-white">
        <p className="text-sm text-lita-100">หมายเลขคิวของคุณ</p>
        <p className="anim-pop font-brand text-7xl leading-none tracking-tight">{order.queueNo}</p>
        <p className="mt-3 text-sm text-lita-100">
          {ORDER_TYPE_LABEL[order.orderType]}
          {order.tableNo ? ` · โต๊ะ ${order.tableNo}` : ''} · ออเดอร์ {order.orderNo}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          {order.paidAt ? (
            <span className="rounded-full bg-lita-50 px-2.5 py-0.5 text-xs font-medium text-lita-800 ring-1 ring-inset ring-lita-200">
              ชำระแล้ว
            </span>
          ) : null}
        </div>
        <span className="text-sm text-ink-mute">สั่งเมื่อ {timeOf(order.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm text-ink-soft">{HINT[order.status]}</p>

      {/* Timeline */}
      {order.status !== 'CANCELLED' ? (
        <ol className="mt-6 space-y-0">
          {FLOW.map((s, i) => {
            const passed = i <= step
            const log = done(s)
            return (
              <li key={s} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${passed ? 'bg-lita-700 text-white' : 'bg-lita-50 text-lita-300'}`}>
                    {passed ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                  </span>
                  {i < FLOW.length - 1 ? <span className={`w-0.5 flex-1 ${i < step ? 'bg-lita-700' : 'bg-line'}`} /> : null}
                </div>
                <div className="pb-5 pt-0.5">
                  <p className={`text-sm font-semibold ${passed ? 'text-ink' : 'text-ink-mute'}`}>{STATUS_META[s].label}</p>
                  {log ? <p className="text-xs text-ink-mute">{timeOf(log.at)}</p> : null}
                </div>
              </li>
            )
          })}
        </ol>
      ) : null}

      {/* รายการ */}
      <div className="panel mt-2 p-4">
        <h2 className="mb-2 font-semibold text-ink">รายการที่สั่ง</h2>
        <ul className="divide-y divide-line">
          {order.items.map((it, idx) => (
            <li key={idx} className="flex gap-3 py-2.5">
              <span className="w-7 shrink-0 text-sm font-semibold tabular-nums text-lita-800">×{it.qty}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{it.menuName}</p>
                <OptionText options={it.options} note={it.note} />
              </div>
              <span className="text-sm tabular-nums text-ink-soft">{baht(it.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-sm text-ink-mute">ยอดรวม</span>
          <span className="font-brand text-2xl text-ink">{baht(order.totalAmount)}</span>
        </div>
        {order.note ? <p className="mt-2 text-xs italic text-ink-mute">หมายเหตุ: {order.note}</p> : null}
      </div>

      {order.paidAt ? (
        <button onClick={() => setReceipt(true)} className="btn-primary mt-5 w-full py-3">ดูใบเสร็จ</button>
      ) : null}

      <Link to="/menu" className="btn-soft mt-3 w-full py-3 text-center">สั่งเพิ่ม</Link>

      <ReceiptModal orders={receipt ? [order] : null} onClose={() => setReceipt(false)} />
    </div>
  )
}
