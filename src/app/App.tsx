import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ConfirmHost } from "../components/ConfirmDialog";
import { Toaster } from "../components/ui";
import LoginPage from "../pages/LoginPage";
import TrackPage from "../pages/TrackPage";
import DashboardPage from "../pages/admin/DashboardPage";
import HistoryPage from "../pages/admin/HistoryPage";
import MenuManagementPage from "../pages/admin/MenuManagementPage";
import OrderBoardPage from "../pages/admin/OrderBoardPage";
import PosPage from "../pages/admin/PosPage";
import { useAuthStore } from "../store/useAuthStore";
import { AdminLayout } from "./AdminLayout";
import { RequireAuth } from "./RequireAuth";

// ใช้ HashRouter เพื่อให้ refresh หน้าบน static hosting ได้โดยไม่เจอ 404
export default function App() {
  const restore = useAuthStore((s) => s.restore);

  // เปิดแอปครั้งแรก: เอา token ที่เก็บไว้ไปยืนยันกับ Backend ว่ายังใช้ได้
  useEffect(() => {
    void restore();
  }, [restore]);

  return (
    <HashRouter>
      <Routes>
        {/* สาธารณะ — ลูกค้าสแกน QR เข้ามาดูสถานะได้โดยไม่ต้อง login */}
        <Route path="/track/:token" element={<TrackPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ฝั่งร้าน — ต้อง login ทุกหน้า */}
        <Route element={<RequireAuth />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="pos" replace />} />
            <Route path="pos" element={<PosPage />} />
            <Route path="orders" element={<OrderBoardPage />} />
            <Route path="menu" element={<MenuManagementPage />} />
            <Route path="history" element={<HistoryPage />} />
            {/* Dashboard เปิดให้เฉพาะ ADMIN — ฝั่ง Backend ก็บล็อก STAFF ไว้อีกชั้น */}
            <Route element={<RequireAuth role="ADMIN" />}>
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/admin/pos" replace />} />
      </Routes>
      <Toaster />
      <ConfirmHost />
    </HashRouter>
  );
}
