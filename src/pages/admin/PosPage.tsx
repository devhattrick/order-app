import { useState } from 'react'
import { ChevronRight, Receipt, ShoppingBag, Users, X } from 'lucide-react'
import type { MenuItem, Order } from '../../types'
import { PageHeader } from '../../app/AdminLayout'
import { MenuBrowser } from '../../components/MenuBrowser'
import { ItemOptionsModal } from '../../components/ItemOptionsModal'
import { ReceiptModal } from '../../components/ReceiptModal'
import { MenuThumb, OptionText, QtyStepper, StatusBadge } from '../../components/ui'
import { ACTIVE_STATUSES, STATUS_META, TABLES } from '../../data/constants'
import { useAppStore } from '../../store/useAppStore'
import { cartCount, cartTotal, useCart, useCartStore } from '../../store/useCartStore'
import { getTableState, orderService } from '../../services'
import { baht, minutesAgo, timeOf } from '../../utils/format'
import { toast } from '../../store/useToast'

const TAKEAWAY = 'TAKEAWAY'

const STAGE_CARD: Record<string, string> = {
  FREE: 'border-line bg-white hover:border-lita-400',
  PENDING: 'border-amber-400 bg-amber-100',
  PREPARING: 'border-sky-400 bg-sky-100',
  READY: 'border-lita-500 bg-lita-200',
  SERVED: 'border-[#B78E47] bg-[#EFDFBE]',
}

