import { ShoppingBag, Utensils } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { RoleSwitch } from "../../app/RoleSwitch";
import { LoafMark } from "../../components/ui";
import { SHOP_TAGLINE } from "../../data/constants";
import { useAppStore } from "../../store/useAppStore";
import { useCartStore } from "../../store/useCartStore";
import type { OrderType } from "../../types";

/** หน้าแรกฝั่งลูกค้า: เลือกว่าจะทานที่ร้าน หรือซื้อกลับ */
export default function WelcomePage() {
  const nav = useNavigate();
  const setSession = useCartStore((s) => s.setSession);
  const lastId = useCartStore((s) => s.session.lastOrderId);
  const last = useAppStore((s) =>
    lastId ? s.orders.find((o) => o.id === lastId) : undefined,
  );

  const choose = (orderType: OrderType) => {
    setSession({ orderType, tableNo: null });
    nav(orderType === "DINE_IN" ? "/table" : "/menu");
  };

  return (
    <div className="flex flex-1 flex-col px-6 pb-8 pt-6">
      <div className="flex justify-end">
        <RoleSwitch />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <LoafMark className="h-20 w-28" animate />
        <h1 className="mt-5 font-brand text-6xl leading-none text-lita-800">
          Lita
        </h1>
        <p className="mt-2 text-sm tracking-wide text-ink-mute">
          {SHOP_TAGLINE}
        </p>
        <p className="mt-8 text-base font-semibold text-ink">
          วันนี้รับแบบไหนดีคะ
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => choose("DINE_IN")}
          className="flex w-full items-center gap-4 rounded-2xl bg-lita-800 p-5 text-left text-white transition-transform active:scale-[0.99]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15">
            <Utensils className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-lg font-semibold">ทานที่ร้าน</span>
            <span className="block text-sm text-lita-100">
              เลือกโต๊ะแล้วสั่งได้เลย
            </span>
          </span>
        </button>

        <button
          onClick={() => choose("TAKEAWAY")}
          className="flex w-full items-center gap-4 rounded-2xl border border-line p-5 text-left transition-colors hover:border-lita-400 active:scale-[0.99]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lita-50 text-lita-800">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-lg font-semibold text-ink">
              ซื้อกลับ
            </span>
            <span className="block text-sm text-ink-mute">
              รับบัตรคิวแล้วรอรับที่เคาน์เตอร์
            </span>
          </span>
        </button>

        {last && last.status !== "COMPLETED" && last.status !== "CANCELLED" ? (
          <Link
            to={`/order/${last.id}`}
            className="block pt-1 text-center text-sm font-medium text-lita-800 underline underline-offset-4"
          >
            ดูสถานะคิว {last.queueNo} ที่สั่งไว้
          </Link>
        ) : null}
      </div>
    </div>
  );
}
