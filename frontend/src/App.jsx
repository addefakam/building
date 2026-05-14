import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage       from './pages/LoginPage'
import Unauthorized    from './pages/Unauthorized'

// Tenant
import TenantLayout    from './layouts/TenantLayout'
import TenantBills     from './pages/tenant/TenantBills'
import TenantPayment   from './pages/tenant/TenantPayment'

// Manager
import ManagerLayout      from './layouts/ManagerLayout'
import ManagerDashboard   from './pages/manager/ManagerDashboard'
import MeterEntry         from './pages/manager/MeterEntry'
import Reconciliation     from './pages/manager/Reconciliation'
import TenantsManager     from './pages/manager/TenantsManager'
import ShopsManager       from './pages/manager/ShopsManager'
import Expenses           from './pages/manager/Expenses'
import Resources          from './pages/manager/Resources'
import Profile            from './pages/manager/Profile'
import Reports            from './pages/manager/Reports'

// Board
import BoardLayout     from './layouts/BoardLayout'
import BoardDashboard  from './pages/board/BoardDashboard'
import BoardInvoices   from './pages/board/BoardInvoices'
import UsersManager    from './pages/board/UsersManager'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Tenant routes */}
        <Route path="/tenant" element={
          <ProtectedRoute roles={['TENANT']}><TenantLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="bills" replace />} />
          <Route path="bills"   element={<TenantBills />} />
          <Route path="payment" element={<TenantPayment />} />
        </Route>

        {/* Manager routes */}
        <Route path="/manager" element={
          <ProtectedRoute roles={['MANAGER']}><ManagerLayout /></ProtectedRoute>
        }>
          <Route index      element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"      element={<ManagerDashboard />} />
          <Route path="meters"         element={<MeterEntry />} />
          <Route path="reconciliation" element={<Reconciliation />} />
          <Route path="tenants"        element={<TenantsManager />} />
          <Route path="shops"          element={<ShopsManager />} />
          <Route path="expenses"       element={<Expenses />} />
          <Route path="resources"      element={<Resources />} />
          <Route path="profile"        element={<Profile />} />
          <Route path="reports"        element={<Reports />} />
        </Route>

        {/* Board routes */}
        <Route path="/board" element={
          <ProtectedRoute roles={['BOARD']}><BoardLayout /></ProtectedRoute>
        }>
          <Route index       element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<BoardDashboard />} />
          <Route path="invoices"  element={<BoardInvoices />} />
          <Route path="users"  element={<UsersManager />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}
