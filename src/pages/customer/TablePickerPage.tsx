import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { TABLES } from '../../data/constants'
import { useAppStore } from '../../store/useAppStore'
import { useCartStore } from '../../store/useCartStore'
import { getTableState } from '../../services'

/** ลูกค้าเลือกโต๊ะ — เฉพาะ flow ทานที่ร้าน */
export default function TablePickerPage() {
  const nav = useNavigate()
  const orders = useAppStore((s) => s.orders)
  const setSession = useCartStore((s) => s.setSession)
  const tableNo = useCartStore((s) => s.session.tableNo)

  const pick = (no: string) => {
    setSession({ orderType: 'DINE_IN', tableNo: no })
    nav('/menu')
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-5">
      <h1 className="font-brand text-3xl text-ink">เลือกโต๊ะ</h1>
      <p className="mt-1 text-sm text-ink-mute">กดหมายเลขโต๊ะที่นั่งอยู่ เพื่อให้พนักงานเสิร์ฟถูกที่</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {TABLES.map((t) => {
          const state = getTableState(orders, t.tableNo)
          const busy = state.stage !== 'FREE'
          const on = tableNo === t.tableNo
          return (
            <button
              key={t.tableNo}
              onClick={() => pick(t.tableNo)}
              aria-pressed={on}
              className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
                on ? 'border-lita-700 bg-lita-50' : busy ? 'border-amber-200 bg-amber-50/50' : 'border-line hover:border-lita-400'
              }`}
            >
              <span className="font-brand text-3xl leading-none text-lita-800">{t.tableNo}</span>
              <span className="flex items-center gap-1 text-xs text-ink-mute">
                <Users className="h-3.5 w-3.5" /> {t.seats} ที่นั่ง
              </span>
              <span className={`mt-1 text-xs font-medium ${busy ? 'text-amber-700' : 'text-lita-700'}`}>
                {busy ? 'มีออเดอร์ค้างอยู่' : 'ว่าง'}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-6 text-center text-xs text-ink-mute">
        โต๊ะที่มีออเดอร์ค้างยังสั่งเพิ่มได้ — ระบบจะรวมบิลให้โต๊ะเดียวกัน
      </p>
    </div>
  )
}
