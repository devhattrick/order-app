import { AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LoafMark, StatusBadge } from "../components/ui";
import { ORDER_TYPE_LABEL, SHOP_NAME, STATUS_META } from "../data/constants";
import { errorMessage } from "../lib/apiClient";
import { publicOrderService } from "../services";
import type { OrderStatus, PublicOrder } from "../types";
import { baht, timeOf } from "../utils/format";

/** ทานที่ร้านมีขั้น "เสิร์ฟแล้ว" เพิ่ม เพราะยังต้องเช็คบิลก่อนจบ */
const FLOW_DINE_IN: OrderStatus[] = ["PENDING", "PREPARING", "READY", "SERVED", "COMPLETED"];
const FLOW_TAKEAWAY: OrderStatus[] = ["PENDING", "PREPARING", "READY", "COMPLETED"];

const HINT: Record<OrderStatus, string> = {
  PENDING: "ร้านรับออเดอร์แล้ว กำลังรอเข้าคิวทำ",
  PREPARING: "ครัวกำลังทำอยู่ อีกสักครู่นะคะ",
  READY: "อาหารพร้อมแล้ว",
  SERVED: "เสิร์ฟให้แล้ว เรียกพนักงานได้เลยเมื่อต้องการเช็คบิล",
  COMPLETED: "ชำระเงินเรียบร้อย ขอบคุณที่มาอุดหนุน",
  CANCELLED: "ออเดอร์นี้ถูกยกเลิก กรุณาสอบถามพนักงานที่เคาน์เตอร์",
};

/** ดึงสถานะใหม่ทุก 20 วินาที — ถี่พอให้รู้สึกว่าอัปเดตสด แต่ไม่กินแบตมือถือลูกค้า */
const POLL_INTERVAL_MS = 20_000;

/**
 * หน้าติดตามสถานะออเดอร์สำหรับลูกค้า
 * -------------------------------------------------------------
 * เปิดจากการสแกน QR บนใบเสร็จ ไม่ต้อง login
 * ใช้ trackingToken ที่สุ่มมาแทน id จริงของออเดอร์ คนอื่นจึงเดา url ของออเดอร์ตัวอื่นไม่ได้
 */
export default function TrackPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setOrder(await publicOrderService.track(token));
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-center gap-2 bg-lita-900 py-3 text-white">
        <LoafMark className="h-6 w-8" tone="white" />
        <span className="font-brand text-xl leading-none">{SHOP_NAME}</span>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-10 pt-5">
        {loading ? (
          <div className="grid place-items-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-lita-700" />
          </div>
        ) : error || !order ? (
          <div className="rounded-2xl border border-line p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-ink-mute" />
            <p className="mt-3 font-semibold text-ink">ดูสถานะออเดอร์ไม่ได้</p>
            <p className="mt-1 text-sm text-ink-mute">{error}</p>
            <button onClick={() => void load()} className="btn-soft mt-4 justify-center px-4 py-2.5">
              <RefreshCw className="h-4 w-4" /> ลองอีกครั้ง
            </button>
          </div>
        ) : (
          <OrderStatus order={order} onRefresh={() => void load()} />
        )}
      </main>
    </div>
  );
}

function OrderStatus({ order, onRefresh }: { order: PublicOrder; onRefresh: () => void }) {
  const flow = order.orderType === "DINE_IN" ? FLOW_DINE_IN : FLOW_TAKEAWAY;
  const step = flow.indexOf(order.status);
  const timeAt = (status: OrderStatus) => order.timeline.find((t) => t.status === status)?.at;

  return (
    <>
      {/* บัตรคิว */}
      <div className="rounded-3xl bg-lita-800 px-6 py-7 text-center text-white">
        <p className="text-sm text-lita-100">หมายเลขคิวของคุณ</p>
        <p className="anim-pop font-brand text-7xl leading-none tracking-tight">{order.queueNo}</p>
        <p className="mt-3 text-sm text-lita-100">
          {ORDER_TYPE_LABEL[order.orderType]}
          {order.tableNo ? ` · โต๊ะ ${order.tableNo}` : ""} · ออเดอร์ {order.orderNo}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          {order.paid ? (
            <span className="rounded-full bg-lita-50 px-2.5 py-0.5 text-xs font-medium text-lita-800 ring-1 ring-inset ring-lita-200">
              ชำระแล้ว
            </span>
          ) : null}
        </div>
        <span className="text-sm text-ink-mute">สั่งเมื่อ {timeOf(order.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm text-ink-soft">{HINT[order.status]}</p>

      {/* Timeline */}
      {order.status === "CANCELLED" ? null : (
        <ol className="mt-6">
          {flow.map((status, index) => {
            const passed = index <= step;
            const at = timeAt(status);
            return (
              <li key={status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${passed ? "bg-lita-700 text-white" : "bg-lita-50 text-lita-300"}`}
                  >
                    {passed ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  {index < flow.length - 1 ? (
                    <span className={`w-0.5 flex-1 ${index < step ? "bg-lita-700" : "bg-line"}`} />
                  ) : null}
                </div>
                <div className="pb-5 pt-0.5">
                  <p className={`text-sm font-semibold ${passed ? "text-ink" : "text-ink-mute"}`}>
                    {STATUS_META[status].label}
                  </p>
                  {at ? <p className="text-xs text-ink-mute">{timeOf(at)}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* รายการที่สั่ง */}
      <div className="panel mt-2 p-4">
        <h2 className="mb-2 font-semibold text-ink">รายการที่สั่ง</h2>
        <ul className="divide-y divide-line">
          {order.items.map((item, index) => (
            <li key={index} className="flex gap-3 py-2.5">
              <span className="w-7 shrink-0 text-sm font-semibold tabular-nums text-lita-800">
                ×{item.qty}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{item.menuName}</p>
                {item.options.length ? (
                  <p className="text-xs text-ink-mute">{item.options.join(" · ")}</p>
                ) : null}
              </div>
              <span className="text-sm tabular-nums text-ink-soft">{baht(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-sm text-ink-mute">ยอดรวม</span>
          <span className="font-brand text-2xl text-ink">{baht(order.totalAmount)}</span>
        </div>
      </div>

      <button onClick={onRefresh} className="btn-soft mt-4 w-full justify-center py-2.5">
        <RefreshCw className="h-4 w-4" /> อัปเดตสถานะ
      </button>
      <p className="mt-2 text-center text-xs text-ink-mute">หน้านี้อัปเดตสถานะให้อัตโนมัติทุก 20 วินาที</p>
    </>
  );
}
