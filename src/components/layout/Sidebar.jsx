import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../controllers/authController'
import { useNotifications } from '../../controllers/notificationController'

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/drawings', label: 'Requests', icon: 'pending_actions', badge: unreadCount },
    { to: '/quotations', label: 'Quotations', icon: 'request_quote' },
    { to: '/customers', label: 'Customers', icon: 'group' },
    { to: '/payments', label: 'Payments', icon: 'account_balance_wallet' },
    { to: '/reports', label: 'Reports', icon: 'analytics' },
    { to: '/notifications', label: 'Notifications', icon: 'notifications' },
  ]

  return (
    <aside className={`w-[260px] h-screen fixed left-0 top-0 bg-inverse-surface border-r border-white/5 flex flex-col py-8 z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      {/* Brand Identity */}
      <div className="px-8 mb-12">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-6 bg-primary-fixed-dim rounded-full"></div>
          <h1 className="text-headline-lg font-display-metrics font-bold text-white tracking-tight">LaserDon</h1>
        </div>
        <p className="text-label-caps font-label-caps text-surface-variant/40 tracking-[0.2em] mt-1 text-[10px]">VENDOR PORTAL</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 px-4 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `px-4 py-3 flex items-center gap-4 transition-all rounded-r-lg group ${
                isActive
                  ? 'sidebar-active text-white'
                  : 'text-surface-variant/50 hover:text-white hover:bg-white/5 hover:pl-5'
              }`
            }
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
              {item.icon}
            </span>
            <span className="font-medium text-body-md flex-1">{item.label}</span>
              {item.badge > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Links */}
      <div className="mt-auto px-4 pt-4 border-t border-white/5">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            `px-4 py-3 flex items-center gap-4 transition-all rounded-r-lg ${
              isActive
                ? 'sidebar-active text-white'
                : 'text-surface-variant/50 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-medium text-body-md">Settings</span>
        </NavLink>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full text-surface-variant/50 px-4 py-3 flex items-center gap-4 hover:text-error hover:bg-error/5 transition-all rounded-r-lg"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium text-body-md">Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-outline-variant/60 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-error">logout</span>
                Confirm Logout
              </h3>
              <p className="text-on-surface-variant text-sm">Are you sure you want to log out of your account?</p>
            </div>
            <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-white border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-error/90 transition-colors shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
