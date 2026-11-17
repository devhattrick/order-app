import { Loader2, Receipt, ShoppingBag, TrendingUp, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../../app/AdminLayout";
import { categoryLabel } from "../../data/constants";
import { errorMessage } from "../../lib/apiClient";
import { dashboardService } from "../../services";
import type { Category, DashboardSummary } from "../../types";
import { baht } from "../../utils/format";

/** ลำดับสีไล่โทนเขียว Lita — ใช้เรียงตามค่ามาก→น้อย เพื่อให้อ่านลำดับได้จากสี */
const SERIES = ["#1E5B3F", "#2F7F59", "#58A77C", "#8FC7A8", "#C9A56A"];
const GRID = "#E3EBE6";
const AXIS = "#6B7F74";

/** ช่วงเวลาที่ร้านเปิด — ตรึงแกนไว้เพื่อให้กราฟหน้าตาเหมือนเดิมทุกวัน */
const OPEN_HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

const DAYS = 14;

/**
 * Dashboard — ADMIN เท่านั้น
 * -------------------------------------------------------------
 * ตัวเลขทั้งหมดคำนวณที่ฝั่ง Backend (GET /api/dashboard/summary)
 * ไม่ได้ดึงออเดอร์ทั้งหมดมานับเองที่เบราว์เซอร์ เพราะข้อมูลสะสมหลายเดือน
 * จะโหลดช้าและกินเน็ตของเครื่องหน้าร้านโดยไม่จำเป็น
 *
 * STAFF เข้าหน้านี้ไม่ได้อยู่แล้ว (RequireAuth) และต่อให้ยิง API ตรง ๆ
 * SecurityConfig ก็ตอบ 403 กลับไป
 */
export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService
      .summary(DAYS)
      .then(setSummary)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  // แปลงข้อมูลจาก API ให้อยู่ในรูปที่ recharts ใช้ได้ตรง ๆ
  const d = useMemo(() => {
    if (!summary) return null;

    const byCat = summary.salesByCategory
      .map((c) => ({ id: c.category as Category, label: categoryLabel(c.category), value: c.revenue }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    const hourly = new Map(summary.hourlyOrders.map((h) => [h.hour, h.averageOrders]));

    return {
      revenueToday: summary.revenueToday,
      ordersToday: summary.ordersToday,
      avgToday: Math.round(summary.averagePerOrderToday),
      dineInShare: summary.dineInSharePercent,
      days: summary.dailySales.map((row) => ({
        label: new Date(row.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
        revenue: row.revenue,
        orders: row.orders,
      })),
      hours: OPEN_HOURS.map((hour) => ({
        label: `${hour}:00`,
        orders: Math.round((hourly.get(hour) ?? 0) * 10) / 10,
      })),
      byCat,
      top: summary.topMenus.map((m) => ({ name: m.menuName, qty: m.qty, revenue: m.revenue })),
      maxTop: Math.max(1, ...summary.topMenus.map((m) => m.qty)),
      activeMenus: summary.availableMenuCount,
    };
  }, [summary]);

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="ภาพรวมยอดขาย" />
        <p className="mx-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 sm:mx-8">{error}</p>
      </>
    );
  }

  if (!d) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="ภาพรวมยอดขาย" />
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-lita-700" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`ภาพรวมยอดขายย้อนหลัง ${DAYS} วัน`}
      />

      <div className="space-y-4 px-4 pb-10 sm:px-8">
        {/* KPI */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            icon={<TrendingUp className="h-5 w-5" />}
            label="ยอดขายวันนี้"
            value={baht(d.revenueToday)}
            hint={`${d.ordersToday} ออเดอร์`}
            highlight
          />
          <Kpi
            icon={<Receipt className="h-5 w-5" />}
            label="ยอดเฉลี่ย/ออเดอร์"
            value={baht(d.avgToday)}
            hint="เฉพาะวันนี้"
          />
          <Kpi
            icon={<Utensils className="h-5 w-5" />}
            label="สัดส่วนทานที่ร้าน"
            value={`${d.dineInShare}%`}
            hint={`ซื้อกลับ ${100 - d.dineInShare}%`}
          />
          <Kpi
            icon={<ShoppingBag className="h-5 w-5" />}
            label="เมนูที่เปิดขาย"
            value={`${d.activeMenus}`}
            hint="รายการ"
          />
        </div>

        {/* ยอดขายรายวัน */}
        <section className="panel p-5">
          <h2 className="font-semibold text-ink">ยอดขายรายวัน</h2>
          <p className="mb-4 text-sm text-ink-mute">14 วันล่าสุด</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={d.days}
                margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
              >
                <defs>
                  <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={SERIES[0]}
                      stopOpacity={0.22}
                    />
                    <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: AXIS }}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                  interval={1}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: AXIS }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v) => [baht(Number(v)), "ยอดขาย"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${GRID}`,
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={SERIES[0]}
                  strokeWidth={2.5}
                  fill="url(#g-rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          {/* ช่วงเวลาที่ลูกค้าสั่ง */}
          <section className="panel p-5">
            <h2 className="font-semibold text-ink">ช่วงเวลาที่คนสั่งเยอะ</h2>
            <p className="mb-4 text-sm text-ink-mute">
              จำนวนออเดอร์เฉลี่ยต่อวัน
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={d.hours}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: AXIS }}
                    tickLine={false}
                    axisLine={{ stroke: GRID }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: AXIS }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#F1F8F3" }}
                    formatter={(v) => [`${v} ออเดอร์`, "เฉลี่ย"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${GRID}`,
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    dataKey="orders"
                    fill={SERIES[2]}
                    radius={[6, 6, 0, 0]}
                  />
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
                    <Pie
                      data={d.byCat}
                      dataKey="value"
                      nameKey="label"
                      innerRadius="58%"
                      outerRadius="100%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {d.byCat.map((_, i) => (
                        <Cell key={i} fill={SERIES[i % SERIES.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [baht(Number(v)), String(n)]}
                      contentStyle={{
                        borderRadius: 12,
                        border: `1px solid ${GRID}`,
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-2">
                {d.byCat.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: SERIES[i % SERIES.length] }}
                    />
                    <span className="flex-1 text-ink-soft">
                      {categoryLabel(c.id)}
                    </span>
                    <span className="font-semibold tabular-nums text-ink">
                      {baht(c.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* เมนูขายดี */}
        <section className="panel p-5">
          <h2 className="font-semibold text-ink">เมนูขายดี</h2>
          <p className="mb-4 text-sm text-ink-mute">
            เรียงตามจำนวนที่ขายได้ 14 วัน
          </p>
          <ul className="space-y-3">
            {d.top.map((m) => (
              <li key={m.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-ink">{m.name}</span>
                  <span className="shrink-0 tabular-nums text-ink-mute">
                    {m.qty} ชิ้น ·{" "}
                    <span className="font-semibold text-ink">
                      {baht(m.revenue)}
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-lita-50">
                  <div
                    className="h-full rounded-full bg-lita-700"
                    style={{ width: `${(m.qty / d.maxTop) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${highlight ? "border-lita-800 bg-lita-800 text-white" : "border-line bg-white"}`}
    >
      <div
        className={`flex items-center gap-2 text-sm ${highlight ? "text-lita-100" : "text-ink-mute"}`}
      >
        {icon}
        {label}
      </div>
      <p
        className={`mt-2 font-bold text-3xl leading-none ${highlight ? "text-white" : "text-ink"}`}
      >
        {value}
      </p>
      <p
        className={`mt-1.5 text-xs ${highlight ? "text-lita-200" : "text-ink-mute"}`}
      >
        {hint}
      </p>
    </div>
  );
}
