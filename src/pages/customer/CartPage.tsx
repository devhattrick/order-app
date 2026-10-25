import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Empty, MenuThumb, OptionText, QtyStepper } from "../../components/ui";
import { ORDER_TYPE_LABEL } from "../../data/constants";
import { orderService } from "../../services";
import { cartTotal, useCart, useCartStore } from "../../store/useCartStore";
import { baht } from "../../utils/format";

export default function CartPage() {
  const nav = useNavigate();
  const session = useCartStore((s) => s.session);
  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);
  const setSession = useCartStore((s) => s.setSession);
  const items = useCart("customer");
  const [note, setNote] = useState("");

  if (!session.orderType) return <Navigate to="/" replace />;

  const total = cartTotal(items);

  const submit = () => {
    const order = orderService.create({
      orderType: session.orderType!,
      tableNo: session.tableNo,
      items,
      source: "CUSTOMER",
      note: note.trim() || undefined,
    });
    clear("customer");
    setSession({ lastOrderId: order.id });
    nav(`/order/${order.id}`, { replace: true });
  };

  if (items.length === 0)
    return (
      <div className="flex flex-1 flex-col justify-center">
        <Empty
          icon={<ShoppingCart className="h-7 w-7" />}
          title="ยังไม่มีรายการในตะกร้า"
        >
          <Link
            to="/menu"
            className="mt-3 inline-block font-medium text-lita-800 underline underline-offset-2"
          >
            กลับไปเลือกเมนู
          </Link>
        </Empty>
      </div>
    );

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-4">
        <h1 className="font-bold text-3xl text-ink">ตะกร้าของคุณ</h1>
        <p className="mt-0.5 text-sm text-ink-mute">
          {ORDER_TYPE_LABEL[session.orderType]}
          {session.tableNo ? ` · โต๊ะ ${session.tableNo}` : ""}
        </p>
      </div>

      <ul className="flex-1 divide-y divide-line px-5 pb-32 pt-3">
        {items.map((i) => (
          <li key={i.key} className="flex gap-3 py-4">
            <MenuThumb menu={{ emoji: i.emoji, name: i.name }} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug text-ink">{i.name}</p>
              <OptionText options={i.options} note={i.note} />
              <div className="mt-2 flex items-center justify-between gap-2">
                <QtyStepper
                  size="sm"
                  value={i.qty}
                  onChange={(n) => setQty("customer", i.key, n)}
                />
                <span className="font-semibold text-ink">
                  {baht(i.unitPrice * i.qty)}
                </span>
              </div>
            </div>
          </li>
        ))}

        <li className="pt-4">
          <label htmlFor="order-note" className="label">
            หมายเหตุถึงร้าน
          </label>
          <input
            id="order-note"
            className="field"
            placeholder="เช่น ขอช้อนส้อม 2 ชุด"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </li>

        <li className="pt-4">
          <Link
            to="/menu"
            className="text-sm font-medium text-lita-800 underline underline-offset-2"
          >
            + สั่งเพิ่ม
          </Link>
        </li>
      </ul>

      <div className="sticky bottom-0 z-30 space-y-3 border-t border-line bg-white/95 p-4 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-mute">ยอดรวม</span>
          <span className="font-bold text-2xl text-ink">{baht(total)}</span>
        </div>
        <button
          onClick={submit}
          className="btn-primary w-full py-3.5 text-base"
        >
          {session.orderType === "TAKEAWAY"
            ? "ชำระเงิน & สั่งอาหาร"
            : "ยืนยันสั่งอาหาร"}
        </button>
        <p className="text-center text-xs text-ink-mute">
          {session.orderType === "TAKEAWAY"
            ? "ซื้อกลับชำระเงินตอนสั่ง รับใบเสร็จทันที"
            : "ทานที่ร้านชำระเงินตอนเช็คบิล"}
        </p>
      </div>
    </div>
  );
}
