'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [showDropdown, setShowDropdown] = useState(false);
    const [language, setLanguage] = useState('en'); 
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalClasses: 0,
        totalSessions: 0,
        totalMaterials: 0,
        totalStudents: 0,
        totalLecturers: 0
    });
    
    // Data states
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [classAnnouncements, setClassAnnouncements] = useState([]);
    const [systemAnnouncements, setSystemAnnouncements] = useState([]);
    
    // Form states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [createType, setCreateType] = useState('');
    const [formData, setFormData] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [announcementType, setAnnouncementType] = useState('class');
    const [dataFetched, setDataFetched] = useState(false);
    // Translations
    const t = {
        en: {
            dashboard: 'Admin Dashboard',
            welcome: 'Welcome back',
            overview: 'Overview',
            users: 'Users',
            classes: 'Classes',
            sessions: 'Sessions',
            materials: 'Materials',
            announcements: 'Announcements',
            profileSettings: 'Profile Settings',
            logout: 'Logout',
            totalUsers: 'Total Users',
            totalClasses: 'Total Classes',
            totalSessions: 'Total Sessions',
            students: 'Students',
            lecturers: 'Lecturers',
            admins: 'Admins',
            recentClasses: 'Recent Classes',
            manageUsers: 'Manage Users',
            createUser: 'Create User',
            manageClasses: 'Manage Classes',
            createClass: 'Create Class',
            manageSessions: 'Manage Sessions',
            createSession: 'Create Session',
            manageMaterials: 'Manage Materials',
            manageAnnouncements: 'Manage Announcements',
            classAnnouncements: 'Class Announcements',
            systemAnnouncements: 'System Announcements',
            create: 'Create',
            edit: 'Edit',
            delete: 'Delete',
            cancel: 'Cancel',
            update: 'Update',
            index: '#',
            name: 'Name',
            classname: 'Class Name',
            email: 'Email',
            role: 'Role',
            actions: 'Actions',
            description: 'Description',
            code: 'Code',
            dates: 'Dates',
            topic: 'Topic',
            classId: 'Class',
            date: 'Date',
            title: 'Title',
            content: 'Content',
            uploadedBy: 'Uploaded By',
            postedBy: 'Posted By',
            download: 'Download',
        },
        vi: {
            dashboard: 'Bảng Điều Khiển Admin',
            welcome: 'Chào mừng trở lại',
            overview: 'Tổng Quan',
            users: 'Người Dùng',
            classes: 'Lớp Học',
            sessions: 'Buổi Học',
            materials: 'Tài Liệu',
            announcements: 'Thông Báo',
            profileSettings: 'Cài Đặt Hồ Sơ',
            logout: 'Đăng Xuất',
            totalUsers: 'Tổng Người Dùng',
            totalClasses: 'Tổng Lớp Học',
            totalSessions: 'Tổng Buổi Học',
            students: 'Học Sinh',
            lecturers: 'Giảng Viên',
            admins: 'Quản Trị Viên',
            recentClasses: 'Lớp Học Gần Đây',
            manageUsers: 'Quản Lý Người Dùng',
            createUser: 'Tạo Người Dùng',
            manageClasses: 'Quản Lý Lớp Học',
            createClass: 'Tạo Lớp Học',
            manageSessions: 'Quản Lý Buổi Học',
            createSession: 'Tạo Buổi Học',
            manageMaterials: 'Quản Lý Tài Liệu',
            manageAnnouncements: 'Quản Lý Thông Báo',
            classAnnouncements: 'Thông Báo Lớp Học',
            systemAnnouncements: 'Thông Báo Hệ Thống',
            create: 'Tạo',
            edit: 'Sửa',
            delete: 'Xóa',
            cancel: 'Hủy',
            update: 'Cập Nhật',
            index: 'STT',
            name: 'Tên',
            classname: 'Tên Lớp',
            email: 'Email',
            role: 'Vai Trò',
            actions: 'Hành Động',
            description: 'Mô Tả',
            code: 'Mã',
            dates: 'Thời Gian',
            topic: 'Chủ Đề',
            classId: 'Lớp',
            date: 'Ngày',
            title: 'Tiêu Đề',
            content: 'Nội Dung',
            uploadedBy: 'Người Tải Lên',
            postedBy: 'Người Đăng',
            download: 'Tải Xuống',
        }
    };

    useEffect(() => {
        if (!loading) {
            if (!user) {
                console.log('No user found, redirecting to login');
                router.push('/');
                return;
            }
            
            if (user.role !== 'admin') {

                console.log('User is not admin:', user.role);
                alert(`Access denied. Your role is: ${user.role}. Admin access required.`);
                router.push('/');
                return;
            }
            
            console.log('Admin user verified:', user);
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && user.role === 'admin' && !dataFetched) {
            fetchDashboardData();
            setDataFetched(true);
        }
    }, [user, dataFetched]);

    // Thêm useEffect để fetch users khi chuyển tab
    useEffect(() => {
        if (activeTab === 'users' && users.length === 0) {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchDashboardData = async () => {
        try {
            const [classesRes, sessionsRes, materialsRes] = await Promise.all([
                api.get('/classes/'),
                api.get('/sessions/'),
                api.get('/materials/'),
            ]);

            setClasses(classesRes.data);
            setSessions(sessionsRes.data);
            setMaterials(materialsRes.data);

            setStats(prev => ({
                ...prev,
                totalClasses: classesRes.data.length,
                totalSessions: sessionsRes.data.length,
                totalMaterials: materialsRes.data.length
            }));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
            const students = response.data.filter(u => u.role === 'student');
            const lecturers = response.data.filter(u => u.role === 'lecturer');
            
            setStats(prev => ({
                ...prev,
                totalUsers: response.data.length,
                totalStudents: students.length,
                totalLecturers: lecturers.length
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        
        // Validation cho user creation
        if (createType === 'user' && !isEditing) {
            // Validate username
            if (!formData.username || formData.username.trim().length < 3) {
                setMessage('Username must be at least 3 characters long');
                return;
            }
            
            if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
                setMessage('Username can only contain letters, numbers, and underscores');
                return;
            }
            
            // Validate email
            if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                setMessage('Please enter a valid email address');
                return;
            }
            
            // Validate password
            if (!formData.password || formData.password.length < 8) {
                setMessage('Password must be at least 8 characters long');
                return;
            }
            
            // Validate password confirmation
            if (formData.password !== formData.password_confirm) {
                setMessage('Passwords do not match');
                return;
            }
        }
        
        try {
            let endpoint = '';
            let payload = { ...formData };
            
            switch (createType) {
                case 'class':
                    endpoint = '/classes/';
                    break;
                case 'session':
                    endpoint = '/sessions/';
                    break;
                case 'class-announcement':
                    endpoint = '/announcements/';
                    break;
                case 'system-announcement':
                    endpoint = '/announcements/';
                    delete payload.class_id;
                    break;
                case 'user':
                    // Use admin-specific endpoint for creating users
                    endpoint = '/admin/users/create/';
                    payload = {
                        username: formData.username.trim(),
                        email: formData.email.trim().toLowerCase(),
                        password: formData.password,
                        password_confirm: formData.password_confirm,
                        role: formData.role
                    };
                    break;
            }

            if (isEditing && createType !== 'user') {
                await api.put(`${endpoint}${selectedItem.id}/`, payload);
                setMessage(`${createType.replace('-', ' ')} updated successfully!`);
            } else {
                const response = await api.post(endpoint, payload);
                setMessage(`${createType.replace('-', ' ')} created successfully!`);
                
                // Log success for debugging
                console.log('Created successfully:', response.data);
            }
            
            setShowCreateModal(false);
            setFormData({});
            setIsEditing(false);
            setSelectedItem(null);
            
            // Refresh data
            if (createType === 'user') {
                await fetchUsers();
            } else {
                await fetchDashboardData();
            }
            
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error creating/updating:', error);
            
            // Handle specific error messages from backend
            let errorMsg = 'An error occurred';
            
            if (error.response?.data) {
                const data = error.response.data;
                
                // Handle validation errors from register endpoint
                if (data.details) {
                    const errors = [];
                    for (const [field, messages] of Object.entries(data.details)) {
                        if (Array.isArray(messages)) {
                            errors.push(`${field}: ${messages.join(', ')}`);
                        } else {
                            errors.push(`${field}: ${messages}`);
                        }
                    }
                    errorMsg = errors.join('; ');
                } else if (data.message) {
                    errorMsg = data.message;
                } else if (data.error) {
                    errorMsg = data.error;
                } else if (data.detail) {
                    errorMsg = data.detail;
                }
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            setMessage(`Error: ${errorMsg}`);
            
            // Keep modal open so user can fix the error
        }
    };

    const handleEdit = (item, type) => {
        setSelectedItem(item);
        setCreateType(type);
        setIsEditing(true);
        setFormData(item);
        setShowCreateModal(true);
    };

    const handleDelete = (item, type) => {
        setSelectedItem(item);
        setCreateType(type);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            let endpoint = '';
            switch (createType) {
                case 'class':
                    endpoint = '/classes/';
                    break;
                case 'session':
                    endpoint = '/sessions/';
                    break;
                case 'class-announcement':
                case 'system-announcement':
                    endpoint = '/announcements/';
                    break;
                case 'material':
                    endpoint = '/materials/';
                    break;
                case 'user':
                    endpoint = '/users/';
                    break;
            }

            await api.delete(`${endpoint}${selectedItem.id}/`);
            setMessage(`${createType.replace('-', ' ')} deleted successfully!`);
            setShowDeleteModal(false);
            setSelectedItem(null);
            fetchDashboardData();
            if (createType === 'user') fetchUsers();
            setTimeout(() => setMessage(''), 2000);
        } catch (error) {
            setMessage(error.response?.data?.detail || `Error deleting ${createType.replace('-', ' ')}`);
        }
    };

    const resetModal = () => {
        setShowCreateModal(false);
        setFormData({});
        setIsEditing(false);
        setSelectedItem(null);
        setCreateType('');
        // Clear any error messages
        if (message.includes('Error')) {
            setMessage('');
        }
    };

    const getClassStudentCount = (classId) => {
        return 1;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff88] mx-auto mb-4"></div>
                    <div className="text-white text-xl">Loading...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">Not authenticated</div>
                    <button 
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-[#00ff88] text-[#0a0a0f] rounded-lg"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">Access Denied</div>
                    <p className="text-gray-400 mb-4">You need admin privileges to access this page.</p>
                    <p className="text-gray-400 mb-4">Your current role: <span className="text-[#00ff88]">{user.role}</span></p>
                    <button 
                        onClick={() => {
                            if (user.role === 'lecturer') {
                                router.push('/dashboard/lecturer');
                            } else if (user.role === 'student') {
                                router.push('/dashboard/student');
                            } else {
                                router.push('/');
                            }
                        }}
                        className="px-4 py-2 bg-[#00ff88] text-[#0a0a0f] rounded-lg"
                    >
                        Go to My Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Header */}
            <div className="bg-[#151520] border-b border-[#2a2a35] px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00ff88] to-[#0099ff] bg-clip-text text-transparent">
                            {t[language].dashboard}
                        </h1>
                        <p className="text-[#a0a0b0]">{t[language].welcome}, {user.username}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {/* Language Switcher */}
                        <div className="flex bg-[#1a1a25] border border-[#2a2a35] rounded-lg p-1">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-2 py-0.5 rounded text-xs transition-all ${
                                    language === 'en' 
                                        ? 'bg-[#00ff88] text-[#0a0a0f] font-semibold' 
                                        : 'text-[#a0a0b0] hover:text-white'
                                }`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('vi')}
                                className={`px-2 py-0.5 rounded text-xs transition-all ${
                                    language === 'vi' 
                                        ? 'bg-[#00ff88] text-[#0a0a0f] font-semibold' 
                                        : 'text-[#a0a0b0] hover:text-white'
                                }`}
                            >
                                VI
                            </button>
                        </div>

                        {/* Admin Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center space-x-3 px-4 py-2 bg-[#1a1a25] border border-[#2a2a35] rounded-lg hover:border-[#00ff88]/30 transition-all"
                            >
                                <div className="w-8 h-8 bg-gradient-to-r from-[#00ff88] to-[#0099ff] rounded-full flex items-center justify-center font-semibold text-[#0a0a0f]">
                                    {user.username?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <span className="text-sm font-medium">{user.username}</span>
                                <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a25] border border-[#2a2a35] rounded-lg shadow-lg z-50">
                                    <div className="py-2">
                                        <div className="px-4 py-2 border-b border-[#2a2a35]">
                                            <p className="text-sm font-medium">{user.email}</p>
                                            <p className="text-xs text-[#a0a0b0] capitalize">{user.role}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowDropdown(false)}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-[#2a2a35] transition-colors"
                                        >
                                            {t[language].profileSettings}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false);
                                                logout();
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#2a2a35] transition-colors"
                                        >
                                            {t[language].logout}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`mx-6 mt-4 p-3 rounded-lg ${
                    message.includes('Error') || message.includes('error') 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                    {message}
                </div>
            )}

            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-[#151520] border-r border-[#2a2a35] min-h-screen p-6">
                    <nav className="space-y-2">
                        {[
                            { 
                                id: 'overview', 
                                label: t[language].overview,
                                icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                )
                            },
                            { 
                                id: 'users', 
                                label: t[language].users,
                                icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                )
                            },
                            { 
                                id: 'classes', 
                                label: t[language].classes,
                                icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                )
                            },
                            { 
                                id: 'sessions', 
                                label: t[language].sessions,
                                icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                )
                            },
                            { 
                                id: 'materials', 
                                label: t[language].materials,
                                icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                )
                            },
                            { 
                                id: 'announcements', 
                                label: t[language].announcements,
                                icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                )
                            },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-[#00ff88]/10 to-[#0099ff]/10 border border-[#00ff88]/20 text-[#00ff88]'
                                        : 'hover:bg-[#2a2a35] text-[#a0a0b0]'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                    {activeTab === 'overview' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">{t[language].overview}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { title: t[language].totalUsers, value: stats.totalUsers, color: 'from-purple-500 to-purple-600'},
                                    { title: t[language].totalClasses, value: stats.totalClasses, color: 'from-blue-500 to-blue-600' },
                                    { title: t[language].totalSessions, value: stats.totalSessions, color: 'from-green-500 to-green-600' },
                                    { title: t[language].materials, value: stats.totalMaterials, color: 'from-orange-500 to-orange-600' },
                                ].map((stat, index) => (
                                    <div key={index} className="bg-[#151520] border border-[#2a2a35] rounded-xl p-6">
                                        <p className="text-[#a0a0b0] text-sm">{stat.title}</p>
                                        <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{t[language].manageUsers}</h2>
                                <button
                                    onClick={() => {
                                        setCreateType('user');
                                        setShowCreateModal(true);
                                        setFormData({ 
                                            username: '',
                                            email: '',
                                            password: '',
                                            password_confirm: '',
                                            role: 'student' 
                                        });
                                        setIsEditing(false);
                                        setMessage(''); // Clear any previous messages
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-[#00ff88] to-[#0099ff] text-[#0a0a0f] rounded-lg font-semibold hover:shadow-lg transition-all"
                                >
                                    {t[language].createUser}
                                </button>
                            </div>

                            {/* Table */}
                            <div className="bg-[#151520] border border-[#2a2a35] rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-[#1a1a25] border-b border-[#2a2a35]">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].index}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].name}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].email}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].role}</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-[#a0a0b0]">{t[language].actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2a35]">
                                        {users.map((user, index) => (
                                            <tr key={user.id} className="hover:bg-[#1a1a25] transition-colors">
                                                <td className="px-6 py-4 text-sm">{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                                            user.role === 'admin' ? 'bg-purple-500' :
                                                            user.role === 'lecturer' ? 'bg-green-500' : 'bg-blue-500'
                                                        }`}>
                                                            {user.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium">{user.username || user.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#a0a0b0]">{user.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-medium capitalize px-3 py-1 rounded-full ${
                                                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                                                        user.role === 'lecturer' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center space-x-2">
                                                        <button 
                                                            onClick={() => handleEdit(user, 'user')}
                                                            className="p-2 hover:bg-blue-600/20 rounded transition-colors"
                                                            title={t[language].edit}
                                                        >
                                                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(user, 'user')}
                                                            className="p-2 hover:bg-red-600/20 rounded transition-colors"
                                                            title={t[language].delete}
                                                        >
                                                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'classes' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{t[language].manageClasses}</h2>
                                <button
                                    onClick={() => {
                                        setCreateType('class');
                                        setShowCreateModal(true);
                                        setFormData({});
                                        setIsEditing(false);
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-[#00ff88] to-[#0099ff] text-[#0a0a0f] rounded-lg font-semibold hover:shadow-lg transition-all"
                                >
                                    {t[language].createClass}
                                </button>
                            </div>

                            {/* Table */}
                            <div className="bg-[#151520] border border-[#2a2a35] rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-[#1a1a25] border-b border-[#2a2a35]">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].index}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].name}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].description}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].code}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].dates}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].students}</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-[#a0a0b0]">{t[language].actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2a35]">
                                        {classes.map((cls, index) => (
                                            <tr key={cls.id} className="hover:bg-[#1a1a25] transition-colors">
                                                <td className="px-6 py-4 text-sm">{index + 1}</td>
                                                <td className="px-6 py-4 font-medium">{cls.name}</td>
                                                <td className="px-6 py-4 text-sm text-[#a0a0b0] max-w-xs truncate">{cls.description || '-'}</td>
                                                <td className="px-6 py-4 text-sm text-[#00ff88]">{cls.class_code || 'None'}</td>
                                                <td className="px-6 py-4 text-sm text-[#a0a0b0]">{cls.start_date} - {cls.end_date}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-[#00ff88]">{getClassStudentCount(cls.id)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center space-x-2">
                                                        <button 
                                                            onClick={() => handleEdit(cls, 'class')}
                                                            className="p-2 hover:bg-blue-600/20 rounded transition-colors"
                                                            title={t[language].edit}
                                                        >
                                                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(cls, 'class')}
                                                            className="p-2 hover:bg-red-600/20 rounded transition-colors"
                                                            title={t[language].delete}
                                                        >
                                                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{t[language].manageSessions}</h2>
                                <button
                                    onClick={() => {
                                        setCreateType('session');
                                        setShowCreateModal(true);
                                        setFormData({});
                                        setIsEditing(false);
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-[#00ff88] to-[#0099ff] text-[#0a0a0f] rounded-lg font-semibold hover:shadow-lg transition-all"
                                >
                                    {t[language].createSession}
                                </button>
                            </div>

                            {/* Table */}
                            <div className="bg-[#151520] border border-[#2a2a35] rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-[#1a1a25] border-b border-[#2a2a35]">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].index}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].classname}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].topic}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].date}</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-[#a0a0b0]">{t[language].actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2a35]">
                                        {sessions.map((session, index) => (
                                            <tr key={session.id} className="hover:bg-[#1a1a25] transition-colors">
                                                <td className="px-6 py-4 text-sm">{index + 1}</td>
                                                <td className="px-6 py-4 text-sm text-[#a0a0b0]">{session.class_name || 'N/A'}</td>
                                                <td className="px-6 py-4 font-medium">{session.topic}</td>
                                                <td className="px-6 py-4 text-sm text-[#00ff88]">{new Date(session.date).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center space-x-2">
                                                        <button 
                                                            onClick={() => handleEdit(session, 'session')}
                                                            className="p-2 hover:bg-blue-600/20 rounded transition-colors"
                                                            title={t[language].edit}
                                                        >
                                                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(session, 'session')}
                                                            className="p-2 hover:bg-red-600/20 rounded transition-colors"
                                                            title={t[language].delete}
                                                        >
                                                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'materials' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{t[language].manageMaterials}</h2>
                            </div>

                            {/* Table */}
                            <div className="bg-[#151520] border border-[#2a2a35] rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-[#1a1a25] border-b border-[#2a2a35]">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].index}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].title}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].classId}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].uploadedBy}</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-[#a0a0b0]">{t[language].actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2a35]">
                                        {materials.map((material, index) => (
                                            <tr key={material.id} className="hover:bg-[#1a1a25] transition-colors">
                                                <td className="px-6 py-4 text-sm">{index + 1}</td>
                                                <td className="px-6 py-4 font-medium">{material.title}</td>
                                                <td className="px-6 py-4 text-sm text-[#a0a0b0]">Class #{material.class_id}</td>
                                                <td className="px-6 py-4 text-sm text-[#00ff88]">{material.uploaded_by || 'Unknown'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center space-x-2">
                                                        <button 
                                                            className="p-2 hover:bg-green-600/20 rounded transition-colors"
                                                            title={t[language].download}
                                                        >
                                                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(material, 'material')}
                                                            className="p-2 hover:bg-red-600/20 rounded transition-colors"
                                                            title={t[language].delete}
                                                        >
                                                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'announcements' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{t[language].manageAnnouncements}</h2>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setAnnouncementType('class')}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${
                                            announcementType === 'class' 
                                                ? 'bg-[#00ff88] text-[#0a0a0f]' 
                                                : 'bg-[#2a2a35] hover:bg-[#3a3a45]'
                                        }`}
                                    >
                                        {t[language].classAnnouncements}
                                    </button>
                                    <button
                                        onClick={() => setAnnouncementType('system')}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${
                                            announcementType === 'system' 
                                                ? 'bg-[#00ff88] text-[#0a0a0f]' 
                                                : 'bg-[#2a2a35] hover:bg-[#3a3a45]'
                                        }`}
                                    >
                                        {t[language].systemAnnouncements}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <button
                                    onClick={() => {
                                        setCreateType(announcementType === 'class' ? 'class-announcement' : 'system-announcement');
                                        setShowCreateModal(true);
                                        setFormData({});
                                        setIsEditing(false);
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-[#00ff88] to-[#0099ff] text-[#0a0a0f] rounded-lg font-semibold hover:shadow-lg transition-all"
                                >
                                    {t[language].create} {announcementType === 'class' ? t[language].classAnnouncements : t[language].systemAnnouncements}
                                </button>
                            </div>

                            {/* Table */}
                            <div className="bg-[#151520] border border-[#2a2a35] rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-[#1a1a25] border-b border-[#2a2a35]">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].index}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].title}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].content}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].postedBy}</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-[#a0a0b0]">{t[language].actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2a35]">
                                        {(announcementType === 'class' ? classAnnouncements : systemAnnouncements).map((announcement, index) => (
                                            <tr key={announcement.id} className="hover:bg-[#1a1a25] transition-colors">
                                                <td className="px-6 py-4 text-sm">{index + 1}</td>
                                                <td className="px-6 py-4 font-medium">{announcement.title}</td>
                                                <td className="px-6 py-4 text-sm text-[#a0a0b0] max-w-md truncate">{announcement.content}</td>
                                                <td className="px-6 py-4 text-sm text-[#00ff88]">{announcement.posted_by_name || 'Admin'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center space-x-2">
                                                        {announcementType === 'system' && (
                                                            <button 
                                                                onClick={() => handleEdit(announcement, 'system-announcement')}
                                                                className="p-2 hover:bg-blue-600/20 rounded transition-colors"
                                                                title={t[language].edit}
                                                            >
                                                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleDelete(announcement, announcementType === 'class' ? 'class-announcement' : 'system-announcement')}
                                                            className="p-2 hover:bg-red-600/20 rounded transition-colors"
                                                            title={t[language].delete}
                                                        >
                                                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#151520] border border-[#2a2a35] rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4 capitalize">
                            {isEditing ? t[language].edit : t[language].create} {createType.replace('-', ' ')}
                        </h3>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            {createType === 'user' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Username</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.username || ''}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="email"
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    {!isEditing && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Password</label>
                                                <input
                                                    type="password"
                                                    className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                                    value={formData.password || ''}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                    minLength={8}
                                                />
                                                <p className="text-xs text-[#a0a0b0] mt-1">Minimum 8 characters</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                                    value={formData.password_confirm || ''}
                                                    onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                                                    required
                                                    minLength={8}
                                                />
                                                {formData.password && formData.password_confirm && formData.password !== formData.password_confirm && (
                                                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{t[language].role}</label>
                                        <select
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.role || 'student'}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            required
                                        >
                                            <option value="student">Student</option>
                                            <option value="lecturer">Lecturer</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {createType === 'class' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{t[language].name}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{t[language].description}</label>
                                        <textarea
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            rows="3"
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.start_date || ''}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">End Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.end_date || ''}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{t[language].code} (Optional)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.class_code || ''}
                                            onChange={(e) => setFormData({ ...formData, class_code: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {createType === 'session' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{t[language].classId}</label>
                                        <select
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.class_id || ''}
                                            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select a class</option>
                                            {classes.map((cls) => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{t[language].topic}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.topic || ''}
                                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{t[language].date}</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.date ? new Date(formData.date).toISOString().slice(0, 16) : ''}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {(createType === 'class-announcement' || createType === 'system-announcement') && (
                                <>
                                    {createType === 'class-announcement' && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{t[language].classId}</label>
                                            <select
                                                className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                                value={formData.class_id || ''}
                                                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Select a class</option>
                                                {classes.map((cls) => (
                                                    <option key={cls.id} value={cls.id}>
                                                        {cls.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{t[language].title}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.title || ''}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{t[language].content}</label>
                                        <textarea
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            rows="4"
                                            value={formData.content || ''}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetModal}
                                    className="px-4 py-2 bg-[#2a2a35] hover:bg-[#3a3a45] rounded-lg transition-colors"
                                >
                                    {t[language].cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-gradient-to-r from-[#00ff88] to-[#0099ff] text-[#0a0a0f] rounded-lg font-semibold hover:shadow-lg transition-all"
                                >
                                    {isEditing ? t[language].update : t[language].create}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#151520] border border-[#2a2a35] rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Confirm {t[language].delete}</h3>
                        <p className="text-[#a0a0b0] mb-6">
                            Are you sure you want to delete this {createType.replace('-', ' ')}? This action cannot be undone.
                        </p>
                        {selectedItem && (
                            <div className="bg-[#1a1a25] border border-[#2a2a35] rounded-lg p-3 mb-6">
                                <p className="font-semibold">
                                    {selectedItem.name || selectedItem.topic || selectedItem.title || selectedItem.username || selectedItem.email}
                                </p>
                                {selectedItem.description && (
                                    <p className="text-[#a0a0b0] text-sm mt-1">{selectedItem.description}</p>
                                )}
                                {selectedItem.content && (
                                    <p className="text-[#a0a0b0] text-sm mt-1">{selectedItem.content}</p>
                                )}
                            </div>
                        )}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-[#2a2a35] hover:bg-[#3a3a45] rounded-lg transition-colors"
                            >
                                {t[language].cancel}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                {t[language].delete}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}