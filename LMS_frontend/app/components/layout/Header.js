'use client';
import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import UserDropdown from './UserDropdown';
import Notification from '../Notification';

export default function Header({ 
    user, 
    language, 
    t,
    userRole = 'lecturer',
    showNavigation = true,
    activeNav = 'dashboard'
}) {
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/');
    };
    
    const portalTitle = userRole === 'lecturer' 
        ? (t?.lecturerPortal || 'Lecturer Portal')
        : userRole === 'student'
        ? (t?.studentPortal || 'Student Portal')
        : 'Admin Portal';
    
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm backdrop-blur-lg bg-white/95">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    EduPlatform
                                </h1>
                                <p className="text-xs text-gray-500">{portalTitle}</p>
                            </div>
                        </div>
                        
                        {showNavigation && (
                            <nav className="hidden md:flex items-center space-x-1 ml-8">
                                <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                    activeNav === 'dashboard' 
                                        ? 'text-blue-600 bg-blue-50' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}>
                                    {t?.dashboard || 'Dashboard'}
                                </button>
                                <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                    activeNav === 'analytics' 
                                        ? 'text-blue-600 bg-blue-50' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}>
                                    {t?.analytics || 'Analytics'}
                                </button>
                                <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                    activeNav === 'settings' 
                                        ? 'text-blue-600 bg-blue-50' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}>
                                    {t?.settings || 'Settings'}
                                </button>
                            </nav>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <LanguageSwitcher className="hidden sm:flex" />

                        <Notification userRole={userRole} />

                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="p-1.5 hover:bg-gray-50 rounded-lg transition-all"
                            >
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-semibold text-white text-sm shadow-md hover:shadow-lg transition-shadow">
                                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </button>
                            
                            <UserDropdown
                                user={user}
                                isOpen={showDropdown}
                                onToggle={() => setShowDropdown(!showDropdown)}
                                onLogout={handleLogout}
                                t={t}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
