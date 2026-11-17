import { History, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../../app/AdminLayout";
import { ReceiptModal } from "../../components/ReceiptModal";
import { Empty, Modal, OptionText, StatusBadge } from "../../components/ui";
import { ORDER_TYPE_LABEL, STATUS_META } from "../../data/constants";
import { errorMessage } from "../../lib/apiClient";
import { orderService } from "../../services";
import type { Order, OrderStatus, OrderType } from "../../types";
import { baht, dateOf, timeOf } from "../../utils/format";

type Range = "TODAY" | "7D" | "30D" | "ALL";

const RANGES: { id: Range; label: string; days: number | null }[] = [
  { id: "TODAY", label: "วันนี้", days: 0 },
  { id: "7D", label: "7 วัน", days: 7 },
  { id: "30D", label: "30 วัน", days: 30 },
  { id: "ALL", label: "ทั้งหมด", days: null },
];

const PER_PAGE = 25;

/** แปลงช่วงเวลาเป็นวันที่เริ่มต้นแบบ yyyy-MM-dd ตามที่ API รับ */
function fromDate(range: Range): string | undefined {
  const days = RANGES.find((r) => r.id === range)?.days;
  if (days === null || days === undefined) return undefined;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toLocaleDateString("sv-SE"); // sv-SE ให้รูปแบบ yyyy-MM-dd พอดี
}

/**
 * ประวัติออเดอร์
 * -------------------------------------------------------------
 * ต่างจากหน้าอื่นตรงที่ไม่ได้อ่านจาก store กลาง เพราะ store เก็บเฉพาะออเดอร์ที่ยังไม่ปิด
 * หน้านี้จึงยิง GET /api/orders เองพร้อม filter และให้ server แบ่งหน้ามาให้
 * ข้อมูลย้อนหลังเป็นหมื่นรายการก็ไม่ต้องโหลดมาทั้งก้อน
 */
export default function HistoryPage() {
  const [range, setRange] = useState<Range>("7D");
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [type, setType] = useState<OrderType | "ALL">("ALL");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);

  const [rows, setRows] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<Order | null>(null);
  const [receipt, setReceipt] = useState<Order[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await orderService.search({
        from: fromDate(range),
        status: status === "ALL" ? undefined : status,
        orderType: type === "ALL" ? undefined : type,
        keyword: keyword.trim() || undefined,
        page,
        size: PER_PAGE,
      });
      setRows(result.content);
      setTotal(result.totalElements);
      setTotalPages(Math.max(1, result.totalPages));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [range, status, type, keyword, page]);

  // หน่วงไว้นิดเดียวเพื่อไม่ให้ยิง API ทุกตัวอักษรที่พิมพ์ในช่องค้นหา
  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  /** เปลี่ยน filter ตัวไหนก็ตาม ต้องกลับไปหน้าแรกเสมอ ไม่งั้นอาจค้างอยู่หน้าที่ไม่มีข้อมูล */
  const filter =
    <T,>(set: (v: T) => void) =>
    (value: T) => {
      set(value);
      setPage(0);
    };

  const revenue = rows
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <>
      <PageHeader
        title="ประวัติออเดอร์"
        subtitle={`พบ ${total} ออเดอร์ · ยอดขายในหน้านี้ ${baht(revenue)}`}
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
              value={keyword}
              onChange={(e) => filter(setKeyword)(e.target.value)}
              aria-label="ค้นหาออเดอร์"
            />
          </div>
          <select
            className="field"
            value={status}
            onChange={(e) => filter(setStatus)(e.target.value as OrderStatus | "ALL")}
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
            onChange={(e) => filter(setType)(e.target.value as OrderType | "ALL")}
            aria-label="กรองตามประเภท"
          >
            <option value="ALL">ทุกประเภท</option>
            <option value="DINE_IN">ทานที่ร้าน</option>
            <option value="TAKEAWAY">ซื้อกลับ</option>
          </select>
        </div>
      </div>

      <div className="px-4 pb-8 sm:px-8">
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>
        ) : loading && rows.length === 0 ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-lita-700" />
          </div>
        ) : rows.length === 0 ? (
          <Empty icon={<History className="h-7 w-7" />} title="ไม่พบออเดอร์ตามเงื่อนไขนี้">
            ลองขยายช่วงวันที่ หรือล้างตัวกรอง
          </Empty>
        ) : (
          <div className={`panel overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
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
                {rows.map((o) => (
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
                      {o.items.reduce((sum, i) => sum + i.qty, 0)} ชิ้น
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

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-ink-mute">
              แสดง {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} จาก {total} ออเดอร์
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="btn-soft px-3 py-1.5 text-sm disabled:opacity-40"
              >
                ก่อนหน้า
              </button>
              <span className="text-sm tabular-nums text-ink-soft">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page + 1 >= totalPages}
                className="btn-soft px-3 py-1.5 text-sm disabled:opacity-40"
              >
                ถัดไป
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="รายละเอียดออเดอร์">
        {detail ? (
          <div className="p-5">
            <div className="pr-10">
              <h2 className="font-bold text-3xl leading-none text-ink">{detail.queueNo}</h2>
              <p className="mt-1 text-sm text-ink-mute">
                {detail.orderNo} · {dateOf(detail.createdAt)} {timeOf(detail.createdAt)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} />
                <span className="rounded-full bg-lita-50 px-2.5 py-0.5 text-xs font-medium text-lita-800">
                  {ORDER_TYPE_LABEL[detail.orderType]}
                  {detail.tableNo ? ` · โต๊ะ ${detail.tableNo}` : ""}
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
                    <p className="text-sm font-medium text-ink">{it.menuName}</p>
                    <OptionText options={it.options} note={it.note} />
                  </div>
                  <span className="text-sm tabular-nums text-ink-soft">{baht(it.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-sm text-ink-mute">ยอดรวม</span>
              <span className="font-bold text-2xl text-ink">{baht(detail.totalAmount)}</span>
            </div>

            <button onClick={() => setReceipt([detail])} className="btn-soft mt-4 w-full py-2.5">
              ดูใบเสร็จ
            </button>

            <ol className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-ink-mute">
              {detail.statusHistory.map((h, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{STATUS_META[h.status].label}</span>
                  <span className="shrink-0">
                    {h.changedBy ? `${h.changedBy} · ` : ""}
                    {timeOf(h.at)}
                  </span>
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
