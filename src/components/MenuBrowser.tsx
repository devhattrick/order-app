import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORIES } from "../data/constants";
import { useAppStore } from "../store/useAppStore";
import type { Category, MenuItem } from "../types";
import { baht } from "../utils/format";
import { MenuThumb } from "./ui";

interface Props {
  onPick: (menu: MenuItem) => void;
  /** layout = list (มือถือลูกค้า) | grid (หน้า POS พนักงาน) */
  layout?: "list" | "grid";
  stickyTop?: string;
}

export function MenuBrowser({
  onPick,
  layout = "list",
  stickyTop = "top-0",
}: Props) {
  const menus = useAppStore((s) => s.menus);
  const [cat, setCat] = useState<Category | "ALL">("ALL");
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return menus.filter(
      (m) =>
        (cat === "ALL" || m.category === cat) &&
        (!term ||
          m.name.toLowerCase().includes(term) ||
          m.nameTh.includes(term)),
    );
  }, [menus, cat, q]);

  const grouped = CATEGORIES.map((c) => ({
    ...c,
    items: visible.filter((m) => m.category === c.id),
  })).filter((g) => g.items.length);

  return (
    <div>
      <div
        className={`sticky ${stickyTop} z-20 space-y-3 bg-white/95 pb-3 pt-1 backdrop-blur`}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            className="field pl-10"
            placeholder="ค้นหาเมนู"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="ค้นหาเมนู"
          />
        </div>
        <div
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]"
          role="tablist"
        >
          {[{ id: "ALL" as const, label: "ทั้งหมด" }, ...CATEGORIES].map(
            (c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={cat === c.id}
                onClick={() => setCat(c.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${cat === c.id ? "bg-lita-800 text-white" : "bg-lita-50 text-lita-800 hover:bg-lita-100"}`}
              >
                {c.label}
              </button>
            ),
          )}
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-mute">
          ไม่พบเมนูที่ค้นหา
        </p>
      ) : null}

      {grouped.map((g) => (
        <section key={g.id} className="mb-6">
          <h3 className="mb-2 flex items-baseline gap-2">
            <span className="font-bold text-lg text-ink">{g.labelEn}</span>
            <span className="text-sm text-ink-mute">{g.label}</span>
          </h3>
          {layout === "list" ? (
            <ul className="divide-y divide-line">
              {g.items.map((m) => (
                <li key={m.id}>
                  <button
                    disabled={!m.isAvailable}
                    onClick={() => onPick(m)}
                    className="group flex w-full items-center gap-3 py-3 text-left disabled:opacity-45"
                  >
                    <MenuThumb menu={m} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-ink">
                        {m.name}
                      </p>
                      <p className="truncate text-sm text-ink-mute">
                        {m.isAvailable ? m.nameTh : "หมดชั่วคราว"}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-lita-800">
                        {baht(m.price)}
                      </p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lita-50 text-lita-800 transition-colors group-hover:bg-lita-800 group-hover:text-white group-disabled:hidden">
                      <Plus className="h-5 w-5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {g.items.map((m) => (
                <button
                  key={m.id}
                  disabled={!m.isAvailable}
                  onClick={() => onPick(m)}
                  className="flex items-center gap-2.5 rounded-xl border border-line p-2 text-left transition-colors hover:border-lita-400 hover:bg-lita-50 disabled:opacity-40"
                >
                  <MenuThumb menu={m} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight text-ink">
                      {m.name}
                    </p>
                    <p className="text-xs text-lita-800">
                      {m.isAvailable ? baht(m.price) : "หมด"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