/** หน้าจอพนักงาน: ผังโต๊ะ T1-T10 + ช่องซื้อกลับ → คีย์ออเดอร์แทนลูกค้าได้ */
export default function PosPage() {
  const orders = useAppStore((s) => s.orders)
  const carts = useCartStore((s) => s.carts)
  const [open, setOpen] = useState<string | null>(null)

  const takeawayActive = orders.filter((o) => o.orderType === 'TAKEAWAY' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED')

  return (
    <>
      <PageHeader
        title="ผังโต๊ะ & สั่งอาหาร"
        subtitle="กดที่โต๊ะเพื่อดูบิลปัจจุบัน หรือคีย์ออเดอร์ให้ลูกค้า"
        actions={
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-mute">
            {(['FREE', 'PENDING', 'PREPARING', 'READY', 'SERVED'] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${s === 'FREE' ? 'bg-line' : STATUS_META[s].dot}`} />
                {s === 'FREE' ? 'ว่าง' : STATUS_META[s].label}
              </span>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4 pb-8 sm:grid-cols-3 sm:px-8 lg:grid-cols-4 2xl:grid-cols-5">
        {TABLES.map((t) => {
          const st = getTableState(orders, t.tableNo)
          const pending = cartCount(carts[`pos:${t.tableNo}`] ?? [])
          return (
            <button
              key={t.tableNo}
              onClick={() => setOpen(t.tableNo)}
              className={`relative flex min-h-[124px] flex-col rounded-2xl border p-4 text-left transition-colors ${STAGE_CARD[st.stage]}`}
            >
              <div className="flex items-start justify-between">
                <span className="font-brand text-3xl leading-none text-lita-900">{t.tableNo}</span>
                <span className="flex items-center gap-1 text-xs text-ink-mute">
                  <Users className="h-3.5 w-3.5" />
                  {t.seats}
                </span>
              </div>
              <div className="mt-auto pt-3">
                {st.stage === 'FREE' ? (
                  <p className="text-sm text-ink-mute">ว่าง</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-ink">{baht(st.total)}</p>
                    <p className="text-xs text-ink-mute">
                      {st.orders.length} ออเดอร์ · {st.since ? `${minutesAgo(st.since)} นาที` : ''}
                    </p>
                  </>
                )}
              </div>
              {pending > 0 ? (
                <span className="absolute right-3 top-3 rounded-full bg-lita-800 px-2 py-0.5 text-[11px] font-bold text-white">
                  ค้างคีย์ {pending}
                </span>
              ) : null}
            </button>
          )
        })}

        {/* ช่องซื้อกลับ */}
        <button
          onClick={() => setOpen(TAKEAWAY)}
          className="flex min-h-[124px] flex-col rounded-2xl border border-dashed border-lita-400 bg-lita-50/60 p-4 text-left transition-colors hover:bg-lita-50"
        >
          <ShoppingBag className="h-6 w-6 text-lita-800" />
          <p className="mt-2 font-semibold text-lita-900">ซื้อกลับ</p>
          <p className="mt-auto text-xs text-ink-mute">{takeawayActive.length} คิวที่ยังไม่ส่งมอบ</p>
        </button>
      </div>

      {open ? <OrderDrawer context={open} onClose={() => setOpen(null)} /> : null}
    </>
  )
}

function OrderDrawer({ context, onClose }: { context: string; onClose: () => void }) {
  const isTakeaway = context === TAKEAWAY
  const cartKey = `pos:${context}`
  const orders = useAppStore((s) => s.orders)
  const items = useCart(cartKey)
  const addItem = useCartStore((s) => s.addItem)
  const setQty = useCartStore((s) => s.setQty)
  const clear = useCartStore((s) => s.clear)
  const [picked, setPicked] = useState<MenuItem | null>(null)
  /** confirm = true → ใบแจ้งยอดก่อนเก็บโต๊ะ, false → ใบเสร็จซื้อกลับที่ชำระแล้ว */
  const [bill, setBill] = useState<{ orders: Order[]; confirm: boolean } | null>(null)

  const table = isTakeaway ? null : getTableState(orders, context)
  const active = isTakeaway
    ? orders.filter((o) => o.orderType === 'TAKEAWAY' && ACTIVE_STATUSES.includes(o.status))
    : (table?.orders ?? [])

  const submit = () => {
    const order = orderService.create({
      orderType: isTakeaway ? 'TAKEAWAY' : 'DINE_IN',
      tableNo: isTakeaway ? null : context,
      items,
      source: 'POS',
    })
    clear(cartKey)
    // ซื้อกลับ = รับเงินตอนสั่ง จึงออกใบเสร็จทันทีก่อนเข้าครัว
    if (isTakeaway) setBill({ orders: [order], confirm: false })
    toast(`ส่งออเดอร์ ${order.queueNo} เข้าครัวแล้ว`)
  }

  const close = () => {
    orderService.closeTable(context)
    setBill(null)
    toast(`เก็บโต๊ะ ${context} แล้ว`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-lita-950/40" onClick={onClose} />
      <aside className="anim-rise relative flex h-full w-full flex-col bg-white sm:w-[480px] sm:shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-brand text-2xl leading-none text-ink">{isTakeaway ? 'ซื้อกลับ' : `โต๊ะ ${context}`}</h2>
            <p className="mt-1 text-sm text-ink-mute">
              {active.length ? `${active.length} ออเดอร์ที่ยังไม่ปิด` : 'ยังไม่มีออเดอร์ค้าง'}
            </p>
          </div>
          <button onClick={onClose} aria-label="ปิด" className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-lita-50">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* ออเดอร์ที่เปิดอยู่ */}
          {active.length ? (
            <section className="mt-4 space-y-2">
              {active.map((o) => (
                <article key={o.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">
                      {o.queueNo}
                      <span className="ml-2 text-xs font-normal text-ink-mute">{timeOf(o.createdAt)}</span>
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <ul className="mt-2 space-y-0.5 text-sm text-ink-soft">
                    {o.items.map((it, i) => (
                      <li key={i}>
                        {it.qty}× {it.menuName}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-right text-sm font-semibold text-ink">{baht(o.totalAmount)}</p>
                </article>
              ))}
              {!isTakeaway ? (
                <div className="flex items-center justify-between rounded-xl bg-lita-50 px-3 py-2.5">
                  <span className="text-sm font-medium text-lita-900">รวมทั้งโต๊ะ</span>
                  <span className="font-brand text-xl text-lita-900">{baht(table?.total ?? 0)}</span>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* ตะกร้าที่กำลังคีย์ */}
          {items.length ? (
            <section className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-ink">กำลังคีย์</h3>
              <ul className="divide-y divide-line">
                {items.map((i) => (
                  <li key={i.key} className="flex items-start gap-2.5 py-2.5">
                    <MenuThumb menu={{ emoji: i.emoji, name: i.name }} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{i.name}</p>
                      <OptionText options={i.options} note={i.note} />
                      <div className="mt-1.5 flex items-center justify-between">
                        <QtyStepper size="sm" value={i.qty} onChange={(n) => setQty(cartKey, i.key, n)} />
                        <span className="text-sm font-semibold tabular-nums">{baht(i.unitPrice * i.qty)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* เลือกเมนู */}
          <section className="mt-5">
            <MenuBrowser layout="grid" onPick={setPicked} stickyTop="top-0" />
          </section>
        </div>

        <footer className="space-y-2 border-t border-line p-4">
          <button onClick={submit} disabled={!items.length} className="btn-primary flex w-full items-center justify-between py-3 text-base disabled:opacity-40">
            <span className="flex items-center gap-2">
              {isTakeaway ? 'รับเงิน & ส่งเข้าครัว' : 'ส่งเข้าครัว'} · {cartCount(items)} รายการ <ChevronRight className="h-4 w-4" />
            </span>
            <span>{baht(cartTotal(items))}</span>
          </button>
          {!isTakeaway && active.length ? (
            <button onClick={() => setBill({ orders: active, confirm: true })} className="btn-soft flex w-full items-center justify-center gap-2 py-2.5">
              <Receipt className="h-4 w-4" /> เช็คบิล & เก็บโต๊ะ {baht(table?.total ?? 0)}
            </button>
          ) : null}
        </footer>

        <ReceiptModal
          orders={bill?.orders ?? null}
          onClose={() => setBill(null)}
          onConfirm={bill?.confirm ? close : undefined}
          confirmLabel={`รับเงิน & เก็บโต๊ะ ${context}`}
        />

        <ItemOptionsModal
          menu={picked}
          onClose={() => setPicked(null)}
          onAdd={(item) => {
            addItem(cartKey, item)
            toast(`เพิ่ม ${item.name}`)
          }}
        />
      </aside>
    </div>
  )
}
