'use client';
import { Settings, LogOut } from 'lucide-react';

export default function UserDropdown({ user, isOpen, onToggle, onLogout, t }) {
    if (!isOpen) return null;
    
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onToggle}></div>
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                    <p className="text-xs text-gray-600 mt-1">{user?.email}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold capitalize">
                        {user?.role}
                    </span>
                </div>
                <div className="p-2">
                    <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
                        <Settings className="w-4 h-4" />
                        <span>{t?.settings || 'Settings'}</span>
                    </button>
                    <button 
                        onClick={() => {
                            onToggle();
                            onLogout();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>{t?.logout || 'Logout'}</span>
                    </button>
                </div>
            </div>
        </>
    );
}
