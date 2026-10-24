import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import type { MenuItem } from '../../types'
import { MenuBrowser } from '../../components/MenuBrowser'
import { ItemOptionsModal } from '../../components/ItemOptionsModal'
import { cartCount, cartTotal, useCart, useCartStore } from '../../store/useCartStore'
import { ORDER_TYPE_LABEL } from '../../data/constants'
import { baht } from '../../utils/format'
import { toast } from '../../store/useToast'

export default function MenuPage() {
  const nav = useNavigate()
  const session = useCartStore((s) => s.session)
  const addItem = useCartStore((s) => s.addItem)
  const items = useCart('customer')
  const [picked, setPicked] = useState<MenuItem | null>(null)

  if (!session.orderType) return <Navigate to="/" replace />
  if (session.orderType === 'DINE_IN' && !session.tableNo) return <Navigate to="/table" replace />

  const count = cartCount(items)

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-5 pt-4">
        <div>
          <p className="font-brand text-2xl leading-tight text-ink">เลือกเมนู</p>
          <p className="text-sm text-ink-mute">
            {ORDER_TYPE_LABEL[session.orderType]}
            {session.tableNo ? ` · โต๊ะ ${session.tableNo}` : ''}
          </p>
        </div>
        <Link to={session.orderType === 'DINE_IN' ? '/table' : '/'} className="text-sm font-medium text-lita-800 underline-offset-2 hover:underline">
          เปลี่ยน
        </Link>
      </div>

      <div className="flex-1 px-5 pb-28">
        <MenuBrowser stickyTop="top-[57px]" onPick={setPicked} />
      </div>

      {count > 0 ? (
        <div className="sticky bottom-0 z-30 border-t border-line bg-white/95 p-4 backdrop-blur">
          <button onClick={() => nav('/cart')} className="btn-primary flex w-full items-center justify-between py-3.5 text-base">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              ดูตะกร้า · {count} รายการ
            </span>
            <span>{baht(cartTotal(items))}</span>
          </button>
        </div>
      ) : null}

      <ItemOptionsModal
        menu={picked}
        onClose={() => setPicked(null)}
        onAdd={(item) => {
          addItem('customer', item)
          toast(`เพิ่ม ${item.name} แล้ว`)
        }}
      />
    </div>
  )
}
