import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, ClipboardList, History, LayoutGrid, RotateCcw, UtensilsCrossed } from 'lucide-react'
import { Logo } from '../components/ui'
import { RoleSwitch } from './RoleSwitch'
import { useAppStore } from '../store/useAppStore'
import { useCartStore } from '../store/useCartStore'
import { toast } from '../store/useToast'
import { confirm } from '../store/useConfirm'

const NAV = [
  { to: '/admin/pos', label: 'ผังโต๊ะ & สั่งอาหาร', short: 'โต๊ะ', icon: LayoutGrid },
  { to: '/admin/orders', label: 'ออเดอร์ในครัว', short: 'ครัว', icon: ClipboardList, badge: true },
  { to: '/admin/menu', label: 'จัดการเมนู', short: 'เมนู', icon: UtensilsCrossed },
  { to: '/admin/history', label: 'ประวัติออเดอร์', short: 'ประวัติ', icon: History },
  { to: '/admin/dashboard', label: 'Dashboard', short: 'สรุป', icon: BarChart3 },
]

export function AdminLayout() {
  const activeCount = useAppStore((s) => s.orders.reduce((n, o) => n + (o.status === 'PENDING' ? 1 : 0), 0))
  const reset = async () => {
    const ok = await confirm({
      title: 'รีเซ็ตข้อมูล Demo?',
      message: 'ออเดอร์และเมนูที่แก้ไว้ทั้งหมดจะถูกล้าง แล้วกลับไปใช้ข้อมูลตัวอย่างเริ่มต้น',
      confirmLabel: 'รีเซ็ตข้อมูล',
    })
    if (!ok) return
    useAppStore.getState().resetDemo()
    useCartStore.setState({ carts: {}, session: { orderType: null, tableNo: null } })
    toast('รีเซ็ตข้อมูลตัวอย่างแล้ว')
  }

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col bg-lita-900 px-4 py-5 text-lita-100 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="mb-1 px-2"><Logo tone="white" /></div>
        <p className="mb-6 px-2 text-xs text-lita-400">ระบบหน้าร้าน</p>
        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-white text-lita-900' : 'hover:bg-white/10 hover:text-white'}`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{label}</span>
              {badge && activeCount > 0 ? <span className="rounded-full bg-amber-400 px-2 text-xs font-bold text-amber-950">{activeCount}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3 border-t border-white/10 pt-4">
          <RoleSwitch dark />
          <button onClick={reset} className="flex items-center gap-2 px-1 text-xs text-lita-400 hover:text-white">
            <RotateCcw className="h-3.5 w-3.5" /> รีเซ็ตข้อมูล Demo
          </button>
        </div>
      </aside>

      {/* Top bar (Mobile/Tablet) */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-lita-900 px-4 py-3 lg:hidden">
        <Logo tone="white" />
        <div className="flex items-center gap-2">
          <button onClick={reset} aria-label="รีเซ็ตข้อมูล Demo" className="grid h-8 w-8 place-items-center rounded-full text-lita-200 hover:bg-white/10">
            <RotateCcw className="h-4 w-4" />
          </button>
          <RoleSwitch dark />
        </div>
      </header>

      <main className="min-w-0 flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav (Mobile/Tablet) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white lg:hidden">
        {NAV.map(({ to, short, icon: Icon, badge }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-lita-800' : 'text-ink-mute'}`}>
            <Icon className="h-5 w-5" />
            {short}
            {badge && activeCount > 0 ? <span className="absolute right-[28%] top-1 h-2 w-2 rounded-full bg-amber-500" /> : null}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4 pt-6 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-mute">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  )
}
