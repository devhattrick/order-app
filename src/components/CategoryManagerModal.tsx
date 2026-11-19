import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { errorMessage } from "../lib/apiClient";
import { categoryService } from "../services";
import { useAppStore } from "../store/useAppStore";
import { confirm } from "../store/useConfirm";
import { toast } from "../store/useToast";
import type { MenuCategory } from "../types";
import { Modal, Req } from "./ui";

/**
 * จัดการหมวดหมู่เมนู — เพิ่ม / แก้ชื่อ / ลบ / เรียงลำดับ
 *
 * เปิดจากหน้าจัดการเมนู เฉพาะ ADMIN
 * ฝั่ง Backend บังคับสิทธิ์ไว้อีกชั้นที่ SecurityConfig
 */
export function CategoryManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const categories = useAppStore((s) => s.categories);
  const [editing, setEditing] = useState<MenuCategory | "NEW" | null>(null);

  return (
    <>
      <Modal open={open} onClose={onClose} title="จัดการหมวดหมู่เมนู">
        <div className="p-5 pr-14">
          <h2 className="font-brand text-2xl text-ink">จัดการหมวดหมู่เมนู</h2>
          <p className="mt-0.5 text-sm text-ink-mute">
            หมวดหมู่ใช้จัดกลุ่มเมนูบนหน้าสั่งอาหารและใช้แยกยอดขายในรายงาน
          </p>
        </div>

        <ul className="divide-y divide-line border-t border-line">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
              <GripVertical className="h-4 w-4 shrink-0 text-ink-mute" aria-hidden />
              <span className="w-6 shrink-0 text-xs tabular-nums text-ink-mute">{c.sortOrder}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                <p className="text-xs text-ink-mute">
                  {c.nameEn ? `${c.nameEn} · ` : ""}
                  {c.menuCount} เมนู
                </p>
              </div>
              <button
                onClick={() => setEditing(c)}
                aria-label={`แก้ไข ${c.name}`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-lita-50 hover:text-lita-800"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="sticky bottom-0 flex gap-3 border-t border-line bg-white p-4">
          <button onClick={onClose} className="btn-soft flex-1 py-3">
            ปิด
          </button>
          <button onClick={() => setEditing("NEW")} className="btn-primary flex-1 justify-center py-3">
            <Plus className="h-4 w-4" /> เพิ่มหมวดหมู่
          </button>
        </div>
      </Modal>

      <CategoryFormModal editing={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function CategoryFormModal({
  editing,
  onClose,
}: {
  editing: MenuCategory | "NEW" | null;
  onClose: () => void;
}) {
  const current = editing === "NEW" ? null : editing;
  const refreshCategories = useAppStore((s) => s.refreshCategories);
  const refreshMenus = useAppStore((s) => s.refreshMenus);

  const [form, setForm] = useState(() => ({
    name: current?.name ?? "",
    nameEn: current?.nameEn ?? "",
    sortOrder: current?.sortOrder ?? 0,
  }));
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await categoryService.save({
        id: current?.id,
        name: form.name.trim(),
        nameEn: form.nameEn.trim() || undefined,
        sortOrder: current ? form.sortOrder : undefined,
      });
      await refreshCategories();
      // เปลี่ยนชื่อหมวดแล้วเมนูต้องแสดงชื่อใหม่ตามไปด้วย
      if (current) await refreshMenus();
      toast(current ? `อัปเดต "${form.name}" แล้ว` : `เพิ่มหมวด "${form.name}" แล้ว`);
      onClose();
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!current) return;

    // เตือนตั้งแต่ก่อนยิง API ถ้ารู้อยู่แล้วว่ามีเมนูใช้อยู่
    if (current.menuCount > 0) {
      toast(`ลบไม่ได้ — ยังมี ${current.menuCount} เมนูในหมวดนี้ ย้ายเมนูไปหมวดอื่นก่อน`);
      return;
    }

    const ok = await confirm({
      title: `ลบหมวด "${current.name}"?`,
      message: "ออเดอร์เก่าไม่กระทบ เพราะเก็บชื่อหมวด ณ เวลาที่สั่งไว้ในตัวออเดอร์แล้ว",
      confirmLabel: "ลบหมวดหมู่",
    });
    if (!ok) return;

    try {
      await categoryService.remove(current.id);
      await refreshCategories();
      toast(`ลบ "${current.name}" แล้ว`);
      onClose();
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  const valid = form.name.trim().length > 0;

  return (
    <Modal
      open={!!editing}
      onClose={onClose}
      title={current ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
    >
      <div className="p-5 pr-14">
        <h2 className="font-brand text-2xl text-ink">{current ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h2>
        {current ? (
          <p className="mt-0.5 text-sm text-ink-mute">ใช้อยู่ใน {current.menuCount} เมนู</p>
        ) : null}
      </div>

      <div className="space-y-4 border-t border-line p-5">
        <div>
          <label htmlFor="cat-name" className="label">
            ชื่อหมวดหมู่
            <Req />
          </label>
          <input
            id="cat-name"
            className="field"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="เช่น กาแฟ"
            autoFocus
          />
          <p className="mt-1 text-xs text-ink-mute">ชื่อนี้แสดงบนแท็บหน้าสั่งอาหารและในรายงานยอดขาย</p>
        </div>

        <div>
          <label htmlFor="cat-name-en" className="label">
            ชื่อภาษาอังกฤษ
          </label>
          <input
            id="cat-name-en"
            className="field"
            value={form.nameEn}
            onChange={(e) => set("nameEn", e.target.value)}
            placeholder="เช่น Coffee (ไม่บังคับ)"
          />
        </div>

        {current ? (
          <div>
            <label htmlFor="cat-sort" className="label">
              ลำดับการแสดง
            </label>
            <input
              id="cat-sort"
              type="number"
              className="field w-28"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-ink-mute">เลขน้อยแสดงก่อน</p>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 flex gap-3 border-t border-line bg-white p-4">
        {current ? (
          <button
            onClick={remove}
            disabled={current.menuCount > 0}
            title={current.menuCount > 0 ? "ยังมีเมนูใช้หมวดนี้อยู่" : undefined}
            className="btn-danger px-4 py-3 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
        <button onClick={onClose} className="btn-soft flex-1 py-3">
          ยกเลิก
        </button>
        <button
          onClick={save}
          disabled={!valid || busy}
          className="btn-primary flex-1 py-3 disabled:opacity-40"
        >
          {current ? "บันทึก" : "เพิ่มหมวดหมู่"}
        </button>
      </div>
    </Modal>
  );
}
