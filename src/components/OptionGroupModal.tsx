import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { OptionChoice, OptionGroup } from '../types'
import { Modal, Req } from './ui'
import { useAppStore } from '../store/useAppStore'
import { optionGroupService } from '../services'
import { toast } from '../store/useToast'
import { confirm } from '../store/useConfirm'
import { uid } from '../utils/format'

const newChoice = (): OptionChoice => ({ id: `c-${uid().slice(0, 6)}`, name: '', priceDelta: 0 })

interface Props {
  /** 'NEW' = สร้างใหม่ · OptionGroup = แก้ไข · null = ปิด */
  editing: OptionGroup | 'NEW' | null
  onClose: () => void
  /** เรียกเมื่อสร้างกลุ่มใหม่สำเร็จ — ใช้ติ๊กให้เมนูที่กำลังแก้อยู่อัตโนมัติ */
  onCreated?: (group: OptionGroup) => void
}

export function OptionGroupModal({ editing, onClose, onCreated }: Props) {
  const menus = useAppStore((s) => s.menus)
  const current = editing === 'NEW' ? null : editing

  const [form, setForm] = useState(() => ({
    name: current?.name ?? '',
    type: (current?.type ?? 'SINGLE') as OptionGroup['type'],
    required: current?.required ?? false,
    defaultChoiceId: current?.defaultChoiceId,
    choices: current?.choices.length ? [...current.choices] : [newChoice(), newChoice()],
  }))

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const setChoice = (id: string, patch: Partial<OptionChoice>) =>
    set('choices', form.choices.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const removeChoice = (id: string) =>
    setForm((f) => ({
      ...f,
      choices: f.choices.filter((c) => c.id !== id),
      defaultChoiceId: f.defaultChoiceId === id ? undefined : f.defaultChoiceId,
    }))

  const filled = form.choices.filter((c) => c.name.trim())
  const valid = form.name.trim() && filled.length >= 1

  /** เมนูที่ผูกกลุ่มนี้อยู่ — แก้ไขแล้วกระทบทุกตัว ต้องเตือนให้เห็น */
  const usedBy = current ? menus.filter((m) => m.optionGroupIds.includes(current.id)) : []

  const save = () => {
    const group = optionGroupService.save({
      id: current?.id,
      name: form.name.trim(),
      type: form.type,
      required: form.required,
      defaultChoiceId: form.type === 'SINGLE' ? form.defaultChoiceId : undefined,
      choices: filled.map((c) => ({ ...c, name: c.name.trim(), priceDelta: Number(c.priceDelta) || 0 })),
    })
    toast(current ? `อัปเดต "${group.name}" แล้ว` : `สร้างตัวเลือก "${group.name}" แล้ว`)
    if (!current) onCreated?.(group)
    onClose()
  }

  const remove = async () => {
    if (!current) return
    const ok = await confirm({
      title: `ลบตัวเลือก "${current.name}"?`,
      message: usedBy.length
        ? `กลุ่มนี้ถูกใช้อยู่ใน ${usedBy.length} เมนู (${usedBy.map((m) => m.name).slice(0, 3).join(', ')}${usedBy.length > 3 ? '…' : ''}) — จะถูกถอดออกจากเมนูเหล่านั้นด้วย ออเดอร์เก่าไม่กระทบ`
        : 'ยังไม่มีเมนูไหนใช้กลุ่มนี้',
      confirmLabel: 'ลบตัวเลือก',
    })
    if (!ok) return
    optionGroupService.remove(current.id)
    toast(`ลบ "${current.name}" แล้ว`)
    onClose()
  }

  return (
    <Modal open={!!editing} onClose={onClose} title={current ? 'แก้ไขตัวเลือกเสริม' : 'สร้างตัวเลือกเสริม'}>
      <div className="p-5 pr-14">
        <h2 className="font-brand text-2xl text-ink">{current ? 'แก้ไขตัวเลือกเสริม' : 'สร้างตัวเลือกเสริม'}</h2>
        <p className="mt-0.5 text-sm text-ink-mute">กลุ่มตัวเลือกใช้ซ้ำได้หลายเมนู เช่น “ระดับความหวาน” ใช้กับเครื่องดื่มทุกตัว</p>
      </div>

      <div className="space-y-4 border-t border-line p-5">
        {usedBy.length ? (
          <p className="rounded-xl bg-[#FBF5E9] px-3 py-2.5 text-xs leading-relaxed text-[#86672E]">
            กลุ่มนี้ถูกใช้อยู่ใน <b>{usedBy.length} เมนู</b> — แก้ตรงนี้แล้วจะเปลี่ยนทุกเมนูพร้อมกัน
            <span className="mt-0.5 block">ออเดอร์ที่สั่งไปแล้วไม่กระทบ เพราะเก็บชื่อและราคาตัวเลือกไว้ในออเดอร์แล้ว</span>
          </p>
        ) : null}

        <div>
          <label htmlFor="og-name" className="label">ชื่อกลุ่ม<Req /></label>
          <input id="og-name" className="field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="เช่น ระดับความเข้ม" />
        </div>

        <div>
          <span className="label">รูปแบบการเลือก</span>
          <div className="grid grid-cols-2 gap-2">
            {([
              { v: 'SINGLE' as const, t: 'เลือกได้ 1 อย่าง', d: 'เช่น ขนาด, ความหวาน' },
              { v: 'MULTI' as const, t: 'เลือกได้หลายอย่าง', d: 'เช่น ท็อปปิ้งเพิ่ม' },
            ]).map((o) => (
              <button
                key={o.v}
                type="button"
                aria-pressed={form.type === o.v}
                onClick={() => set('type', o.v)}
                className={`rounded-xl border p-3 text-left transition-colors ${form.type === o.v ? 'border-lita-700 bg-lita-50' : 'border-line hover:border-lita-200'}`}
              >
                <span className="block text-sm font-medium text-ink">{o.t}</span>
                <span className="block text-xs text-ink-mute">{o.d}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.required} onChange={(e) => set('required', e.target.checked)} className="h-4 w-4 accent-lita-700" />
          บังคับเลือก — ลูกค้าต้องเลือกก่อนใส่ตะกร้า
        </label>

        <div>
          <div className="mb-2 flex items-end justify-between">
            <span className="label mb-0">ตัวเลือกในกลุ่ม<Req /></span>
            {form.type === 'SINGLE' ? <span className="text-xs text-ink-mute">● = ค่าเริ่มต้น</span> : null}
          </div>

          <div className="space-y-2">
            {form.choices.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                {form.type === 'SINGLE' ? (
                  <input
                    type="radio"
                    name="og-default"
                    checked={form.defaultChoiceId === c.id}
                    onChange={() => set('defaultChoiceId', c.id)}
                    aria-label={`ตั้ง ${c.name || 'ตัวเลือกนี้'} เป็นค่าเริ่มต้น`}
                    className="h-4 w-4 shrink-0 accent-lita-700"
                  />
                ) : null}
                <input
                  className="field flex-1"
                  value={c.name}
                  onChange={(e) => setChoice(c.id, { name: e.target.value })}
                  placeholder="ชื่อตัวเลือก"
                  aria-label="ชื่อตัวเลือก"
                />
                <div className="relative w-28 shrink-0">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-mute">+฿</span>
                  <input
                    type="number"
                    className="field pl-9"
                    value={c.priceDelta || ''}
                    onChange={(e) => setChoice(c.id, { priceDelta: Number(e.target.value) })}
                    placeholder="0"
                    aria-label="ราคาที่บวกเพิ่ม"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeChoice(c.id)}
                  disabled={form.choices.length <= 1}
                  aria-label={`ลบตัวเลือก ${c.name || ''}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => set('choices', [...form.choices, newChoice()])} className="btn-soft mt-2 w-full justify-center py-2.5">
            <Plus className="h-4 w-4" /> เพิ่มตัวเลือก
          </button>
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-3 border-t border-line bg-white p-4">
        {current ? (
          <button onClick={remove} className="btn-danger px-4 py-3">ลบ</button>
        ) : null}
        <button onClick={onClose} className="btn-soft flex-1 py-3">ยกเลิก</button>
        <button onClick={save} disabled={!valid} className="btn-primary flex-1 py-3 disabled:opacity-40">
          {current ? 'บันทึก' : 'สร้างตัวเลือก'}
        </button>
      </div>
    </Modal>
  )
}
