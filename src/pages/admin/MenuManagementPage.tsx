import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { Category, MenuItem } from '../../types'
import { PageHeader } from '../../app/AdminLayout'
import { MenuThumb, Modal } from '../../components/ui'
import { CATEGORIES, categoryLabel } from '../../data/constants'
import { useAppStore } from '../../store/useAppStore'
import { menuService } from '../../services'
import { baht } from '../../utils/format'
import { toast } from '../../store/useToast'

const EMOJI_CHOICES = ['🥐', '🍞', '🥯', '🥖', '🧁', '🍰', '🍪', '🍩', '🥧', '🍫', '🥪', '🥗', '☕️', '🍵', '🧋', '🍋']

/** ร้านเพิ่ม/แก้ไขเมนูเองได้ — โดยเฉพาะเมนูขนมที่เปลี่ยนตามฤดูกาล */
export default function MenuManagementPage() {
  const menus = useAppStore((s) => s.menus)
  const [cat, setCat] = useState<Category | 'ALL'>('ALL')
  const [editing, setEditing] = useState<MenuItem | 'NEW' | null>(null)

  const visible = useMemo(() => (cat === 'ALL' ? menus : menus.filter((m) => m.category === cat)), [menus, cat])

  return (
    <>
      <PageHeader
        title="จัดการเมนู"
        subtitle={`${menus.length} เมนูในระบบ · ${menus.filter((m) => !m.isAvailable).length} เมนูปิดขายอยู่`}
        actions={
          <button onClick={() => setEditing('NEW')} className="btn-primary flex items-center gap-2 px-4 py-2.5">
            <Plus className="h-4 w-4" /> เพิ่มเมนูใหม่
          </button>
        }
      />

      <div className="flex gap-2 overflow-x-auto px-4 pb-4 sm:px-8 [scrollbar-width:none]">
        {[{ id: 'ALL' as const, label: 'ทั้งหมด' }, ...CATEGORIES].map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${cat === c.id ? 'bg-lita-800 text-white' : 'bg-lita-50 text-lita-800 hover:bg-lita-100'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-8 sm:px-8">
        <div className="panel overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-lita-50/60 text-xs uppercase tracking-wide text-ink-mute">
              <tr>
                <th className="px-4 py-3 font-medium">เมนู</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">หมวด</th>
                <th className="px-4 py-3 text-right font-medium">ราคา</th>
                <th className="px-4 py-3 text-center font-medium">เปิดขาย</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((m) => (
                <tr key={m.id} className={m.isAvailable ? '' : 'bg-zinc-50/70'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <MenuThumb menu={m} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{m.name}</p>
                        <p className="truncate text-xs text-ink-mute">{m.nameTh}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">{categoryLabel(m.category)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{baht(m.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      role="switch"
                      aria-checked={m.isAvailable}
                      aria-label={`เปิดขาย ${m.name}`}
                      onClick={() => menuService.toggleAvailability(m.id)}
                      className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${m.isAvailable ? 'bg-lita-700' : 'bg-zinc-300'}`}
                    >
                      <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${m.isAvailable ? 'translate-x-5' : ''}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(m)} aria-label={`แก้ไข ${m.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-lita-50 hover:text-lita-800">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!window.confirm(`ลบเมนู ${m.name}?`)) return
                          menuService.remove(m.id)
                          toast(`ลบ ${m.name} แล้ว`)
                        }}
                        aria-label={`ลบ ${m.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MenuFormModal key={editing === 'NEW' ? 'new' : (editing?.id ?? 'none')} editing={editing} onClose={() => setEditing(null)} />
    </>
  )
}

function MenuFormModal({ editing, onClose }: { editing: MenuItem | 'NEW' | null; onClose: () => void }) {
  const groups = useAppStore((s) => s.optionGroups)
  const current = editing === 'NEW' ? null : editing
  const [form, setForm] = useState(() => ({
    name: current?.name ?? '',
    nameTh: current?.nameTh ?? '',
    description: current?.description ?? '',
    price: current?.price ?? 0,
    category: (current?.category ?? 'DESSERT') as Category,
    emoji: current?.emoji ?? '🧁',
    optionGroupIds: current?.optionGroupIds ?? [],
    isAvailable: current?.isAvailable ?? true,
  }))

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.name.trim() && form.price > 0

  const save = () => {
    menuService.save({ ...form, name: form.name.trim(), nameTh: form.nameTh.trim() || form.name.trim(), id: current?.id })
    toast(current ? `อัปเดต ${form.name} แล้ว` : `เพิ่ม ${form.name} เข้าเมนูแล้ว`)
    onClose()
  }

  return (
    <Modal open={!!editing} onClose={onClose} title={current ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'} wide>
      <div className="p-5 pr-14">
        <h2 className="font-brand text-2xl text-ink">{current ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h2>
        <p className="mt-0.5 text-sm text-ink-mute">เมนูที่เปิดขายจะขึ้นให้ลูกค้าเลือกทันที</p>
      </div>

      <div className="space-y-4 border-t border-line p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-name" className="label">ชื่อเมนู (อังกฤษ) *</label>
            <input id="f-name" className="field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Pistachio Croissant" />
          </div>
          <div>
            <label htmlFor="f-nameth" className="label">ชื่อเมนู (ไทย)</label>
            <input id="f-nameth" className="field" value={form.nameTh} onChange={(e) => set('nameTh', e.target.value)} placeholder="ครัวซองต์พิสตาชิโอ" />
          </div>
        </div>

        <div>
          <label htmlFor="f-desc" className="label">คำอธิบาย</label>
          <input id="f-desc" className="field" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="ไส้พิสตาชิโอบด อบใหม่ทุกเช้า" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-price" className="label">ราคา (บาท) *</label>
            <input id="f-price" type="number" min={0} className="field" value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="f-cat" className="label">หมวดหมู่</label>
            <select id="f-cat" className="field" value={form.category} onChange={(e) => set('category', e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className="label">ไอคอนเมนู</span>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={form.emoji === e}
                onClick={() => set('emoji', e)}
                className={`grid h-10 w-10 place-items-center rounded-xl border text-xl transition-colors ${form.emoji === e ? 'border-lita-700 bg-lita-50' : 'border-line hover:border-lita-300'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">ตัวเลือกเสริมที่ใช้กับเมนูนี้</span>
          <div className="space-y-2">
            {groups.map((g) => {
              const on = form.optionGroupIds.includes(g.id)
              return (
                <label key={g.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${on ? 'border-lita-700 bg-lita-50' : 'border-line'}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => set('optionGroupIds', on ? form.optionGroupIds.filter((x) => x !== g.id) : [...form.optionGroupIds, g.id])}
                    className="mt-0.5 h-4 w-4 accent-lita-700"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{g.name}</span>
                    <span className="block text-xs text-ink-mute">
                      {g.type === 'SINGLE' ? 'เลือกได้ 1 อย่าง' : 'เลือกได้หลายอย่าง'} · {g.choices.map((c) => c.name).join(', ')}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.isAvailable} onChange={(e) => set('isAvailable', e.target.checked)} className="h-4 w-4 accent-lita-700" />
          เปิดขายทันที
        </label>
      </div>

      <div className="sticky bottom-0 flex gap-3 border-t border-line bg-white p-4">
        <button onClick={onClose} className="btn-soft flex-1 py-3">ยกเลิก</button>
        <button onClick={save} disabled={!valid} className="btn-primary flex-1 py-3 disabled:opacity-40">
          {current ? 'บันทึกการแก้ไข' : 'เพิ่มเมนู'}
        </button>
      </div>
    </Modal>
  )
}
