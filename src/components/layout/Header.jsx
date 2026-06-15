import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendor } from '../../context/VendorContext'
import { useNotifications } from '../../controllers/notificationController'

export default function Header({ onMenuClick }) {
  const { vendorProfile } = useVendor()
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()

  const [localAvatar, setLocalAvatar] = useState(() => vendorProfile?.id ? localStorage.getItem(`vendor_profile_image_${vendorProfile.id}`) : null)

  React.useEffect(() => {
    const handleUpdate = () => {
      if (vendorProfile?.id) {
        setLocalAvatar(localStorage.getItem(`vendor_profile_image_${vendorProfile.id}`))
      }
    }
    window.addEventListener('profileImageUpdated', handleUpdate)
    handleUpdate()
    return () => window.removeEventListener('profileImageUpdated', handleUpdate)
  }, [vendorProfile?.id])

  // Default avatar if none provided
  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e2e8f0'/%3E%3Ctext x='50' y='50' font-family='sans-serif' font-size='40' fill='%23475569' text-anchor='middle' dy='.3em'%3EV%3C/text%3E%3C/svg%3E"
  const avatarUrl = localAvatar || vendorProfile?.companies?.company_profile_image || vendorProfile?.company_profile_image || defaultAvatar

  return (
    <header className="h-20 flex justify-between items-center px-4 lg:px-container_padding bg-white border-b border-outline-variant/60 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <button className="lg:hidden p-2 hover:bg-surface-container-low rounded-full flex items-center justify-center mr-2" onClick={onMenuClick}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="text-on-surface-variant text-body-md hidden sm:inline">Portal</span>
        <span className="material-symbols-outlined text-outline-variant hidden sm:inline">chevron_right</span>
        <h2 className="font-headline-lg text-headline-lg text-on-surface truncate max-w-[200px] sm:max-w-none">Dashboard</h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-8">
        {/* Global Search or Utilities */}
        <div className="flex items-center gap-2 sm:gap-4 text-on-surface-variant">
          <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">search</span>
          </button>
          
          {/* Notifications Toggle */}
          <div className="relative">
            <button 
              className="p-2 hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center relative"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-error rounded-full border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-outline-variant/60 overflow-hidden z-20">
                <div className="p-3 border-b bg-surface-container-lowest text-sm font-semibold text-on-surface">Notifications</div>
                <div className="max-h-64 overflow-y-auto">
                  {!notifications || notifications.filter(n => !n.is_read).length === 0 ? (
                    <div className="p-4 text-center text-sm text-on-surface-variant">No new notifications</div>
                  ) : (
                    notifications.filter(n => !n.is_read).slice(0, 5).map(n => (
                      <div 
                        key={n.id} 
                        className={`p-3 border-b border-outline-variant/30 text-sm cursor-pointer hover:bg-surface-container-low transition-colors bg-primary-fixed/30`}
                        onClick={() => {
                          if (!n.is_read) markAsRead(n.id);
                          setShowDropdown(false);
                          if (n.link) navigate(n.link);
                        }}
                      >
                        <div className="font-semibold text-on-surface">{n.title}</div>
                        <div className="text-on-surface-variant text-xs mt-1">{n.body}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-4 pl-4 sm:pl-8 border-l border-outline-variant">
          <div className="text-right hidden lg:block">
            <p className="text-body-md font-semibold text-on-surface">{vendorProfile?.companies?.short_name || vendorProfile?.username || 'Loading...'}</p>
            <p className="text-label-caps text-on-surface-variant opacity-70">
              {vendorProfile?.city ? `Vendor • ${vendorProfile.city}` : 'Vendor'}
            </p>
          </div>
          <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
            <img 
              alt="Vendor Profile" 
              className="w-10 h-10 rounded-full border border-outline-variant ring-2 ring-transparent group-hover:ring-primary/20 transition-all object-cover" 
              src={avatarUrl} 
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary border-2 border-white rounded-full"></span>
          </div>
        </div>
      </div>
    </header>
  )
}
