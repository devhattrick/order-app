import { Link } from 'react-router-dom'
import { ClipboardList, Clock } from 'lucide-react'
import type { Order } from '../../types'
import { PageHeader } from '../../app/AdminLayout'
import { Empty, OptionText } from '../../components/ui'
import { BOARD_COLUMNS, ORDER_TYPE_LABEL, STATUS_META, nextStatus } from '../../data/constants'
import { useAppStore } from '../../store/useAppStore'
import { orderService } from '../../services'
import { baht, minutesAgo, sameDay, timeOf } from '../../utils/format'
import { toast } from '../../store/useToast'

/** กระดานครัว: ไล่ออเดอร์จากซ้ายไปขวาตามสถานะ */
export default function OrderBoardPage() {
  const orders = useAppStore((s) => s.orders)
  const today = orders.filter((o) => sameDay(o.createdAt, new Date()))
  const board = BOARD_COLUMNS.map((s) => ({
    status: s,
    items: today.filter((o) => o.status === s).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }))
  const empty = board.every((c) => c.items.length === 0)

  return (
    <>
      <PageHeader title="ออเดอร์ในครัว" subtitle={`${today.length} ออเดอร์วันนี้ · อัปเดตอัตโนมัติเมื่อลูกค้าสั่งเข้ามา`} />

      {empty ? (
        <Empty icon={<ClipboardList className="h-7 w-7" />} title="ยังไม่มีออเดอร์ที่ต้องทำ">
          ออเดอร์ใหม่จากลูกค้าและหน้าร้านจะเด้งขึ้นมาที่นี่ทันที
        </Empty>
      ) : (
        <div className="grid gap-4 px-4 pb-8 sm:px-8 lg:grid-cols-2 2xl:grid-cols-4">
          {board.map((col) => (
            <section key={col.status} className="min-w-0">
              <header className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[col.status].dot}`} />
                <h2 className="font-semibold text-ink">{STATUS_META[col.status].label}</h2>
                <span className="rounded-full bg-lita-50 px-2 text-sm font-semibold text-lita-800">{col.items.length}</span>
              </header>
              <div className="space-y-3">
                {col.items.map((o) => (
                  <OrderCard key={o.id} order={o} />
                ))}
                {col.items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-ink-mute">ว่าง</p>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      )}

    </>
  )
}

function OrderCard({ order }: { order: Order }) {
  const next = nextStatus(order)
  const mins = minutesAgo(order.createdAt)
  const late = (order.status === 'PENDING' || order.status === 'PREPARING') && mins >= 15

  return (
    <article className="panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-brand text-2xl leading-none text-ink">{order.queueNo}</p>
          <p className="mt-1 text-sm text-ink-mute">
            {ORDER_TYPE_LABEL[order.orderType]}
            {order.tableNo ? ` · โต๊ะ ${order.tableNo}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className={`flex items-center justify-end gap-1 text-sm ${late ? 'font-semibold text-rose-600' : 'text-ink-mute'}`}>
            <Clock className="h-3.5 w-3.5" /> {mins} นาที
          </p>
          <p className="text-xs text-ink-mute">{timeOf(order.createdAt)}</p>
        </div>
      </div>

      <ul className="my-3 space-y-1.5 border-y border-line py-3">
        {order.items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="w-6 shrink-0 text-sm font-bold tabular-nums text-lita-800">{it.qty}×</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{it.menuName}</p>
              <OptionText options={it.options} note={it.note} />
            </div>
          </li>
        ))}
      </ul>

      {order.note ? <p className="mb-3 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">หมายเหตุ: {order.note}</p> : null}

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-baseline gap-2 text-sm font-semibold text-ink">
          {baht(order.totalAmount)}
          {order.paidAt ? <span className="text-xs font-medium text-lita-700">ชำระแล้ว</span> : null}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!window.confirm(`ยกเลิกออเดอร์ ${order.queueNo}?`)) return
              orderService.updateStatus(order.id, 'CANCELLED')
              toast(`ยกเลิก ${order.queueNo} แล้ว`)
            }}
            className="btn-ghost px-3 py-2 text-sm"
          >
            ยกเลิก
          </button>
          {next ? (
            <button
              onClick={() => {
                orderService.updateStatus(order.id, next.to)
                toast(`${order.queueNo} → ${STATUS_META[next.to].label}`)
              }}
              className="btn-primary px-4 py-2 text-sm"
            >
              {next.action}
            </button>
          ) : (
            <Link to="/admin/pos" className="btn-soft px-4 py-2 text-sm">
              เช็คบิลที่ผังโต๊ะ
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
