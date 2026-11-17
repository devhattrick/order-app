import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LoafMark } from "../components/ui";
import { SHOP_NAME, SHOP_TAGLINE } from "../data/constants";
import { errorMessage } from "../lib/apiClient";
import { useAuthStore } from "../store/useAuthStore";

/** หน้าเข้าสู่ระบบของพนักงาน — ประตูเดียวเข้าหน้าร้านทั้งหมด */
export default function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** หน้าร้านพิมพ์บนแท็บเล็ตบ่อย กดผิดง่าย — ให้กดดูรหัสที่พิมพ์ไปได้ */
  const [showPassword, setShowPassword] = useState(false);

  // login อยู่แล้วแต่เปิด /login ตรง ๆ — พากลับเข้าหน้าร้านเลย
  if (status === "IN") return <Navigate to="/admin/pos" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username.trim(), password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? "/admin/pos", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-lita-900 px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <LoafMark className="h-12 w-16" tone="white" />
          <h1 className="mt-3 font-brand text-4xl leading-none text-white">{SHOP_NAME}</h1>
          <p className="mt-1.5 text-sm text-lita-300">{SHOP_TAGLINE}</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold text-ink">เข้าสู่ระบบพนักงาน</h2>
          <p className="mt-0.5 text-sm text-ink-mute">ใช้บัญชีที่ร้านออกให้เท่านั้น</p>

          <div className="mt-5 space-y-3">
            <div>
              <label htmlFor="username" className="label">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                <input
                  id="username"
                  className="field pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="field pl-10 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((on) => !on)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-lita-50 hover:text-lita-800"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || !username.trim() || !password}
            className="btn-primary mt-5 w-full justify-center py-3 text-base disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "กำลังเข้าสู่ระบบ" : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed text-lita-400">
          ลูกค้าที่ต้องการติดตามสถานะออเดอร์
          <span className="block">สแกน QR บนใบเสร็จได้เลย ไม่ต้องเข้าสู่ระบบ</span>
        </p>
      </div>
    </div>
  );
}
