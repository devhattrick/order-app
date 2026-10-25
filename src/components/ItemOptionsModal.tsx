import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import type { CartItem, MenuItem, SelectedOption } from "../types";
import { baht } from "../utils/format";
import { MenuThumb, Modal, QtyStepper } from "./ui";

interface Props {
  menu: MenuItem | null;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}

/** Popup เลือก Option เสริม (ขนาด / ความหวาน / ท็อปปิ้ง ฯลฯ) ก่อนลงตะกร้า */
export function ItemOptionsModal({ menu, onClose, onAdd }: Props) {
  return (
    <Modal open={!!menu} onClose={onClose} title={menu?.name}>
      {menu ? (
        <Body
          key={menu.id}
          menu={menu}
          onAdd={(i) => {
            onAdd(i);
            onClose();
          }}
        />
      ) : null}
    </Modal>
  );
}

function Body({
  menu,
  onAdd,
}: {
  menu: MenuItem;
  onAdd: (item: CartItem) => void;
}) {
  const allGroups = useAppStore((s) => s.optionGroups);
  const groups = useMemo(
    () =>
      menu.optionGroupIds
        .map((id) => allGroups.find((g) => g.id === id))
        .filter((g) => !!g),
    [menu, allGroups],
  );

  const [picked, setPicked] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      groups.map((g) => [
        g.id,
        g.type === "SINGLE" && g.defaultChoiceId ? [g.defaultChoiceId] : [],
      ]),
    ),
  );
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const selected: SelectedOption[] = groups.flatMap((g) =>
    (picked[g.id] ?? []).map((cid) => {
      const c = g.choices.find((x) => x.id === cid)!;
      return {
        groupId: g.id,
        groupName: g.name,
        choiceId: c.id,
        choiceName: c.name,
        priceDelta: c.priceDelta,
      };
    }),
  );
  const unitPrice = menu.price + selected.reduce((s, o) => s + o.priceDelta, 0);
  const missing = groups.filter((g) => g.required && !picked[g.id]?.length);

  const toggle = (gid: string, cid: string, single: boolean) =>
    setPicked((p) => {
      const cur = p[gid] ?? [];
      if (single) return { ...p, [gid]: [cid] };
      return {
        ...p,
        [gid]: cur.includes(cid) ? cur.filter((x) => x !== cid) : [...cur, cid],
      };
    });

  const submit = () => {
    const key = [
      menu.id,
      ...selected.map((s) => s.choiceId).sort(),
      note.trim(),
    ].join("|");
    onAdd({
      key,
      menuId: menu.id,
      name: menu.name,
      emoji: menu.emoji,
      basePrice: menu.price,
      options: selected,
      unitPrice,
      qty,
      note: note.trim() || undefined,
    });
  };

  return (
    <div>
      <div className="flex items-center gap-4 border-b border-line p-5 pr-14">
        <MenuThumb menu={menu} size="lg" />
        <div>
          <h2 className="font-bold text-2xl leading-tight text-ink">
            {menu.name}
          </h2>
          <p className="text-sm text-ink-soft">{menu.nameTh}</p>
          <p className="mt-1 text-sm text-ink-mute">{menu.description}</p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {groups.map((g) => (
          <fieldset key={g.id}>
            <legend className="mb-2 flex w-full items-baseline justify-between">
              <span className="font-semibold text-ink">{g.name}</span>
              <span className="text-xs text-ink-mute">
                {g.required
                  ? "ต้องเลือก 1 อย่าง"
                  : g.type === "MULTI"
                    ? "เลือกได้หลายอย่าง"
                    : "ไม่บังคับ"}
              </span>
            </legend>
            <div
              className={
                g.type === "SINGLE" && g.choices.length <= 4
                  ? "grid grid-cols-2 gap-2"
                  : "space-y-2"
              }
            >
              {g.choices.map((c) => {
                const on = picked[g.id]?.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(g.id, c.id, g.type === "SINGLE")}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${on ? "border-lita-700 bg-lita-50 text-lita-900" : "border-line hover:border-lita-200"}`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`grid h-5 w-5 place-items-center border ${g.type === "SINGLE" ? "rounded-full" : "rounded-md"} ${on ? "border-lita-700 bg-lita-700 text-white" : "border-zinc-300"}`}
                      >
                        {on ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : null}
                      </span>
                      {c.name}
                    </span>
                    {c.priceDelta ? (
                      <span className="text-ink-soft">+{c.priceDelta}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div>
          <label htmlFor="item-note" className="label">
            หมายเหตุถึงครัว
          </label>
          <input
            id="item-note"
            className="field"
            placeholder="เช่น ไม่ใส่หอม, แยกซอส"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-white p-4">
        <QtyStepper value={qty} min={1} onChange={setQty} />
        <button
          className="btn-primary flex-1 py-3 text-base"
          disabled={missing.length > 0}
          onClick={submit}
        >
          ใส่ตะกร้า {baht(unitPrice * qty)}
        </button>
      </div>
    </div>
  );
}
