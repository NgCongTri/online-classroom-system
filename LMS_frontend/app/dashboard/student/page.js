'use client';
import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { getClassColor, getBorderColor } from '../../utils/class_color';
import ShowDropdown from '../../components/ShowDropdown';
import { UserRound,Settings,MessageCircleQuestionMark,House,BookOpen,SquarePlus, AlertCircle, LogOut} from "lucide-react";
import Notification from '../../components/Notification';

export default function StudentDashboard() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    const [myClasses, setmyClasses] = useState([]);
    const [allClasses, setallClasses] = useState([]);
    const [activePage, setActivePage] = useState('dashboard');
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [language, setLanguage] = useState('en');
    const [message, setMessage] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsed, setCollapsed] = useState(true); 
    const [errorMessage, setErrorMessage] = useState('');
    const dropdownRef = useRef(null);

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
            AiClasses: 'AI Classes',
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
            searchPlaceholder: 'What do you want to learn?',
            allClasses: 'All Classes',
            activeClasses: 'Active Classes',
            completedClasses: 'Completed',
            progress: 'Progress',
            viewDetails: 'View Details',
            exploreMore: 'Explore More Courses',
            viewAll: 'View All',
            alreadyEnrolled: 'Enrolled',
            help : 'Help',
            settings: 'Settings',
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
            searchPlaceholder: 'Bạn muốn học gì?',
            allClasses: 'Tất Cả',
            activeClasses: 'Đang Học',
            completedClasses: 'Đã Hoàn Thành',
            progress: 'Tiến độ',
            viewDetails: 'Xem Chi Tiết',
            exploreMore: 'Khám Phá Thêm',
            viewAll: 'Xem Tất Cả',
            alreadyEnrolled: 'Đã Tham Gia',
            AiClasses: 'Các Lớp Học AI',
            help : 'Trợ Giúp',
            settings: 'Cài Đặt',
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

    useEffect(() => {
        setShowMobileSidebar(false);
    }, [activePage]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchmyClasses = async () => {
        try {
            const res = await api.get('/class-memberships/');
            console.log('Raw API response:', res.data); 
            
            const myClasses = res.data
                .filter(membership => membership.user === user.id)
                .map(membership => {
                    const classData = membership.class_data;
                    
                    if (!classData || !classData.id) {
                        console.error('Missing class data in membership:', membership);
                        return null;
                    }
                    
                    return {
                        ...classData,
                        membership_id: membership.id                        
                    };
                })
                .filter(cls => cls !== null);        
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
            setActivePage('classes');
        } catch (error) {
            setMessage('❌ '   (error.response?.data?.detail || 'Error enrolling in class'));
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
            setErrorMessage('Code invalid');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
        }
    };

    const filteredClasses = myClasses.filter(cls => 
        cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.lecturer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const searchResults = allClasses.filter(cls => 
        cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.lecturer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        enrolledClasses: myClasses.length,
        attendanceRate: 85,
        upcomingSessions: 3,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-gray-600 text-lg font-medium">{t[language].loading}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
            {/* Header / Navbar */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Toggle Button */}
                        <div className="flex items-center py-3 px-0 border-gray-400">
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="p-2 -ml-2 rounded-lg bg-gray-200 hover:bg-blue-200 transition-colors"
                                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>

                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <span className="hidden sm:block text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                EduNext
                            </span>
                        </div>

                        {/* Search Bar (Desktop) */}
                        <div className="hidden md:flex flex-1 max-w-xl mx-6">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder={t[language].searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
                                />
                                <svg className="absolute left-4 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchQuery && (
                                    <div className ="absolute w-full bg-white top-12 left-0 rounded-lg shadow-lg border border-gray-200 z-50">
                                        {searchResults.length > 0 ? (
                                            searchResults.slice(0, 5).map((cls) => (
                                                <div 
                                                    key={cls.id}
                                                    onClick={()=> router.push(`dashboard/class/${cls.id}`)}
                                                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer">
                                                    <p>{cls.name}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-gray-500">
                                                No results found
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center space-x-3">
                            {/* Language Switcher */}
                            <div className="hidden sm:flex bg-gray-200 rounded-full p-1">
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                        language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                    }`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setLanguage('vi')}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                        language === 'vi' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                    }`}
                                >
                                    VI
                                </button>
                            </div>

                            {/* Notifications */}
                            <div className="relative p-2 rounded-full hover:bg-gray-200 transition-colors">
                                <Notification />
                            </div>

                            {/* User Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded-full transition-all"
                                >
                                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center font-semibold text-white text-sm shadow-md">
                                        {user?.username?.charAt(0).toUpperCase() || 'S'}
                                    </div>
                                    <span className="hidden md:block text-sm font-medium text-gray-700">{user?.username}</span>
                                    <svg className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {showDropdown && (
                                    <div className="absolute flex flex-col right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                                        <div className="px-2 py-1 hover:bg-gray-100 hover:text-blue-700 rounded-lg ml-2 mr-2">
                                            <button
                                                onClick={() => {
                                                    setActivePage('profile');
                                                }}
                                                className="text-sm flex"
                                            >
                                                <UserRound className="w-4 h-4 mr-2" />
                                                {t[language].profile}
                                            </button>
                                        </div>
                                        <div className="px-2 py-1 hover:bg-gray-100 hover:text-blue-700 rounded-lg ml-2 mr-2">
                                            <button
                                                onClick={() => {}}
                                                className="text-sm flex"
                                            >
                                                <MessageCircleQuestionMark className="w-4 h-4 mr-2" />
                                                {t[language].help}
                                            </button>
                                        </div> 
                                        <div className="px-2 py-1 hover:bg-gray-100 hover:text-blue-700 rounded-lg ml-2 mr-2">
                                            <button
                                                onClick={() => {}}
                                                className="text-sm flex"
                                            >
                                                <Settings className="w-4 h-4 mr-2" />
                                                {t[language].settings}
                                            </button>
                                        </div> 

                                        <div className="px-2 py-1 hover:bg-gray-100 rounded-lg ml-2 mr-2">
                                            <button
                                                onClick={() => {
                                                setShowDropdown(false);
                                                logout();
                                            }}
                                                className="w-full text-sm text-red-600 flex items-center space-x-2"
                                                >
                                                <LogOut className="w-4 h-4 mr-2" />
                                                <span>{t[language].logout}</span>
                                            </button>  
                                        </div>
                                                                            
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar (collapsible) */}
                <aside className={`
                    fixed lg:static inset-y-0 left-0 z-40 bg-white/80 backdrop-blur-xl border-r border-gray-200
                    transform transition-all duration-300 ease-in-out mt-16 lg:mt-0 shadow-xl lg:shadow-none
                    ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${collapsed ? 'w-20' : 'w-48'}
                `}>
                    <div className="flex flex-col h-full">

                        {/* Navigation */}
                        <nav className="flex-1 px-3 py-6 space-y-1">
                            {[
                                {id:'dashboard', icon:<House className="w-5 h-5 flex-shrink-0" />, label:t[language].dashboard},
                                {id:'classes', icon:<BookOpen className="w-5 h-5 flex-shrink-0" />, label:t[language].myClasses},
                                {id:'join', icon:<SquarePlus className="w-5 h-5 flex-shrink-0" />, label:t[language].joinClass},
                            ].map((item) => {
                                const isActive = activePage === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActivePage(item.id)}
                                        title={collapsed ? item.label : ''}
                                        className={`
                                            w-full flex items-center rounded-xl transition-all duration-200
                                            ${collapsed ? 'justify-center px-0 py-3' : 'justify-start px-4 py-3'}
                                            ${isActive
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                                : 'text-gray-700 hover:bg-gray-100'}
                                        `}
                                    >
                                        <span className={`flex-shrink-0 ${collapsed ? '' : 'mr-3'}`}>
                                            {item.icon}
                                        </span>
                                        <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay */}
                {showMobileSidebar && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
                        onClick={() => setShowMobileSidebar(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    {/* Message Alert */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between shadow-lg ${
                            message.includes('❌') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                            <span className="text-sm font-medium">{message}</span>
                            <button onClick={() => setMessage('')} className="text-xl hover:opacity-70">&times;</button>
                        </div>
                    )}

                    {/* Dashboard Page */}
                    {activePage === 'dashboard' && (
                        <div className="space-y-8">
                            {/* Hero Section */}
                            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 lg:p-12 text-white overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
                                <div className="relative z-10">
                                    <h1 className="text-4xl lg:text-5xl font-bold mb-3">
                                        {t[language].welcome}, {user?.username}! 👋
                                    </h1>
                                    <p className="text-blue-100 text-lg mb-6 max-w-2xl">
                                        Continue your learning journey and achieve your goals with world-class courses
                                    </p>
                                    <button 
                                        onClick={() => setActivePage('join')}
                                        className="px-8 py-3 bg-white text-blue-600 rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105"
                                    >
                                        {t[language].exploreMore}
                                        <svg className="inline w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Continue Learning Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-3xl font-bold text-gray-900">{t[language].continueLearning}</h2>                               
                                </div>
                                <div className="mb-2 ">
                                    <h3 className="flex text-gray-600 text-lg"> Please select a class to continue learning</h3>
                                </div>
                                {myClasses.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-300">                                        
                                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t[language].noClasses}</h3>
                                        <p className="text-gray-600 mb-6">{t[language].startLearning}</p>
                                        <button
                                            onClick={() => setActivePage('join')}
                                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-xl transition-all font-semibold hover:scale-105"
                                        >
                                            {t[language].joinClass}
                                        </button>
                                    </div>
                                ) 
                                : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myClasses.slice(0, 4).map((cls) => {
                                            const gradientColor = getClassColor(cls.id);
                                            return (
                                                <div key={cls.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group">
                                                    <div className={`h-32 bg-gradient-to-r ${gradientColor} p-6 relative overflow-hidden`}>
                                                        <div className="absolute top-0 right-0 w-50 h-50 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                                                        <div className="relative z-10">
                                                            <h3 className="text-white text-xl font-bold line-clamp-2 mb-2">{cls.name}</h3>
                                                            <p className="text-white/90 text-sm">{cls.lecturer_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-6">
                                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description || 'No description'}</p>
                                                        <div className="mb-4">
                                                            <div className="flex justify-between text-xs text-gray-600 mb-2">
                                                                <span>{t[language].progress}</span>
                                                                <span className="font-semibold">15%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                <div 
                                                                    className={`h-2 bg-gradient-to-r ${gradientColor} rounded-full transition-all duration-500`}
                                                                    style={{width: '15%'}}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => router.push(`/dashboard/class/${cls.id}`)}
                                                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium group-hover:shadow-xl"
                                                        >
                                                            {t[language].goToClass}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>                            
                                )}
                                <div className="flex justify-start mt-6">
                                    {myClasses.length > 0 && (
                                        <button 
                                            onClick={() => setActivePage('classes')}
                                            className="text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-200 font-medium text-lg inline-flex px-2 py-1 items-center"
                                        >
                                            {t[language].viewAll}
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    )}
                                    </div>
                            </div>

                            {/* AI classes */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">{t[language].AiClasses}</h2>                                    
                                </div>
                                <div className="flex justify-start mt-6">
                                    {myClasses.length > 0 && (
                                        <button 
                                            onClick={() => setActivePage('classes')}
                                            className="text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-200 font-medium text-lg inline-flex px-2 py-1 items-center"
                                        >
                                            {t[language].viewAll}
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    )}
                                    </div>
                            </div>

                        </div>
                    )}

                    {/* My Classes Page */}
                    {activePage === 'classes' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h1 className="text-3xl font-bold text-gray-900">{t[language].myClasses}</h1>
                                <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-semibold">
                                    {filteredClasses.length} {filteredClasses.length === 1 ? 'Class' : 'Classes'}
                                </span>
                            </div>

                            {filteredClasses.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-300">
                                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{t[language].noClasses}</h3>
                                    <p className="text-gray-600 mb-6">{t[language].startLearning}</p>
                                    <button
                                        onClick={() => setActivePage('join')}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-xl transition-all font-semibold hover:scale-105"
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
                                            <div key={cls.id} className={`bg-white rounded-2xl border-2 ${borderColor} overflow-hidden hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-2`}>
                                                <div 
                                                    className={`h-30 bg-gradient-to-r ${gradientColor} p-6 relative overflow-hidden`}
                                                    onClick={() => router.push(`/dashboard/class/${cls.id}`)}
                                                >
                                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                                                    <div className="relative z-10">
                                                        <h3 className="text-white text-lg font-semibold line-clamp-2 mb-1">{cls.name}</h3>
                                                    </div>
                                                    <div >
                                                        <p className="text-sm text-gray-100 mb-3">
                                                            <span className="font-medium">{cls.lecturer_name}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="p-2">
                                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{cls.description || 'No description'}</p>
                                                    <div className="mb-4">
                                                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                                                            <span>{t[language].progress}</span>
                                                            <span className="font-semibold">65%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                            <div 
                                                                className={`h-2 bg-gradient-to-r ${gradientColor} rounded-full transition-all`} 
                                                                style={{width: '65%'}}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pt-3 border-t border-gray-100">
                                                        <span>{cls.start_date}</span>
                                                        <span>-</span>
                                                        <span>{cls.end_date}</span>
                                                    </div>

                                                    <button
                                                        onClick={() => router.push(`/dashboard/class/${cls.id}`)}
                                                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm group-hover:shadow-xl"
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
                        <div className="w-full mx-auto space-y-8">

                            {/* Join with Code */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    Join with Class Code
                                </h2>
                                <form onSubmit={handleJoinWithCode} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        placeholder="Enter class code (e.g., ABC123)"
                                        className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg"
                                    />
                                    <button
                                        type="submit"
                                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-semibold hover:scale-105"
                                    >
                                        {t[language].join}
                                    </button>
                                </form>
                                {errorMessage && (
                                    <div className="mt-4 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm font-medium flex items-center">
                                        <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}
                            </div>

                            {/* Available Classes */}
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t[language].allClasses}</h2>
                                {allClasses.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-600 text-lg">No available classes at the moment</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {allClasses.map((cls) => {
                                            const gradientColor = getClassColor(cls.id);
                                            const borderColor = getBorderColor(gradientColor);
                                            const isEnrolled = myClasses.some(c => c.id === cls.id);
                                            
                                            return (
                                                <div key={cls.id} className={`bg-white rounded-2xl border-2 ${borderColor} overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1`}>
                                                    <div className={`h-32 bg-gradient-to-r ${gradientColor} p-6 relative overflow-hidden`}>
                                                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                                                        <div className="relative z-10">
                                                            <h3 className="text-white text-lg font-semibold mb-2 line-clamp-2">{cls.name}</h3>
                                                            <p className="text-white/90 text-sm">{t[language].lecturer}: {cls.lecturer_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-6">
                                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description || 'No description'}</p>
                                                        
                                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                                                            <span>{cls.start_date}</span>
                                                            <span>-</span>
                                                            <span>{cls.end_date}</span>
                                                        </div>

                                                        <div className="mb-4">
                                                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
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

                                                        {!isEnrolled && (
                                                            cls.is_open_enrollment ? (
                                                                <button
                                                                    onClick={() => handleJoinOpenClass(cls.id)}
                                                                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-sm"
                                                                >
                                                                    {t[language].enrollMe}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedClass(cls);
                                                                        setShowCodeModal(true);
                                                                    }}
                                                                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-sm"
                                                                >
                                                                    {t[language].enterCode}
                                                                </button>
                                                            )
                                                        )}

                                                        {isEnrolled && (
                                                            <button
                                                                onClick={() => router.push(`/dashboard/class/${cls.id}`)}
                                                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-sm"
                                                            >
                                                                {t[language].goToClass}
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

                    {/* Profile Page */}
                    {activePage === 'profile' && (
                        <div className="w-full mx-auto space-y-2">
                            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                                <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-gray-200">
                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-900 mb-1">{user?.username}</h2>
                                        <p className="text-gray-600 text-lg mb-2">{user?.email}</p>
                                        <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-semibold">
                                            Student
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Learning Stats</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                                            <p className="text-sm text-gray-600 mb-2">Total Classes</p>
                                            <p className="text-4xl font-bold text-gray-900">{myClasses.length}</p>
                                        </div>
                                        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                                            <p className="text-sm text-gray-600 mb-2">Attendance Rate</p>
                                            <p className="text-4xl font-bold text-gray-900">{stats.attendanceRate}%</p>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl transform transition-all">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedClass.name}</h2>
                        <p className="text-sm text-gray-600 mb-8">{t[language].enterClassCode}</p>

                        <form onSubmit={handleJoinWithCode} className="space-y-6">
                            <input
                                type="text"
                                className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg"
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
                                    className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-all font-medium border-2 border-gray-300"
                                >
                                    {t[language].cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-semibold hover:scale-105"
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