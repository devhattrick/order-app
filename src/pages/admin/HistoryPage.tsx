import { History, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "../../app/AdminLayout";
import { ReceiptModal } from "../../components/ReceiptModal";
import { Empty, Modal, OptionText, StatusBadge } from "../../components/ui";
import { ORDER_TYPE_LABEL, STATUS_META } from "../../data/constants";
import { useAppStore } from "../../store/useAppStore";
import type { Order, OrderStatus, OrderType } from "../../types";
import { baht, dateKey, dateOf, timeOf } from "../../utils/format";

type Range = "TODAY" | "7D" | "30D" | "ALL";

const RANGES: { id: Range; label: string; days: number | null }[] = [
  { id: "TODAY", label: "วันนี้", days: 0 },
  { id: "7D", label: "7 วัน", days: 7 },
  { id: "30D", label: "30 วัน", days: 30 },
  { id: "ALL", label: "ทั้งหมด", days: null },
];

export default function HistoryPage() {
  const orders = useAppStore((s) => s.orders);
  const [range, setRange] = useState<Range>("7D");
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [type, setType] = useState<OrderType | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);
  const [receipt, setReceipt] = useState<Order[] | null>(null);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)!.days;
    const from = days === null ? null : new Date(Date.now() - days * 86400000);
    const term = q.trim().toLowerCase();
    return orders
      .filter((o) => {
        if (
          from &&
          (days === 0
            ? dateKey(o.createdAt) !== dateKey(new Date())
            : new Date(o.createdAt) < from)
        )
          return false;
        if (status !== "ALL" && o.status !== status) return false;
        if (type !== "ALL" && o.orderType !== type) return false;
        if (
          term &&
          !`${o.orderNo} ${o.queueNo} ${o.tableNo ?? ""}`
            .toLowerCase()
            .includes(term)
        )
          return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, range, status, type, q]);

  const revenue = rows
    .filter((o) => o.status !== "CANCELLED")
    .reduce((s, o) => s + o.totalAmount, 0);

  const PER_PAGE = 25;
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page, pages);
  const paged = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const filter =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  return (
    <>
      <PageHeader
        title="ประวัติออเดอร์"
        subtitle={`พบ ${rows.length} ออเดอร์ · ยอดขายรวม ${baht(revenue)}`}
      />

      <div className="space-y-3 px-4 pb-4 sm:px-8">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => filter(setRange)(r.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${range === r.id ? "bg-lita-800 text-white" : "bg-lita-50 text-lita-800 hover:bg-lita-100"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="relative sm:col-span-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
            <input
              className="field pl-10"
              placeholder="ค้นหาเลขออเดอร์ / คิว / โต๊ะ"
              value={q}
              onChange={(e) => filter(setQ)(e.target.value)}
              aria-label="ค้นหาออเดอร์"
            />
          </div>
          <select
            className="field"
            value={status}
            onChange={(e) =>
              filter(setStatus)(e.target.value as OrderStatus | "ALL")
            }
            aria-label="กรองตามสถานะ"
          >
            <option value="ALL">ทุกสถานะ</option>
            {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
          <select
            className="field"
            value={type}
            onChange={(e) =>
              filter(setType)(e.target.value as OrderType | "ALL")
            }
            aria-label="กรองตามประเภท"
          >
            <option value="ALL">ทุกประเภท</option>
            <option value="DINE_IN">ทานที่ร้าน</option>
            <option value="TAKEAWAY">ซื้อกลับ</option>
          </select>
        </div>
      </div>

      <div className="px-4 pb-8 sm:px-8">
        {rows.length === 0 ? (
          <Empty
            icon={<History className="h-7 w-7" />}
            title="ไม่พบออเดอร์ตามเงื่อนไขนี้"
          >
            ลองขยายช่วงวันที่ หรือล้างตัวกรอง
          </Empty>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-lita-50/60 text-xs uppercase tracking-wide text-ink-mute">
                <tr>
                  <th className="px-4 py-3 font-medium">ออเดอร์</th>
                  <th className="px-4 py-3 font-medium">วันเวลา</th>
                  <th className="px-4 py-3 font-medium">ประเภท</th>
                  <th className="px-4 py-3 font-medium">รายการ</th>
                  <th className="px-4 py-3 text-right font-medium">ยอด</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setDetail(o)}
                    className="cursor-pointer hover:bg-lita-50/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{o.queueNo}</p>
                      <p className="text-xs text-ink-mute">{o.orderNo}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {dateOf(o.createdAt)} · {timeOf(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {ORDER_TYPE_LABEL[o.orderType]}
                      {o.tableNo ? ` · ${o.tableNo}` : ""}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {o.items.reduce((s, i) => s + i.qty, 0)} ชิ้น
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                      {baht(o.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-ink-mute">
              แสดง {(current - 1) * PER_PAGE + 1}–
              {Math.min(current * PER_PAGE, rows.length)} จาก {rows.length}{" "}
              ออเดอร์
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(current - 1)}
                disabled={current === 1}
                className="btn-soft px-3 py-1.5 text-sm disabled:opacity-40"
              >
                ก่อนหน้า
              </button>
              <span className="text-sm tabular-nums text-ink-soft">
                {current} / {pages}
              </span>
              <button
                onClick={() => setPage(current + 1)}
                disabled={current === pages}
                className="btn-soft px-3 py-1.5 text-sm disabled:opacity-40"
              >
                ถัดไป
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="รายละเอียดออเดอร์"
      >
        {detail ? (
          <div className="p-5">
            <div className="pr-10">
              <h2 className="font-bold text-3xl leading-none text-ink">
                {detail.queueNo}
              </h2>
              <p className="mt-1 text-sm text-ink-mute">
                {detail.orderNo} · {dateOf(detail.createdAt)}{" "}
                {timeOf(detail.createdAt)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} />
                <span className="rounded-full bg-lita-50 px-2.5 py-0.5 text-xs font-medium text-lita-800">
                  {ORDER_TYPE_LABEL[detail.orderType]}
                  {detail.tableNo ? ` · โต๊ะ ${detail.tableNo}` : ""}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                  {detail.source === "POS" ? "พนักงานคีย์" : "ลูกค้าสั่งเอง"}
                </span>
              </div>
            </div>

            <ul className="mt-4 divide-y divide-line border-y border-line">
              {detail.items.map((it, i) => (
                <li key={i} className="flex gap-3 py-2.5">
                  <span className="w-7 shrink-0 text-sm font-semibold tabular-nums text-lita-800">
                    ×{it.qty}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">
                      {it.menuName}
                    </p>
                    <OptionText options={it.options} note={it.note} />
                  </div>
                  <span className="text-sm tabular-nums text-ink-soft">
                    {baht(it.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-sm text-ink-mute">ยอดรวม</span>
              <span className="font-bold text-2xl text-ink">
                {baht(detail.totalAmount)}
              </span>
            </div>

            <button
              onClick={() => setReceipt([detail])}
              className="btn-soft mt-4 w-full py-2.5"
            >
              ดูใบเสร็จ
            </button>

            <ol className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-ink-mute">
              {detail.statusHistory.map((h, i) => (
                <li key={i} className="flex justify-between">
                  <span>{STATUS_META[h.status].label}</span>
                  <span>{timeOf(h.at)}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </Modal>

      <ReceiptModal orders={receipt} onClose={() => setReceipt(null)} />
    </>
  );
}
