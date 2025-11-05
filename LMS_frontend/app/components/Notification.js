"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, MailOpen, Mail } from "lucide-react";
import api from "../utils/api";
import { useRouter } from "next/navigation";

export default function Notification({ userRole = 'student' }) {
    const [notifications, setNotifications] = useState([]);
    const router = useRouter();
    const dropdownRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications/');
            const data = response.data;
            const list_data = Array.isArray(data) ? data : data.results || [];
            
            // Filter notifications based on user role
            if (userRole === 'lecturer') {
                // Lecturer only sees system notifications (no class_id)
                const systemNotifications = list_data.filter(n => !n.class_id);
                setNotifications(systemNotifications);
            } else {
                // Student sees all notifications (both class and system)
                setNotifications(list_data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000 * 2); // Refresh every 2 minutes
        return () => clearInterval(interval);
    }, [userRole]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const markAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read/');
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/mark-read/`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.class_id) {
            router.push(`/dashboard/class/${notification.class_id}`);
        }
        setIsDropdownOpen(false);
    };

    const getTitle = () => {
        if (userRole === 'lecturer') {
            return 'System Notifications';
        }
        return 'Notifications';
    };

    const getSubtitle = () => {
        if (userRole === 'lecturer') {
            return 'Important updates from the system';
        }
        return null;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
                <Bell className="w-5 h-5" />
                {notifications.filter((n) => !n.is_read).length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
            </button>

            {isDropdownOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-86 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-900">{getTitle()}</h3>
                                {getSubtitle() && (
                                    <p className="text-xs text-gray-600 mt-0.5">{getSubtitle()}</p>
                                )}
                            </div>
                            {notifications.filter((n) => !n.is_read).length > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="p-1.5 hover:bg-blue-100 rounded-lg transition-all"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="w-4 h-4 text-blue-600" />
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Bell className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {userRole === 'lecturer' ? 'No system notifications' : 'No notifications'}
                                    </p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`px-4 py-3 flex items-start cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-all ${
                                            notification.is_read ? 'opacity-70' : 'bg-blue-50/50'
                                        }`}
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            {notification.is_read ? (
                                                <MailOpen className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <Mail className="w-5 h-5 text-blue-500" />
                                            )}
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                {notification.class_name && userRole === 'student' && (
                                                    <p className="text-sm font-semibold text-blue-600">
                                                        {notification.class_name}
                                                    </p>
                                                )}
                                                {userRole === 'lecturer' && (
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {notification.title}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-700 ml-2 flex-shrink-0">
                                                    {new Date(notification.created_at).toLocaleString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            {userRole === 'student' && (
                                                <p className="text-sm font-medium text-gray-900 mb-1">
                                                    {notification.title}
                                                </p>
                                            )}
                                            {notification.message && (
                                                <p className="text-xs text-gray-600 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
