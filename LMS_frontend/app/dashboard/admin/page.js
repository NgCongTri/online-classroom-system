'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';

export default function AdminDashboard() {
    const router = useRouter();
    
    let authData = { user: null, loading: true, logout: () => {} };
    try {
        authData = useAuth();
    } catch (error) {
        console.error('useAuth error:', error);
        authData = { user: null, loading: false, logout: () => {} };
    }
    
    const { user, loading, logout } = authData;
    
    const isValidUser = user && typeof user === 'object';
    const userRole = isValidUser ? user.role : null;
    const isAdmin = userRole === 'admin';
    const hasUser = isValidUser && userRole;
    
    const safeUsername = user && user.username ? user.username : 'Admin';
    
    // DEBUG: Log để xem user state
    useEffect(() => {
        console.log('Admin Dashboard - user:', user);
        console.log('Admin Dashboard - loading:', loading);
        console.log('Admin Dashboard - userRole:', userRole);
        console.log('Admin Dashboard - isAdmin:', isAdmin);
        console.log('Admin Dashboard - hasUser:', hasUser);
    }, [user, loading, userRole, isAdmin, hasUser]);

    const [activeTab, setActiveTab] = useState('overview');
    const [showDropdown, setShowDropdown] = useState(false);
    const [language, setLanguage] = useState('en');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false); 
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalClasses: 0,
        totalSessions: 0,
        totalMaterials: 0,
        totalStudents: 0,
        totalLecturers: 0,
        totalAdmins: 0
    });
    
    // Data states
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [classAnnouncements, setClassAnnouncements] = useState([]);
    const [systemAnnouncements, setSystemAnnouncements] = useState([]);
    const [loginHistory, setLoginHistory] = useState([]);
    
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
        logo_name: 'OCS',
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
        totalMaterials: 'Total Materials',
        students: 'Students',
        lecturers: 'Lecturers',
        lecturer_email: 'Lecturer Email',
        admins: 'Admins',
        loginHistory: 'Login History',
        username: 'Username',
        loginTime: 'Login Time',
        logoutTime: 'Logout Time',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        ipAddress: 'IP Address',
        device: 'Device',
        refresh: 'Refresh',
        manageUsers: 'Manage Users',
        createUser: 'Create User',
        manageClasses: 'Manage Classes',
        createClass: 'Create Class',
        manageSessions: 'Manage Sessions',
        createSession: 'Create Session',
        manageMaterials: 'Manage Materials',
        uploadMaterial: 'Upload Material',
        manageAnnouncements: 'Manage Announcements',
        classAnnouncements: 'Class Announcements',
        systemAnnouncements: 'System Announcements',
        createAnnouncement: 'Create Announcement',
        index: '#',
        name: 'Name',
        class_name: 'Class Name',
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
        create: 'Create',
        edit: 'Edit',
        delete: 'Delete',
        cancel: 'Cancel',
        update: 'Update',
        download: 'Download',
        save: 'Save',
        close: 'Close',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        passwordHint: 'Minimum 8 characters',
        passwordMismatch: 'Passwords do not match',
        startDate: 'Start Date',
        endDate: 'End Date',
        codeOptional: 'Code (Optional)',
        selectClass: 'Select a class',
        loading: 'Loading...',
        notAuthenticated: 'Not authenticated',
        accessDenied: 'Access Denied',
        noPermission: 'You don\'t have permission to access this page',
        yourRole: 'Your current role',
        goToDashboard: 'Go to Dashboard',
        goToLogin: 'Go to Login',
        confirmDelete: 'Confirm Delete',
        deleteWarning: 'Are you sure you want to delete this',
        cannotUndo: 'This action cannot be undone.',
        createdSuccess: 'created successfully!',
        updatedSuccess: 'updated successfully!',
        deletedSuccess: 'deleted successfully!',
        errorOccurred: 'An error occurred',
        failedToLoad: 'Failed to load',
        student: 'Student',
        lecturer: 'Lecturer',
        admin: 'Admin',
        unknown: 'Unknown',
        none: 'None',
        optional: 'Optional',
        required: 'Required',
        openEnrollment: 'Open Enrollment',
        openEnrollmentDescription: 'Students can join freely without class code',
        codeRequiredDescription: 'Students need class code to join this class',
        enrollmentType: 'Enrollment Type',
        codeRequired: 'Enter code',
        allowAll: 'Allow all',
        enterClassCode: 'Enter class code',
        classCodeHint: 'Students will use this code to join the class',
        generatedCode: 'Generated Code',
        codeWillBeGenerated: 'Code will be generated automatically',
    },

    vi: {
        dashboard: 'Bảng Điều Khiển Quản Trị',
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
        totalMaterials: 'Tổng Tài Liệu',
        students: 'Học Sinh',
        lecturers: 'Giảng Viên',
        lecturer_email: 'Email Giảng Viên',
        admins: 'Quản Trị Viên',
        loginHistory: 'Lịch Sử Đăng Nhập',
        username: 'Tên Người Dùng',
        loginTime: 'Thời Gian Đăng Nhập',
        logoutTime: 'Thời Gian Đăng Xuất',
        status: 'Trạng Thái',
        active: 'Đang Hoạt Động',
        inactive: 'Đã Đăng Xuất',
        ipAddress: 'Địa Chỉ IP',
        device: 'Thiết Bị',
        refresh: 'Làm Mới',
        manageUsers: 'Quản Lý Người Dùng',
        createUser: 'Tạo Người Dùng',
        manageClasses: 'Quản Lý Lớp Học',
        createClass: 'Tạo Lớp Học',
        manageSessions: 'Quản Lý Buổi Học',
        createSession: 'Tạo Buổi Học',
        manageMaterials: 'Quản Lý Tài Liệu',
        uploadMaterial: 'Tải Lên Tài Liệu',
        manageAnnouncements: 'Quản Lý Thông Báo',
        classAnnouncements: 'Thông Báo Lớp Học',
        systemAnnouncements: 'Thông Báo Hệ Thống',
        createAnnouncement: 'Tạo Thông Báo',
        index: 'STT',
        name: 'Tên',
        classname: 'Tên Lớp',
        email: 'Email',
        role: 'Vai Trò',
        actions: 'Thao Tác',
        description: 'Mô Tả',
        code: 'Mã',
        dates: 'Thời Gian',
        topic: 'Chủ Đề',
        classId: 'Lớp Học',
        date: 'Ngày',
        title: 'Tiêu Đề',
        content: 'Nội Dung',
        uploadedBy: 'Người Tải Lên',
        postedBy: 'Người Đăng',
        create: 'Tạo',
        edit: 'Sửa',
        delete: 'Xóa',
        cancel: 'Hủy',
        update: 'Cập Nhật',
        download: 'Tải Xuống',
        save: 'Lưu',
        close: 'Đóng',
        password: 'Mật Khẩu',
        confirmPassword: 'Xác Nhận Mật Khẩu',
        passwordHint: 'Tối thiểu 8 ký tự',
        passwordMismatch: 'Mật khẩu không khớp',
        startDate: 'Ngày Bắt Đầu',
        endDate: 'Ngày Kết Thúc',
        codeOptional: 'Mã (Tùy Chọn)',
        selectClass: 'Chọn một lớp',
        loading: 'Đang tải...',
        notAuthenticated: 'Chưa xác thực',
        accessDenied: 'Truy Cập Bị Từ Chối',
        noPermission: 'Bạn không có quyền truy cập trang này',
        yourRole: 'Vai trò hiện tại của bạn',
        goToDashboard: 'Đi tới Bảng Điều Khiển',
        goToLogin: 'Đi tới Đăng Nhập',
        confirmDelete: 'Xác Nhận Xóa',
        deleteWarning: 'Bạn có chắc muốn xóa',
        cannotUndo: 'Hành động này không thể hoàn tác.',
        createdSuccess: 'đã được tạo thành công!',
        updatedSuccess: 'đã được cập nhật thành công!',
        deletedSuccess: 'đã được xóa thành công!',
        errorOccurred: 'Đã xảy ra lỗi',
        failedToLoad: 'Không thể tải',
        student: 'Học Sinh',
        class_name:'Tên Lớp',
        lecturer: 'Giảng Viên',
        admin: 'Quản Trị Viên',
        unknown: 'Không Xác Định',
        none: 'Không Có',
        optional: 'Tùy Chọn',
        required: 'Bắt Buộc',
        openEnrollment: 'Mở Đăng Ký',
        openEnrollmentDescription: 'Sinh viên có thể tham gia tự do không cần mã lớp',
        codeRequiredDescription: 'Sinh viên cần mã lớp để tham gia lớp học này',
        enrollmentType: 'Loại Đăng Ký',
        codeRequired: 'Yêu Cầu Mã',
        allowAll: 'Mở Cho Tất Cả',
        enterClassCode: 'Nhập mã lớp học',
        classCodeHint: 'Sinh viên sẽ sử dụng mã này để tham gia lớp',
        generatedCode: 'Mã Được Tạo',
        codeWillBeGenerated: 'Mã sẽ được tạo tự động',
    }
};

    
    useEffect(() => {
        console.log('Auth check - loading:', loading, 'hasUser:', hasUser, 'userRole:', userRole, 'isAdmin:', isAdmin);
        
        if (!loading) {
            if (!hasUser) {
                console.log('No user, redirecting to /');
                router.push('/');
                return;
            }
            
            if (!isAdmin) {
                console.log('User is not admin, redirecting to /dashboard, role:', userRole);
                router.push('/');
                return;
            }
            
            console.log('User is admin, access granted');
        }
    }, [loading, hasUser, isAdmin, userRole, router]);

    
    useEffect(() => {
        const canFetchData = !loading && hasUser && isAdmin && !dataFetched;
        console.log('Can fetch data:', canFetchData, { loading, hasUser, isAdmin, dataFetched });
        
        if (canFetchData) {
            console.log('Fetching dashboard data...');
            fetchDashboardData();
            fetchLoginHistory();
            setDataFetched(true);
        }
    }, [loading, hasUser, isAdmin, dataFetched]);

    const fetchDashboardData = useCallback(async () => {
        try {
            console.log('Starting fetchDashboardData...');
            const [usersRes, classesRes, sessionsRes, materialsRes] = await Promise.all([
                api.get('/users/'),
                api.get('/classes/'),
                api.get('/sessions/'),
                api.get('/materials/')
            ]);

            console.log('Data fetched successfully:', {
                users: usersRes.data.length,
                classes: classesRes.data.length,
                sessions: sessionsRes.data.length,
                materials: materialsRes.data.length
            });

            setUsers(usersRes.data || []);
            setClasses(classesRes.data || []);
            setSessions(sessionsRes.data || []);
            setMaterials(materialsRes.data || []);

            const safeUsers = usersRes.data || [];
            const students = safeUsers.filter(u => u && u.role === 'student').length;
            const lecturers = safeUsers.filter(u => u && u.role === 'lecturer').length;
            const admins = safeUsers.filter(u => u && u.role === 'admin').length;

            setStats({
                totalUsers: safeUsers.length,
                totalClasses: (classesRes.data || []).length,
                totalSessions: (sessionsRes.data || []).length,
                totalMaterials: (materialsRes.data || []).length,
                totalStudents: students,
                totalLecturers: lecturers,
                totalAdmins: admins
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setMessage('Failed to load dashboard data');
        }
    }, []);

    const fetchLoginHistory = useCallback(async () => {
        try {
            console.log('Fetching login history...');
            const response = await api.get('/login-history/');
            console.log('Login history fetched:', response.data);
            setLoginHistory(response.data || []);
        } catch (error) {
            console.error('Error fetching login history:', error);
            setLoginHistory([]);
        }
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
            const students = response.data.filter(u => u?.role === 'student');
            const lecturers = response.data.filter(u => u?.role === 'lecturer');
            const admins = response.data.filter(u => u?.role === 'admin');
            
            setStats(prev => ({
                ...prev,
                totalUsers: response.data.length,
                totalStudents: students.length,
                totalLecturers: lecturers.length,
                totalAdmins: admins.length
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        
        try {
            let payload = {};

            // Build payload based on type
            if (createType === 'class') {
                payload = {
                    name: formData.name,
                    description: formData.description,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    is_open_enrollment: formData.is_open_enrollment || false
                };
                
            } else if (createType === 'session') {
                payload = {
                    class_id: parseInt(formData.class_id),
                    topic: formData.topic,
                    date: formData.date
                };
            }
            // ...existing code for other types...

            // Helper function to get plural endpoint
            const getEndpoint = (type) => {
                const endpoints = {
                    'user': 'users',
                    'class': 'classes',
                    'session': 'sessions',
                    'material': 'materials',
                    'announcement': 'announcements'
                };
                return endpoints[type] || `${type}s`;
            };

            let response;
            if (isEditing) {
                response = await api.put(`/${getEndpoint(createType)}/${selectedItem.id}/`, payload);
                setMessage(`${createType.charAt(0).toUpperCase() + createType.slice(1)} ${t[language].updatedSuccess}`);
            } else {
                response = await api.post(`/${getEndpoint(createType)}/`, payload);
                setMessage(`${createType.charAt(0).toUpperCase() + createType.slice(1)} ${t[language].createdSuccess}`);
                
                // Show generated class code if available
                if (createType === 'class' && response.data.class_code && !response.data.is_open_enrollment) {
                    setMessage(`${t[language].createdSuccess} ${t[language].generatedCode}: ${response.data.class_code}`);
                }
            }

            resetModal();
            fetchDashboardData();
        } catch (error) {
            console.error('Error:', error);
            setMessage(`${t[language].errorOccurred}: ${error.response?.data?.detail || error.message}`);
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
            setMessage(`${createType.replace('-', ' ')} ${t[language].deletedSuccess}`);
            setShowDeleteModal(false);
            setSelectedItem(null);
            fetchDashboardData();
            if (createType === 'user') fetchUsers();
            setTimeout(() => setMessage(''), 2000);
        } catch (error) {
            setMessage(error.response?.data?.detail || `${t[language].errorOccurred} ${createType.replace('-', ' ')}`);
        }
    };

    const resetModal = () => {
        setShowCreateModal(false);
        setFormData({});
        setIsEditing(false);
        setSelectedItem(null);
        setCreateType('');
        if (message.includes(t[language].errorOccurred)) {
            setMessage('');
        }
    };

    const getClassStudentCount = (classId) => {
        return 1;
    };

    const statsCards = [
        { 
            title: t[language].totalUsers, 
            value: stats.totalUsers, 
            color: 'from-purple-500 to-purple-600',
            tab: 'users',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        { 
            title: t[language].totalClasses, 
            value: stats.totalClasses, 
            color: 'from-blue-500 to-blue-600',
            tab: 'classes',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            )
        },
        { 
            title: t[language].totalSessions, 
            value: stats.totalSessions, 
            color: 'from-green-500 to-green-600',
            tab: 'sessions',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        { 
            title: t[language].totalMaterials, 
            value: stats.totalMaterials, 
            color: 'from-orange-500 to-orange-600',
            tab: 'materials',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
    ];

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return '-';
        }
    };

    const getDeviceInfo = (userAgent) => {
        if (!userAgent) return t[language].unknown;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Other';
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

    // No user state
    if (!hasUser) {
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

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">Access Denied</div>
                    <p className="text-gray-400 mb-4">Your role: {userRole || 'Unknown'}</p>
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

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Header */}
            <div className="bg-[#151520] border-b border-[#2a2a35] px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00ff88] to-[#0099ff] bg-clip-text text-transparent font-georgia">
                            {t[language].logo_name}
                        </h1>
                        <p className="text-white font-georgia">{t[language].dashboard}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {/* Language Switcher */}
                        <div className="flex bg-[#1a1a25] border border-[#2a2a35] rounded-lg p-1">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                                    language === 'en' 
                                        ? 'bg-[#00ff88] text-[#0a0a0f]' 
                                        : 'text-[#a0a0b0] hover:text-white'
                                }`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('vi')}
                                className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                                    language === 'vi' 
                                        ? 'bg-[#00ff88] text-[#0a0a0f]' 
                                        : 'text-[#a0a0b0] hover:text-white'
                                }`}
                            >
                                VI
                            </button>
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center space-x-3 px-4 py-2 bg-[#1a1a25] border border-[#2a2a35] rounded-lg hover:border-[#00ff88]/30 transition-all"
                            >
                                <div className="w-8 h-8 bg-gradient-to-r from-[#00ff88] to-[#0099ff] rounded-full flex items-center justify-center font-semibold text-[#0a0a0f]">
                                    {safeUsername.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{safeUsername}</span>
                                <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a25] border border-[#2a2a35] rounded-lg shadow-lg z-50">
                                    <div className="py-2">
                                        <div className="px-4 py-2 border-b border-[#2a2a35]">
                                            <p className="text-sm font-medium">{user?.email}</p>
                                            <p className="text-xs text-[#a0a0b0] capitalize">{t[language].admin}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowDropdown(false)}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-[#2a2a35] transition-colors"
                                        >
                                            Profile Settings
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

            {/* Message notification */}
            {message && (
                <div className={`mx-6 mt-4 p-4 rounded-lg ${
                    message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                    <div className="flex items-center justify-between">
                        <span>{message}</span>
                        <button onClick={() => setMessage('')} className="text-xl hover:text-white transition-colors">&times;</button>
                    </div>
                </div>
            )}

            <div className="flex">
                {/* Sidebar */}
<div className={`${sidebarCollapsed ? 'w-18' : 'w-54'} bg-[#151520] border-r border-[#2a2a35] min-h-screen ${sidebarCollapsed ? 'px-2 py-6' : 'p-6'} transition-all duration-300 overflow-visible`}>
                    {/* Toggle Button */}
                    <div className="mb-6">
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className={`w-full flex items-center justify-center ${sidebarCollapsed ? 'p-2' : 'p-2'} rounded-lg bg-[#2a2a35] hover:bg-[#3a3a45] text-[#a0a0b0] hover:text-white transition-all`}
                            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                        >
                            <svg 
                                className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-0' : 'rotate-180'}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <nav className="space-y-2">
                        {[
                            { 
                                id: 'overview', 
                                label: t[language].overview,
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                )
                            },
                            { 
                                id: 'users', 
                                label: t[language].users,
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                )
                            },
                            { 
                                id: 'classes', 
                                label: t[language].classes,
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                )
                            },
                            { 
                                id: 'sessions', 
                                label: t[language].sessions,
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 007 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                )
                            },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all relative group ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-[#00ff88]/10 to-[#0099ff]/10 border border-[#00ff88]/20 text-[#00ff88]'
                                        : 'hover:bg-[#2a2a35] text-[#a0a0b0]'
                                }`}
                                title={sidebarCollapsed ? tab.label : ''}
                            >
                                <div className="flex-shrink-0">
                                    {tab.icon}
                                </div>
                                {!sidebarCollapsed && <span className="ml-3">{tab.label}</span>}
                                
                                {/* Tooltip when collapsed */}
                                {sidebarCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#2a2a35] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                        {tab.label}
                                    </div>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-4">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold mb-6">{t[language].overview}</h2>
                            
                            {/* Stats Cards - Compact & Tall */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {statsCards.map((stat, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => setActiveTab(stat.tab)}
                                        className="bg-[#151520] border border-[#2a2a35] rounded-xl p-4 py-5 hover:border-[#00ff88]/30 transition-all cursor-pointer transform hover:scale-105"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0 pr-3">
                                                <p className="text-[#a0a0b0] text-sl mb-2 truncate">{stat.title}</p>
                                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                            </div>
                                            <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white flex-shrink-0`}>
                                                <div className="w-6 h-6 flex items-center justify-center">
                                                    {stat.icon}
                                                </div>
                                            </div>                                            
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Login History Table - Compact spacing */}
                            <div className="mt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">{t[language].loginHistory}</h3>
                                    <button
                                        onClick={fetchLoginHistory}
                                        className="px-3 py-2 bg-[#2a2a35] hover:bg-[#3a3a45] rounded-lg text-sm transition-colors"
                                    >
                                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh
                                    </button>
                                </div>
                                
                                <div className="bg-[#151520] border border-[#2a2a35] rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-[#1a1a25] border-b border-[#2a2a35]">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].index}</th>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].username}</th>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].email}</th>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].role}</th>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].ipAddress}</th>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].loginTime}</th>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].logoutTime}</th>
                                                    <th className="px-3 py-2 text-center text-sm font-semibold text-[#a0a0b0]">{t[language].status}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#2a2a35]">
                                                {loginHistory.map((history, index) => (
                                                    <tr key={history.id} className="hover:bg-[#1a1a25] transition-colors">
                                                        <td className="px-4 py-2 text-sm text-center">{index + 1}</td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center space-x-2">
                                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                                                    history.user_role === 'admin' ? 'bg-purple-500' :
                                                                    history.user_role === 'lecturer' ? 'bg-green-500' : 'bg-blue-500'
                                                                }`}>
                                                                    {history.username?.charAt(0).toUpperCase() || 'U'}
                                                                </div>
                                                                <span className="font-medium text-sm">{history.username}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-sm text-[#a0a0b0]">{history.email}</td>
                                                        <td className="px-3 py-2">
                                                            <span className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${
                                                                history.user_role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                                                                history.user_role === 'lecturer' ? 'bg-green-500/20 text-green-300' : 
                                                                'bg-blue-500/20 text-blue-300'
                                                            }`}>
                                                                {history.user_role}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-sm text-[#a0a0b0]">
                                                            {history.ip_address || t[language].unknown}
                                                            <br/>
                                                            <span className="text-xs text-[#808090]">({getDeviceInfo(history.user_agent)})</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-sm text-[#a0a0b0] whitespace-nowrap">{formatDateTime(history.login_time)}</td>
                                                        <td className="px-3 py-2 text-sm text-[#a0a0b0] whitespace-nowrap">{formatDateTime(history.logout_time)}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                history.is_active 
                                                                    ? 'bg-green-500/20 text-green-300' 
                                                                    : 'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                                    history.is_active ? 'bg-green-400' : 'bg-gray-400'
                                                                }`}></span>
                                                                {history.is_active ? t[language].active : t[language].inactive}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
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
                                        setFormData({
                                            enrollment_type: 'open',
                                            is_open_enrollment: true
                                        });
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
                                            <th className="px-5 py-3 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].index}</th>
                                            <th className="px-5 py-3 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].class_name}</th>
                                            <th className="px-5 py-3 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].lecturer_email}</th>
                                            <th className="px-5 py-3 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].dates}</th>
                                            <th className="px-5 py-3 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].students}</th>
                                            <th className="px-5 py-3 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].enrollmentType}</th>
                                            <th className="px-5 py-3 text-left text-sm font-semibold text-[#a0a0b0]">{t[language].code}</th>
                                            <th className="px-5 py-3 text-center text-sm font-semibold text-[#a0a0b0]">{t[language].actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2a35]">
                                        {classes.map((cls, index) => (
                                            <tr key={cls.id} className="hover:bg-[#1a1a25] transition-colors">
                                                <td className="px-5 py-3 text-sm">{index + 1}</td>
                                                <td className="px-5 py-3 font-medium">{cls.name}</td>
                                                <td className="px-5 py-3 text-sm ">{cls.lecturer_email || 'None'}</td>                                                
                                                <td className="px-5 py-3 text-sm text-[#a0a0b0]">{cls.start_date} - {cls.end_date}</td>
                                                <td className="px-5 py-3 text-sm font-semibold text-[#00ff88]">{getClassStudentCount(cls.id)}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                                                        cls.is_open_enrollment 
                                                            ? 'bg-green-500/20 text-green-300' 
                                                            : 'bg-orange-500/20 text-orange-300'
                                                    }`}>
                                                        <span className="w-2 h-2 rounded-full mr-2 inline-block bg-current"></span>
                                                        {cls.is_open_enrollment ? t[language].allowAll : t[language].codeRequired}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`text-sm ${cls.class_code ? 'text-orange-300' : 'text-green-300'}`}>
                                                        {cls.class_code || 'None'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
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

                            {/* Announcement Table */}
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
                                        <label className="block text-sm font-medium mb-2">
                                            {t[language].enrollmentType}
                                        </label>
                                        <select
                                            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-lg px-3 py-2 focus:border-[#00ff88] focus:outline-none"
                                            value={formData.is_open_enrollment ? 'open' : 'code'}
                                            onChange={(e) => {
                                                const isOpen = e.target.value === 'open';
                                                setFormData({
                                                    ...formData,
                                                    is_open_enrollment: isOpen
                                                });
                                            }}
                                        >
                                            <option value="open">{t[language].allowAll}</option>
                                            <option value="code">{t[language].codeRequired}</option>
                                        </select>
                                    </div>
                                    
                                    {/* Show info when code required is selected */}
                                    {formData.is_open_enrollment === false && !isEditing && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="flex items-start space-x-2">
                                                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-sm text-blue-700">
                                                    {t[language].codeWillBeGenerated}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Show generated code when editing */}
                                    {isEditing && selectedItem?.class_code && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                {t[language].generatedCode}
                                            </label>
                                            <div className="px-3 py-2 bg-[#1a1a25] border border-[#2a2a35] rounded-lg">
                                                <code className="text-lg font-mono font-bold text-[#00ff88]">
                                                    {selectedItem.class_code}
                                                </code>
                                            </div>
                                        </div>
                                    )}
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