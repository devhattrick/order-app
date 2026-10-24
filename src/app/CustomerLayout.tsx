import { Link, Outlet, useLocation } from 'react-router-dom'
import { Logo } from '../components/ui'
import { RoleSwitch } from './RoleSwitch'

/** ฝั่งลูกค้า: Mobile-first — บน Desktop แสดงเป็นกรอบมือถือกลางจอ */
export function CustomerLayout() {
  const isHome = useLocation().pathname === '/'
  return (
    <div className="min-h-screen bg-lita-50 sm:py-6">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-white sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-[2rem] sm:shadow-lift">
        {!isHome ? (
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/95 px-4 py-3 backdrop-blur">
            <Link to="/" aria-label="กลับหน้าแรก"><Logo /></Link>
            <RoleSwitch />
          </header>
        ) : null}
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
