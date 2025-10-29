"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck,MailOpen,Mail } from "lucide-react";
import api from "../utils/api";
import { useRouter } from "next/navigation";

export default function Notification() {
    const [notifications, setNotifications] = useState([]);
    const router = useRouter();
    const dropdownRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const fetchNotifications = async () => {
        try{
            const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/`, { withCredentials: true }); 
            const data = response.data;
            const list_data = Array.isArray(data) ? data : data.results || [];
            setNotifications(list_data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000*2);
        return () => clearInterval(interval);
    }, []);

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
            await api.post(`${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-all-read/`, {}, { withCredentials: true });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/mark-read/`, {}, { withCredentials: true });
            setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick ={() => setIsDropdownOpen(!isDropdownOpen)} 
                className="relative top-1 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
            >
                <Bell className="w-5 h-5 text-gray-700" />
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-400 rounded-full w-3 h-3 flex">
                        <span className="text-xs text-white text-center mx-auto leading-3">
                            {notifications.filter((n) => !n.is_read).length}
                        </span>
                    </span>
                )}
            </button>
            {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                    <div className="p-3 border-b border-gray-300 flex justify-between items-center">
                        <span className="font-semibold text-lg">Notifications</span>
                        {notifications.length > 0 && (
                            <button onClick={markAllRead} className="rounded-full bg-blue-200 w-6 h-6 flex items-center justify-center hover:bg-blue-300 transition-colors duration-200">
                                <CheckCheck className="w-4 h-4 inline-block" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No new notifications</div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`px-4 py-2 flex items-start cursor-pointer hover:bg-gray-50 ${
                                        n.is_read ? "opacity-70" : "bg-blue-50" }`}
                                    onClick={() => {
                                        markAsRead(n.id);
                                        router.push(`/dashboard/class/${n.class_id}`);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <div className="justify-center items-center flex mt-2">
                                        {n.is_read ? (
                                            <MailOpen className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <Mail className="w-5 h-5 text-blue-500" />
                                        )}
                                    </div>
                                    
                                    <div className="ml-3">
                                        <p className="text-sm font-bold text-black">{n.class_name}</p>
                                        <p className="text-sm text-center">{n.title}</p>
                                    </div>
                                </div>
                            )))}
                    </div>
                </div>
            )}
        </div>
    );
}
