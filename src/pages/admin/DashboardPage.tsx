import { useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Receipt, ShoppingBag, TrendingUp, Utensils } from 'lucide-react'
import type { Category, Order } from '../../types'
import { PageHeader } from '../../app/AdminLayout'
import { CATEGORIES, categoryLabel } from '../../data/constants'
import { useAppStore } from '../../store/useAppStore'
import { baht, dateKey, sameDay } from '../../utils/format'

/** ลำดับสีไล่โทนเขียว Lita — ใช้เรียงตามค่ามาก→น้อย เพื่อให้อ่านลำดับได้จากสี */
const SERIES = ['#1E5B3F', '#2F7F59', '#58A77C', '#8FC7A8', '#C9A56A']
const GRID = '#E3EBE6'
const AXIS = '#6B7F74'

const paid = (o: Order) => o.status !== 'CANCELLED'

export default function DashboardPage() {
  const orders = useAppStore((s) => s.orders)
  const menus = useAppStore((s) => s.menus)

  const d = useMemo(() => {
    const valid = orders.filter(paid)
    const today = valid.filter((o) => sameDay(o.createdAt, new Date()))
    const revenueToday = today.reduce((s, o) => s + o.totalAmount, 0)

    // ยอดขายราย 14 วัน
    const days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(Date.now() - (13 - i) * 86400000)
      const key = dateKey(date)
      const list = valid.filter((o) => dateKey(o.createdAt) === key)
      return {
        label: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        revenue: list.reduce((s, o) => s + o.totalAmount, 0),
        orders: list.length,
      }
    })

    // ออเดอร์ตามช่วงเวลา (เฉลี่ยต่อวัน)
    const hours = Array.from({ length: 11 }, (_, i) => {
      const h = i + 8
      const count = valid.filter((o) => new Date(o.createdAt).getHours() === h).length
      return { label: `${h}:00`, orders: Math.round((count / 14) * 10) / 10 }
    })

    // สัดส่วนยอดขายตามหมวด
    const byCat = CATEGORIES.map((c) => ({
      id: c.id as Category,
      label: c.label,
      value: valid.reduce((s, o) => s + o.items.filter((i) => i.category === c.id).reduce((t, i) => t + i.lineTotal, 0), 0),
    }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)

    // เมนูขายดี
    const tally = new Map<string, { name: string; qty: number; revenue: number }>()
    for (const o of valid)
      for (const i of o.items) {
        const cur = tally.get(i.menuId) ?? { name: i.menuName, qty: 0, revenue: 0 }
        cur.qty += i.qty
        cur.revenue += i.lineTotal
        tally.set(i.menuId, cur)
      }
    const top = [...tally.values()].sort((a, b) => b.qty - a.qty).slice(0, 6)

    const dineIn = valid.filter((o) => o.orderType === 'DINE_IN').length
    return {
      revenueToday,
      ordersToday: today.length,
      avgToday: today.length ? Math.round(revenueToday / today.length) : 0,
      dineInShare: valid.length ? Math.round((dineIn / valid.length) * 100) : 0,
      days,
      hours,
      byCat,
      top,
      maxTop: Math.max(1, ...[...tally.values()].map((t) => t.qty)),
      activeMenus: menus.filter((m) => m.isAvailable).length,
    }
  }, [orders, menus])

  return (
    <>
      <PageHeader title="Dashboard" subtitle="ภาพรวมยอดขายย้อนหลัง 14 วัน · ข้อมูลตัวอย่างสำหรับ Demo" />

      <div className="space-y-4 px-4 pb-10 sm:px-8">
        {/* KPI */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi icon={<TrendingUp className="h-5 w-5" />} label="ยอดขายวันนี้" value={baht(d.revenueToday)} hint={`${d.ordersToday} ออเดอร์`} highlight />
          <Kpi icon={<Receipt className="h-5 w-5" />} label="ยอดเฉลี่ย/ออเดอร์" value={baht(d.avgToday)} hint="เฉพาะวันนี้" />
          <Kpi icon={<Utensils className="h-5 w-5" />} label="สัดส่วนทานที่ร้าน" value={`${d.dineInShare}%`} hint={`ซื้อกลับ ${100 - d.dineInShare}%`} />
          <Kpi icon={<ShoppingBag className="h-5 w-5" />} label="เมนูที่เปิดขาย" value={`${d.activeMenus}`} hint="รายการ" />
        </div>

        {/* ยอดขายรายวัน */}
        <section className="panel p-5">
          <h2 className="font-semibold text-ink">ยอดขายรายวัน</h2>
          <p className="mb-4 text-sm text-ink-mute">14 วันล่าสุด</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.days} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} interval={1} />
                <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  formatter={(v) => [baht(Number(v)), 'ยอดขาย']}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${GRID}`, fontSize: 13 }}
                />
                <Area type="monotone" dataKey="revenue" stroke={SERIES[0]} strokeWidth={2.5} fill="url(#g-rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          {/* ช่วงเวลาที่ลูกค้าสั่ง */}
          <section className="panel p-5">
            <h2 className="font-semibold text-ink">ช่วงเวลาที่คนสั่งเยอะ</h2>
            <p className="mb-4 text-sm text-ink-mute">จำนวนออเดอร์เฉลี่ยต่อวัน</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.hours} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} />
                  <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#F1F8F3' }} formatter={(v) => [`${v} ออเดอร์`, 'เฉลี่ย']} contentStyle={{ borderRadius: 12, border: `1px solid ${GRID}`, fontSize: 13 }} />
                  <Bar dataKey="orders" fill={SERIES[2]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* สัดส่วนตามหมวด */}
          <section className="panel p-5">
            <h2 className="font-semibold text-ink">ยอดขายตามหมวด</h2>
            <p className="mb-4 text-sm text-ink-mute">ทั้งหมด 14 วัน</p>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-48 w-full max-w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.byCat} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="100%" paddingAngle={2} stroke="none">
                      {d.byCat.map((_, i) => (
                        <Cell key={i} fill={SERIES[i % SERIES.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [baht(Number(v)), String(n)]} contentStyle={{ borderRadius: 12, border: `1px solid ${GRID}`, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-2">
                {d.byCat.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SERIES[i % SERIES.length] }} />
                    <span className="flex-1 text-ink-soft">{categoryLabel(c.id)}</span>
                    <span className="font-semibold tabular-nums text-ink">{baht(c.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* เมนูขายดี */}
        <section className="panel p-5">
          <h2 className="font-semibold text-ink">เมนูขายดี</h2>
          <p className="mb-4 text-sm text-ink-mute">เรียงตามจำนวนที่ขายได้ 14 วัน</p>
          <ul className="space-y-3">
            {d.top.map((m) => (
              <li key={m.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-ink">{m.name}</span>
                  <span className="shrink-0 tabular-nums text-ink-mute">
                    {m.qty} ชิ้น · <span className="font-semibold text-ink">{baht(m.revenue)}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-lita-50">
                  <div className="h-full rounded-full bg-lita-700" style={{ width: `${(m.qty / d.maxTop) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

function Kpi({ icon, label, value, hint, highlight = false }: { icon: React.ReactNode; label: string; value: string; hint: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? 'border-lita-800 bg-lita-800 text-white' : 'border-line bg-white'}`}>
      <div className={`flex items-center gap-2 text-sm ${highlight ? 'text-lita-100' : 'text-ink-mute'}`}>
        {icon}
        {label}
      </div>
      <p className={`mt-2 font-brand text-3xl leading-none ${highlight ? 'text-white' : 'text-ink'}`}>{value}</p>
      <p className={`mt-1.5 text-xs ${highlight ? 'text-lita-200' : 'text-ink-mute'}`}>{hint}</p>
    </div>
  )
}
