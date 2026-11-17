import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

/**
 * ด่านตรวจสิทธิ์หน้าฝั่งร้าน
 * -------------------------------------------------------------
 * นี่เป็นแค่การ "ซ่อนหน้าจอ" เพื่อประสบการณ์ใช้งานที่ดีเท่านั้น
 * การบังคับสิทธิ์จริงอยู่ที่ SecurityConfig ฝั่ง Backend
 * ต่อให้พิมพ์ url ตรงเข้าไป API ก็ยังตอบ 401/403 อยู่ดี
 *
 * @param role ถ้าระบุ = ต้องมีสิทธิ์นี้เท่านั้นถึงเข้าได้ (ใช้กับหน้า Dashboard)
 */
export function RequireAuth({ role }: { role?: "ADMIN" }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // ยังเช็ค token เดิมไม่เสร็จ — รอก่อน ไม่งั้นจะเด้งไปหน้า login ทั้งที่ login อยู่
  if (status === "CHECKING") {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-lita-700" />
      </div>
    );
  }

  if (status === "OUT") {
    // จำหน้าที่ตั้งใจจะเข้าไว้ เพื่อพากลับมาหลัง login สำเร็จ
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/admin/pos" replace />;
  }

  return <Outlet />;
}
