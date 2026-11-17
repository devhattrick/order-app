import {
  BarChart3,
  Bell,
  BellOff,
  ClipboardList,
  History,
  LayoutGrid,
  LogOut,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Logo } from "../components/ui";
import { useNewOrderAlert } from "../hooks/useNewOrderAlert";
import { useOrderPolling } from "../hooks/useOrderPolling";
import { useAppStore } from "../store/useAppStore";
import { useAuthStore } from "../store/useAuthStore";
import { confirm } from "../store/useConfirm";
import type { Role } from "../types";

/** adminOnly = เมนูที่ STAFF ไม่เห็น (Backend ก็บล็อกไว้อีกชั้นที่ SecurityConfig) */
const NAV = [
  { to: "/admin/pos", label: "ผังโต๊ะ & สั่งอาหาร", short: "โต๊ะ", icon: LayoutGrid },
  { to: "/admin/orders", label: "ออเดอร์ในครัว", short: "ครัว", icon: ClipboardList, badge: true },
  { to: "/admin/menu", label: "จัดการเมนู", short: "เมนู", icon: UtensilsCrossed },
  { to: "/admin/history", label: "ประวัติออเดอร์", short: "ประวัติ", icon: History },
  { to: "/admin/dashboard", label: "Dashboard", short: "สรุป", icon: BarChart3, adminOnly: true },
];

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "ผู้จัดการร้าน",
  STAFF: "พนักงานหน้าร้าน",
};

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const loadAll = useAppStore((s) => s.loadAll);
  const error = useAppStore((s) => s.error);
  const activeCount = useAppStore((s) =>
    s.orders.reduce((n, o) => n + (o.status === "PENDING" ? 1 : 0), 0),
  );
  const { soundOn, toggle: toggleSound, blocked } = useNewOrderAlert();

  // โหลดเมนู / ตัวเลือกเสริม / ออเดอร์ที่ยังไม่ปิด ครั้งเดียวตอนเข้าหน้าร้าน
  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // ดึงออเดอร์ล่าสุดตามรอบ ตลอดเวลาที่อยู่ในหน้าร้าน
  useOrderPolling(true);

  const nav = NAV.filter((item) => !item.adminOnly || user?.role === "ADMIN");

  const signOut = async () => {
    const ok = await confirm({
      title: "ออกจากระบบ?",
      message: "ต้องเข้าสู่ระบบใหม่เพื่อกลับมาใช้งานหน้าร้าน",
      confirmLabel: "ออกจากระบบ",
    });
    if (ok) logout();
  };

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col bg-lita-900 px-4 py-5 text-lita-100 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="mb-1 px-2">
          <Logo tone="white" />
        </div>
        <p className="mb-6 px-2 text-xs text-lita-400">ระบบหน้าร้าน</p>
        <nav className="flex-1 space-y-1">
          {nav.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-white text-lita-900" : "hover:bg-white/10 hover:text-white"}`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{label}</span>
              {badge && activeCount > 0 ? (
                <span className="rounded-full bg-amber-400 px-2 text-xs font-bold text-amber-950">
                  {activeCount}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 pt-4">
          <button
            onClick={toggleSound}
            aria-pressed={soundOn}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${soundOn ? "bg-white/10 text-white" : "text-lita-400 hover:bg-white/5"}`}
          >
            {soundOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            เสียงแจ้งออเดอร์ใหม่
            <span className="ml-auto text-xs">{soundOn ? "เปิด" : "ปิด"}</span>
          </button>
          {blocked ? (
            <p className="px-1 text-xs leading-relaxed text-amber-300">
              แตะหน้าจอสักครั้งเพื่อให้เบราว์เซอร์อนุญาตให้เล่นเสียง
            </p>
          ) : null}

          <div className="rounded-xl bg-white/5 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-white">{user?.displayName}</p>
            <p className="text-xs text-lita-400">
              {user ? ROLE_LABEL[user.role] : ""} · {user?.username}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-1 text-xs text-lita-400 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Top bar (Mobile/Tablet) */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-lita-900 px-4 py-3 lg:hidden">
        <Logo tone="white" />
        <div className="flex items-center gap-2">
          <span className="max-w-[9rem] truncate text-xs text-lita-300">{user?.displayName}</span>
          <button
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "ปิดเสียงแจ้งออเดอร์ใหม่" : "เปิดเสียงแจ้งออเดอร์ใหม่"}
            className={`grid h-8 w-8 place-items-center rounded-full hover:bg-white/10 ${soundOn ? "text-white" : "text-lita-400"}`}
          >
            {soundOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>
          <button
            onClick={signOut}
            aria-label="ออกจากระบบ"
            className="grid h-8 w-8 place-items-center rounded-full text-lita-200 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="min-w-0 flex-1 pb-20 lg:pb-0">
        {error ? (
          <p className="mx-4 mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 sm:mx-8">
            {error} — ตรวจสอบว่า Backend ทำงานอยู่ แล้วรีเฟรชหน้านี้อีกครั้ง
          </p>
        ) : null}
        <Outlet />
      </main>

      {/* Bottom nav (Mobile/Tablet) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-white lg:hidden"
        style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
      >
        {nav.map(({ to, short, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? "text-lita-800" : "text-ink-mute"}`
            }
          >
            <Icon className="h-5 w-5" />
            {short}
            {badge && activeCount > 0 ? (
              <span className="absolute right-[28%] top-1 h-2 w-2 rounded-full bg-amber-500" />
            ) : null}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4 pt-6 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-mute">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}
