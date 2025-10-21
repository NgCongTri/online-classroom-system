'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { getClassColor, getBorderColor } from '../../utils/class_color';

export default function StudentDashboard() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    
    const [myClasses, setmyClasses] = useState([]);
    const [allClasses, setallClasses] = useState([]);
    const [activePage, setActivePage] = useState('dashboard'); // dashboard, classes, join, profile
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [language, setLanguage] = useState('en');
    const [message, setMessage] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Translations
    const t = {
        en: {
            welcome: 'Welcome back',
            dashboard: 'Dashboard',
            myClasses: 'My Classes',
            joinClass: 'Join Class',
            attendance: 'Attendance',
            profile: 'Profile',
            announcements: 'Announcements',
            enrolledClasses: 'Enrolled Classes',
            attendanceRate: 'Attendance Rate',
            upcomingSessions: 'Upcoming Sessions',
            continueLearning: 'Continue Learning',
            goToClass: 'Go to Class',
            noClasses: 'No classes yet',
            startLearning: 'Start learning by joining a class',
            enrollMe: 'Enroll Now',
            enterCode: 'Enter Code',
            enterClassCode: 'Enter class code to join',
            join: 'Join',
            cancel: 'Cancel',
            logout: 'Logout',
            loading: 'Loading...',
            lecturer: 'Lecturer',
            openEnrollment: 'Open Enrollment',
            codeRequired: 'Code Required',
            searchPlaceholder: 'Search classes...',
            allClasses: 'All Classes',
            activeClasses: 'Active Classes',
            completedClasses: 'Completed',
            progress: 'Progress',
            viewDetails: 'View Details',
        },
        vi: {
            welcome: 'Chào mừng trở lại',
            dashboard: 'Tổng Quan',
            myClasses: 'Lớp Của Tôi',
            joinClass: 'Tham Gia Lớp',
            attendance: 'Điểm Danh',
            profile: 'Hồ Sơ',
            announcements: 'Thông Báo',
            enrolledClasses: 'Lớp Đã Tham Gia',
            attendanceRate: 'Tỷ Lệ Điểm Danh',
            upcomingSessions: 'Buổi Học Sắp Tới',
            continueLearning: 'Tiếp Tục Học',
            goToClass: 'Vào Lớp',
            noClasses: 'Chưa có lớp nào',
            startLearning: 'Bắt đầu học bằng cách tham gia lớp',
            enrollMe: 'Ghi Danh',
            enterCode: 'Nhập Mã',
            enterClassCode: 'Nhập mã lớp để tham gia',
            join: 'Tham Gia',
            cancel: 'Hủy',
            logout: 'Đăng Xuất',
            loading: 'Đang tải...',
            lecturer: 'Giảng viên',
            openEnrollment: 'Mở Tự Do',
            codeRequired: 'Yêu Cầu Mã',
            searchPlaceholder: 'Tìm kiếm lớp học...',
            allClasses: 'Tất Cả',
            activeClasses: 'Đang Học',
            completedClasses: 'Đã Hoàn Thành',
            progress: 'Tiến Độ',
            viewDetails: 'Xem Chi Tiết',
        }
    };

    useEffect(() => {
        if (!loading && user?.role !== 'student') {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user?.role === 'student') {
            fetchmyClasses();
            fetchallClasses();
        }
    }, [user]);

    // Close mobile sidebar when page changes
    useEffect(() => {
        setShowMobileSidebar(false);
    }, [activePage]);

    const fetchmyClasses = async () => {
        try {
            const res = await api.get('/class-memberships/');
            console.log('Raw API response:', res.data); 
            
            const myClasses = res.data
                .filter(membership => membership.user === user.id)
                .map(membership => {
                    // Handle different possible property names
                    const classData = membership.class_data ;
                    
                    if (!classData || !classData.id) {
                        console.error('Missing class data in membership:', membership);
                        return null;
                    }
                    
                    return {
                        ...classData,
                        membership_id: membership.id                        
                    };
                })
                .filter(cls => cls !== null );        
            console.log('Processed classes:', myClasses);
            setmyClasses(myClasses);
        } catch (error) {
            console.error('Error fetching enrolled classes:', error);
        }
    };

    const fetchallClasses = async () => {
        try {
            const res = await api.get('/classes/available/');
            console.log('Available classes response:', res.data); 
            // Ensure all classes have valid IDs
            const validClasses = res.data.filter(cls => cls.id !== undefined);
            setallClasses(validClasses);
        } catch (error) {
            console.error('Error fetching available classes:', error);
        }
    };

    const handleJoinOpenClass = async (classId) => {
        try {
            await api.post(`/classes/${classId}/join/`);
            setMessage('✅ Successfully enrolled in class!');
            await fetchmyClasses();
            await fetchallClasses();
            setActiveTab('enrolled'); // Switch to enrolled tab
        } catch (error) {
            setMessage('❌ ' + (error.response?.data?.detail || 'Error enrolling in class'));
        }
    };

    const handleJoinWithCode = async (e) => {
        e.preventDefault();
        try {
            await api.post('/classes/join-with-code/', {
                class_code: joinCode
            });
            setMessage('✅ Successfully joined class!');
            setShowCodeModal(false);
            setSelectedClass(null);
            setJoinCode('');
            await fetchmyClasses();
            await fetchallClasses();
            setActivePage('classes'); 
        } catch (error) {
            setMessage('❌ ' + (error.response?.data?.detail || 'Error joining class'));
        }
    };

    // Filter classes based on search
    const filteredClasses = myClasses.filter(cls => 
        cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.lecturer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats calculation
    const stats = {
        enrolledClasses: myClasses.length,
        attendanceRate: 85, // TODO: Calculate from real data
        upcomingSessions: 3, // TODO: Calculate from real data
    };

    const ClassCard = ({ cls, index, isEnrolled }) => {
        const gradientColor = getClassColor(cls.id);
        const borderColor = getBorderColor(gradientColor);
        
        return (
            <div className={`bg-white rounded-xl border-2 ${borderColor} overflow-hidden hover:shadow-xl transition-all ${isEnrolled ? 'cursor-pointer hover:-translate-y-1' : ''}`}>
                {/* Class Cover */}
                <div 
                    className={`h-24 bg-gradient-to-r ${gradientColor} p-4 relative ${isEnrolled ? 'cursor-pointer' : ''}`}
                    onClick={() => isEnrolled && router.push(`/dashboard/class/${cls.id}`)}
                >
                    <h3 className="text-white text-lg font-semibold truncate mb-1">{cls.name}</h3>
                    <p className="text-white/90 text-xs truncate">
                        {t[language].lecturer}: {cls.lecturer_name || 'Unknown'}
                    </p>
                </div>

                {/* Class Info */}
                <div className="p-4">
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {cls.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3 mb-3">
                        <span className="truncate">{cls.start_date}</span>
                        <span className="mx-1">-</span>
                        <span className="truncate">{cls.end_date}</span>
                    </div>

                    {/* Action Buttons */}
                    {!isEnrolled && (
                        <div className="mt-3">
                            {cls.is_open_enrollment ? (
                                <button
                                    onClick={() => handleJoinOpenClass(cls.id)}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm"
                                >
                                    {t[language].enrollMe}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setSelectedClass(cls);
                                        setShowCodeModal(true);
                                    }}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                                >
                                    {t[language].enterCode}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Enrollment Status Badge */}
                    <div className="mt-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isEnrolled
                                ? 'bg-purple-100 text-purple-700'
                                : cls.is_open_enrollment
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                        }`}>
                            {isEnrolled 
                                ? t[language].alreadyEnrolled 
                                : cls.is_open_enrollment 
                                    ? t[language].openEnrollment 
                                    : t[language].codeRequired
                            }
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-gray-600 text-lg">{t[language].loading}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Navbar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <span className="hidden sm:block text-xl font-bold text-gray-900">OCS</span>
                        </div>

                        {/* Search Bar (Desktop) */}
                        <div className="hidden md:flex flex-1 max-w-lg mx-8">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder={t[language].searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center space-x-3">
                            {/* Language Switcher */}
                            <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                        language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                    }`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setLanguage('vi')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                        language === 'vi' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                    }`}
                                >
                                    VI
                                </button>
                            </div>

                            {/* User Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-all"
                                >
                                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center font-semibold text-white text-sm">
                                        {user?.username?.charAt(0).toUpperCase() || 'S'}
                                    </div>
                                    <span className="hidden md:block text-sm font-medium text-gray-700">{user?.username}</span>
                                    <svg className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                                            <p className="text-xs text-gray-500 mt-1">Student</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false);
                                                logout();
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span>{t[language].logout}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className={`
                    fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 
                    transform transition-transform duration-300 ease-in-out mt-16 lg:mt-0
                    ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <nav className="px-4 py-6 space-y-1">
                        {[
                            { id: 'dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: t[language].dashboard },
                            { id: 'classes', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: t[language].myClasses },
                            { id: 'join', icon: 'M12 4v16m8-8H4', label: t[language].joinClass },
                            { id: 'attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: t[language].attendance },
                            { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: t[language].profile },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                                    activePage === item.id
                                        ? 'bg-blue-50 text-blue-600 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                <span className="text-sm">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Mobile Sidebar Overlay */}
                {showMobileSidebar && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setShowMobileSidebar(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    {/* Message Alert */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
                            message.includes('❌') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                            <span className="text-sm font-medium">{message}</span>
                            <button onClick={() => setMessage('')} className="text-xl hover:opacity-70">&times;</button>
                        </div>
                    )}

                    {/* Dashboard Page */}
                    {activePage === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Welcome Section */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
                                <h1 className="text-3xl font-bold mb-2">{t[language].welcome}, {user?.username} 👋</h1>
                                <p className="text-blue-100">Ready to continue your learning journey?</p>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <span className="text-3xl font-bold text-gray-900">{stats.enrolledClasses}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">{t[language].enrolledClasses}</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-3xl font-bold text-gray-900">{stats.attendanceRate}%</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">{t[language].attendanceRate}</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-3xl font-bold text-gray-900">{stats.upcomingSessions}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">{t[language].upcomingSessions}</p>
                                </div>
                            </div>

                            {/* Continue Learning Section */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">{t[language].continueLearning}</h2>
                                {myClasses.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t[language].noClasses}</h3>
                                        <p className="text-gray-600 mb-4">{t[language].startLearning}</p>
                                        <button
                                            onClick={() => setActivePage('join')}
                                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                                        >
                                            {t[language].joinClass}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myClasses.slice(0, 3).map((cls) => {
                                            const gradientColor = getClassColor(cls.id);
                                            return (
                                                <div key={cls.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                                                    <div className={`h-32 bg-gradient-to-r ${gradientColor} p-6`}>
                                                        <h3 className="text-white text-lg font-bold mb-2 line-clamp-2">{cls.name}</h3>
                                                    </div>
                                                    <div className="p-6">
                                                        <p className="text-sm text-gray-600 mb-4">{t[language].lecturer}: {cls.lecturer_name}</p>
                                                        <div className="mb-4">
                                                            <div className="flex justify-between text-xs text-gray-600 mb-2">
                                                                <span>{t[language].progress}</span>
                                                                <span>65%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div className="bg-blue-600 h-2 rounded-full" style={{width: '65%'}}></div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => router.push(`/dashboard/class/${cls.id}`)}
                                                            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                                                        >
                                                            {t[language].goToClass}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* My Classes Page */}
                    {activePage === 'classes' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold text-gray-900">{t[language].myClasses}</h1>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                    {filteredClasses.length} {filteredClasses.length === 1 ? 'Class' : 'Classes'}
                                </span>
                            </div>

                            {filteredClasses.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t[language].noClasses}</h3>
                                    <p className="text-gray-600 mb-4">{t[language].startLearning}</p>
                                    <button
                                        onClick={() => setActivePage('join')}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                                    >
                                        {t[language].joinClass}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredClasses.map((cls) => {
                                        const gradientColor = getClassColor(cls.id);
                                        const borderColor = getBorderColor(gradientColor);
                                        return (
                                            <div key={cls.id} className={`bg-white rounded-xl border-2 ${borderColor} overflow-hidden hover:shadow-xl transition-all cursor-pointer group`}>
                                                <div 
                                                    className={`h-24 bg-gradient-to-r ${gradientColor} p-4`}
                                                    onClick={() => router.push(`/dashboard/class/${cls.id}`)}
                                                >
                                                    <h3 className="text-white text-lg font-semibold line-clamp-2 mb-1">{cls.name}</h3>
                                                </div>
                                                <div className="p-5">
                                                    <p className="text-sm text-gray-600 mb-3">{t[language].lecturer}: <span className="font-medium">{cls.lecturer_name}</span></p>
                                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{cls.description || 'No description'}</p>
                                                    
                                                    <div className="mb-4">
                                                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                                                            <span>{t[language].progress}</span>
                                                            <span className="font-medium">65%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{width: '65%'}}></div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pt-3 border-t border-gray-100">
                                                        <span>{cls.start_date}</span>
                                                        <span>-</span>
                                                        <span>{cls.end_date}</span>
                                                    </div>

                                                    <button
                                                        onClick={() => router.push(`/dashboard/class/${cls.id}`)}
                                                        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm group-hover:shadow-md"
                                                    >
                                                        {t[language].viewDetails}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Join Class Page */}
                    {activePage === 'join' && (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t[language].joinClass}</h1>
                                <p className="text-gray-600">Enter a class code or browse available classes</p>
                            </div>

                            {/* Join with Code */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Join with Class Code</h2>
                                <form onSubmit={handleJoinWithCode} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        placeholder="Enter class code (e.g., ABC123)"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                                    >
                                        {t[language].join}
                                    </button>
                                </form>
                            </div>

                            {/* Available Classes */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t[language].allClasses}</h2>
                                {allClasses.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                                        <p className="text-gray-600">No available classes at the moment</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {allClasses.map((cls) => {
                                            const gradientColor = getClassColor(cls.id);
                                            const borderColor = getBorderColor(gradientColor);
                                            return (
                                                <div key={cls.id} className={`bg-white rounded-xl border-2 ${borderColor} overflow-hidden hover:shadow-lg transition-all`}>
                                                    <div className={`h-24 bg-gradient-to-r ${gradientColor} p-4`}>
                                                        <h3 className="text-white text-lg font-semibold mb-1">{cls.name}</h3>
                                                        <p className="text-white/90 text-xs">{t[language].lecturer}: {cls.lecturer_name}</p>
                                                    </div>
                                                    <div className="p-5">
                                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description || 'No description'}</p>
                                                        
                                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                                                            <span>{cls.start_date}</span>
                                                            <span>-</span>
                                                            <span>{cls.end_date}</span>
                                                        </div>

                                                        <div className="mb-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                cls.is_open_enrollment ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {cls.is_open_enrollment ? t[language].openEnrollment : t[language].codeRequired}
                                                            </span>
                                                        </div>

                                                        {cls.is_open_enrollment ? (
                                                            <button
                                                                onClick={() => handleJoinOpenClass(cls.id)}
                                                                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm"
                                                            >
                                                                {t[language].enrollMe}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedClass(cls);
                                                                    setShowCodeModal(true);
                                                                }}
                                                                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                                                            >
                                                                {t[language].enterCode}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attendance Page */}
                    {activePage === 'attendance' && (
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold text-gray-900">{t[language].attendance}</h1>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <p className="text-gray-600">Attendance tracking coming soon...</p>
                            </div>
                        </div>
                    )}

                    {/* Profile Page */}
                    {activePage === 'profile' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <h1 className="text-2xl font-bold text-gray-900">{t[language].profile}</h1>
                            <div className="bg-white rounded-xl border border-gray-200 p-8">
                                <div className="flex items-center space-x-6 mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{user?.username}</h2>
                                        <p className="text-gray-600">{user?.email}</p>
                                        <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                            Student
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Stats</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                                            <p className="text-2xl font-bold text-gray-900">{myClasses.length}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                                            <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Join with Code Modal */}
            {showCodeModal && selectedClass && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{selectedClass.name}</h2>
                        <p className="text-sm text-gray-600 mb-6">{t[language].enterClassCode}</p>

                        <form onSubmit={handleJoinWithCode} className="space-y-5">
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="ABC123"
                                required
                            />

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCodeModal(false);
                                        setSelectedClass(null);
                                        setJoinCode('');
                                    }}
                                    className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all font-medium border border-gray-300"
                                >
                                    {t[language].cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm font-medium"
                                >
                                    {t[language].join}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
