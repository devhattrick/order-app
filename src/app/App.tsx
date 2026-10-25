import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CustomerLayout } from './CustomerLayout'
import { AdminLayout } from './AdminLayout'
import { Toaster } from '../components/ui'
import { ConfirmHost } from '../components/ConfirmDialog'
import WelcomePage from '../pages/customer/WelcomePage'
import TablePickerPage from '../pages/customer/TablePickerPage'
import MenuPage from '../pages/customer/MenuPage'
import CartPage from '../pages/customer/CartPage'
import OrderStatusPage from '../pages/customer/OrderStatusPage'
import PosPage from '../pages/admin/PosPage'
import OrderBoardPage from '../pages/admin/OrderBoardPage'
import MenuManagementPage from '../pages/admin/MenuManagementPage'
import HistoryPage from '../pages/admin/HistoryPage'
import DashboardPage from '../pages/admin/DashboardPage'

// ใช้ HashRouter เพื่อให้ refresh หน้าบน GitHub Pages ได้โดยไม่เจอ 404
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route index element={<WelcomePage />} />
          <Route path="table" element={<TablePickerPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="order/:id" element={<OrderStatusPage />} />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="pos" replace />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="orders" element={<OrderBoardPage />} />
          <Route path="menu" element={<MenuManagementPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
      <ConfirmHost />
    </HashRouter>
  )
}
