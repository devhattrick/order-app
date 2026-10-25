import { Printer } from "lucide-react";
import { ORDER_TYPE_LABEL, SHOP_NAME, SHOP_TAGLINE } from "../data/constants";
import type { Order } from "../types";
import { baht, dateOf, timeOf } from "../utils/format";
import { LoafMark, Modal } from "./ui";

interface Props {
  /** 1 ใบ = 1 ออเดอร์ / หลายใบ = บิลรวมทั้งโต๊ะ */
  orders: Order[] | null;
  onClose: () => void;
  /** ถ้าส่งมา จะแสดงปุ่มยืนยันปิดบิลที่ท้ายใบเสร็จ */
  onConfirm?: () => void;
  confirmLabel?: string;
}

const VAT_RATE = 0.07;

/** ใบเสร็จ — ดูบนจอได้ และสั่งพิมพ์ได้ (ซ่อนส่วนอื่นของหน้าตอน print) */
export function ReceiptModal({
  orders,
  onClose,
  onConfirm,
  confirmLabel = "ปิดบิล",
}: Props) {
  const list = orders ?? [];
  const first = list[0];
  const total = list.reduce((s, o) => s + o.totalAmount, 0);
  const vat = Math.round(((total * VAT_RATE) / (1 + VAT_RATE)) * 100) / 100;
  const multi = list.length > 1;
  const tableNo = first?.tableNo;
  /** ยังไม่ชำระ = ใบแจ้งยอดให้ลูกค้าตรวจก่อนจ่าย / ชำระแล้ว = ใบเสร็จรับเงิน */
  const paid = list.length > 0 && list.every((o) => o.paidAt);

  return (
    <Modal open={list.length > 0} onClose={onClose} title="ใบเสร็จรับเงิน">
      {first ? (
        <>
          <div id="receipt" className="px-6 pb-2 pt-6 font-sans text-ink">
            {/* หัวบิล */}
            <div className="flex flex-col items-center border-b border-dashed border-zinc-300 pb-4 text-center">
              <LoafMark className="h-8 w-11" />
              <p className="mt-1.5 font-bold text-3xl leading-none">
                {SHOP_NAME}
              </p>
              <p className="mt-1 text-xs text-ink-mute">{SHOP_TAGLINE}</p>
              <p className="mt-3 text-sm font-semibold tracking-wide">
                {paid ? "ใบเสร็จรับเงิน / RECEIPT" : "ใบแจ้งยอด / BILL"}
              </p>
            </div>

            {/* ข้อมูลบิล */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-b border-dashed border-zinc-300 py-4 text-sm">
              <dt className="text-ink-mute">เลขที่</dt>
              <dd className="text-right tabular-nums">
                {multi
                  ? `โต๊ะ ${tableNo} (${list.length} ออเดอร์)`
                  : first.orderNo}
              </dd>

              {!multi ? (
                <>
                  <dt className="text-ink-mute">คิว</dt>
                  <dd className="text-right font-semibold">{first.queueNo}</dd>
                </>
              ) : null}

              <dt className="text-ink-mute">วันที่</dt>
              <dd className="text-right tabular-nums">
                {dateOf(first.createdAt)} {timeOf(first.createdAt)}
              </dd>

              <dt className="text-ink-mute">ประเภท</dt>
              <dd className="text-right">
                {ORDER_TYPE_LABEL[first.orderType]}
                {tableNo ? ` · โต๊ะ ${tableNo}` : ""}
              </dd>

              <dt className="text-ink-mute">ช่องทาง</dt>
              <dd className="text-right">
                {first.source === "POS" ? "พนักงานคีย์" : "ลูกค้าสั่งเอง"}
              </dd>

              <dt className="text-ink-mute">การชำระเงิน</dt>
              <dd className="text-right">
                {paid && first.paidAt
                  ? `ชำระแล้ว ${timeOf(first.paidAt)}`
                  : "ยังไม่ชำระ"}
              </dd>
            </dl>

            {/* รายการ */}
            <div className="border-b border-dashed border-zinc-300 py-3">
              {list.map((o) => (
                <div key={o.id} className="mb-2 last:mb-0">
                  {multi ? (
                    <p className="mb-1 text-xs font-semibold text-ink-mute">
                      {o.queueNo} · {timeOf(o.createdAt)}
                    </p>
                  ) : null}
                  <ul className="space-y-1.5">
                    {o.items.map((it, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="w-6 shrink-0 tabular-nums">
                          {it.qty}×
                        </span>
                        <div className="min-w-0 flex-1">
                          <p>{it.menuName}</p>
                          {it.options.length ? (
                            <p className="text-xs text-ink-mute">
                              {it.options
                                .map(
                                  (x) =>
                                    x.choiceName +
                                    (x.priceDelta ? ` +${x.priceDelta}` : ""),
                                )
                                .join(", ")}
                            </p>
                          ) : null}
                          {it.note ? (
                            <p className="text-xs italic text-ink-mute">
                              “{it.note}”
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 tabular-nums">
                          {it.lineTotal.toLocaleString("th-TH")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* ยอด */}
            <div className="space-y-1 py-3 text-sm">
              <div className="flex justify-between text-ink-mute">
                <span>ยอดก่อนภาษี</span>
                <span className="tabular-nums">
                  {(total - vat).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-ink-mute">
                <span>VAT 7%</span>
                <span className="tabular-nums">
                  {vat.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-zinc-300 pt-2">
                <span className="font-semibold">ยอดสุทธิ</span>
                <span className="font-bold text-2xl">{baht(total)}</span>
              </div>
            </div>

            <p className="border-t border-dashed border-zinc-300 pt-4 text-center text-xs text-ink-mute">
              ราคารวมภาษีมูลค่าเพิ่มแล้ว
              {paid ? " · ขอบคุณที่มาอุดหนุน" : " · กรุณาชำระเงินที่เคาน์เตอร์"}
              <span className="mt-1 block">
                Lita Sourdough · โทร 02-000-0000
              </span>
            </p>
          </div>

          <div className="sticky bottom-0 flex gap-3 border-t border-line bg-white p-4 print:hidden">
            <button
              onClick={() => window.print()}
              className="btn-soft flex flex-1 items-center justify-center gap-2 py-3"
            >
              <Printer className="h-4 w-4" /> พิมพ์ใบเสร็จ
            </button>
            {onConfirm ? (
              <button onClick={onConfirm} className="btn-primary flex-1 py-3">
                {confirmLabel}
              </button>
            ) : (
              <button onClick={onClose} className="btn-primary flex-1 py-3">
                ปิด
              </button>
            )}
          </div>
        </>
      ) : null}
    </Modal>
  );
}
