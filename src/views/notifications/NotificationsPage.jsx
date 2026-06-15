import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../controllers/notificationController';

export default function NotificationsPage() {
    const { notifications, markAsRead } = useNotifications();
    const navigate = useNavigate();

    return (
        <div className="space-y-stack_space max-w-[1500px] mx-auto">
            <div className="mb-8">
                <h3 className="font-headline-lg text-display-metrics text-on-surface tracking-tight">Notifications</h3>
                <p className="text-body-lg text-on-surface-variant mt-1 max-w-xl">View and manage your recent alerts and messages.</p>
            </div>

            <div className="bg-white rounded-xl border border-outline-variant/60 card-shadow overflow-hidden">
                {!notifications || notifications.length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant">
                        No notifications found.
                    </div>
                ) : (
                    <div className="divide-y divide-outline-variant/30">
                        {notifications.map((n) => (
                            <div 
                                key={n.id} 
                                onClick={() => n.link && navigate(n.link)}
                                className={`p-6 flex items-start gap-4 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary-fixed/30' : 'hover:bg-surface-container-low'}`}
                            >
                                <div className="p-2 rounded-full bg-primary-container/10 text-primary mt-1">
                                    <span className="material-symbols-outlined">
                                        {n.type === 'order' ? 'shopping_cart' : n.type === 'request' ? 'pending_actions' : 'notifications'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-headline-md text-on-surface text-base mb-1">{n.title}</h4>
                                    <p className="text-body-md text-on-surface-variant">{n.body}</p>
                                    <span className="text-xs text-outline/80 mt-2 block">
                                        {new Date(n.created_at).toLocaleString()}
                                    </span>
                                </div>
                                {!n.is_read && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(n.id);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary-container/20 rounded-lg transition-colors"
                                    >
                                        Mark as read
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
