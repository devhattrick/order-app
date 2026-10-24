import { Link, useLocation } from 'react-router-dom'

/** ปุ่มสลับมุมมอง ลูกค้า / ร้าน — ใช้แทน Login ระหว่าง Present */
export function RoleSwitch({ dark = false }: { dark?: boolean }) {
  const isAdmin = useLocation().pathname.startsWith('/admin')
  const base = 'rounded-full px-3 py-1 text-xs font-semibold transition-colors'
  const on = dark ? 'bg-white text-lita-900' : 'bg-lita-800 text-white'
  const off = dark ? 'text-lita-100 hover:text-white' : 'text-ink-soft hover:text-lita-800'
  return (
    <nav aria-label="สลับมุมมอง" className={`inline-flex rounded-full p-0.5 ${dark ? 'bg-white/10' : 'bg-lita-50'}`}>
      <Link to="/" className={`${base} ${!isAdmin ? on : off}`}>ลูกค้า</Link>
      <Link to="/admin/pos" className={`${base} ${isAdmin ? on : off}`}>ร้าน</Link>
    </nav>
  )
}
