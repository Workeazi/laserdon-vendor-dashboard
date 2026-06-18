import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { VendorProvider } from '../context/VendorContext'
import ProtectedRoute from './ProtectedRoute'

// Lazy loaded views
const LoginPage = lazy(() => import('../views/auth/LoginPage'))
const RegisterPage = lazy(() => import('../views/auth/RegisterPage'))
const DrawingsListPage = lazy(() => import('../views/drawings/DrawingsListPage'))
const DrawingDetailPage = lazy(() => import('../views/drawings/DrawingDetailPage'))
const QuotationsPage = lazy(() => import('../views/quotations/QuotationsPage'))
const CustomersPage = lazy(() => import('../views/customers/CustomersPage'))
const ReportsPage = lazy(() => import('../views/reports/ReportsPage'))
const ChatPage = lazy(() => import('../views/chat/ChatPage'))
const ProfilePage = lazy(() => import('../views/profile/ProfilePage'))
const DashboardPage = lazy(() => import('../views/dashboard/DashboardPage'))
const NotificationsPage = lazy(() => import('../views/notifications/NotificationsPage'))
const PaymentsPage = lazy(() => import('../views/payments/PaymentsPage'))

export default function AppRoutes() {
  return (
    <VendorProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="drawings" element={<DrawingsListPage />} />
            <Route path="drawings/:id" element={<DrawingDetailPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </VendorProvider>
  )
}
