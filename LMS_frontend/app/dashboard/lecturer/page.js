'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { getClassColor, getBorderColor } from '../../utils/class_color';

export default function LecturerDashboard() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    
    const [classes, setClasses] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [language, setLanguage] = useState('en');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({});
    const [viewMode, setViewMode] = useState('grid');

    const t = {
        en: {
            logo_name: 'OCS',
            Title: 'Online Classroom System',
            createClass: 'Create Class',
            noClasses: 'No classes yet',
            startTeaching: 'Start teaching by creating your first class',
            students: 'students',
            viewClass: 'View Class',
            className: 'Class Name',
            description: 'Description',
            startDate: 'Start Date',
            endDate: 'End Date',
            enrollmentType: 'Enrollment Type',
            openToAll: 'Open to All',
            codeRequired: 'Code Required',
            classCode: 'Class Code',
            generatedCode: 'Generated Code',
            codeWillBeGenerated: 'Code will be generated automatically when you create the class',
            create: 'Create',
            cancel: 'Cancel',
            logout: 'Logout',
            loading: 'Loading...',
            gridView: 'Grid View',
            listView: 'List View',
        },
        vi: {
            logo_name: 'OCS',
            Title: 'Lớp Của Tôi',
            createClass: 'Tạo Lớp Học',
            noClasses: 'Chưa có lớp học nào',
            startTeaching: 'Bắt đầu giảng dạy bằng cách tạo lớp học đầu tiên',
            students: 'học sinh',
            viewClass: 'Xem Lớp',
            className: 'Tên Lớp',
            description: 'Mô Tả',
            startDate: 'Ngày Bắt Đầu',
            endDate: 'Ngày Kết Thúc',
            enrollmentType: 'Loại Đăng Ký',
            openToAll: 'Mở Cho Tất Cả',
            codeRequired: 'Yêu Cầu Mã',
            classCode: 'Mã Lớp',
            generatedCode: 'Mã Được Tạo',
            codeWillBeGenerated: 'Mã sẽ được tạo tự động khi bạn tạo lớp học',
            create: 'Tạo',
            cancel: 'Hủy',
            logout: 'Đăng Xuất',
            loading: 'Đang tải...',
            gridView: 'Dạng Lưới',
            listView: 'Dạng Danh Sách',
        }
    };

    useEffect(() => {
        if (!loading && user?.role !== 'lecturer') {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user?.role === 'lecturer') {
            fetchClasses();
        }
    }, [user]);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes/');
            
            console.log('All classes response:', res.data);
            console.log('Current user ID:', user.id);
            
            const lecturerClasses = res.data.filter(cls => {
                const lecturerId = typeof cls.lecturer === 'object' && cls.lecturer !== null
                    ? cls.lecturer.id
                    : cls.lecturer;
                
                const createdById = typeof cls.created_by === 'object' && cls.created_by !== null
                    ? cls.created_by.id
                    : cls.created_by;
                
                console.log(`✓ Class "${cls.name}": lecturer=${lecturerId}, created_by=${createdById}, user=${user.id}`);
                
                const match = lecturerId === user.id || createdById === user.id;
                
                if (match) {
                    console.log(` MATCHED!`);
                }
                
                return match;
            });
            
            console.log('Filtered lecturer classes:', lecturerClasses);
            setClasses(lecturerClasses);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                start_date: formData.start_date,
                end_date: formData.end_date,
                is_open_enrollment: formData.is_open_enrollment,
                lecturer: user.id,
                created_by: user.id
            };
            
            Object.keys(payload).forEach(key => {
                if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
                    delete payload[key];
                }
            });
            
            console.log('📤 Sending class payload:', payload);
            
            const response = await api.post('/classes/', payload);
            
            if (response.data.class_code && !response.data.is_open_enrollment) {
                setMessage(`Class created successfully! Generated Code: ${response.data.class_code}`);
            } else {
                setMessage('Class created successfully!');
            }
            
            setShowCreateModal(false);
            setFormData({});
            fetchClasses();
        } catch (error) {
            console.error('❌ Create class error:', error.response?.data);
            
            let errorMsg = 'Error creating class';
            if (error.response?.data) {
                const data = error.response.data;
                if (data.detail) {
                    errorMsg = data.detail;
                } else if (data.message) {
                    errorMsg = data.message;
                }
            }
            setMessage(errorMsg);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header - Google Classroom style */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-georgia font-bold text-gray-800">
                                {t[language].Title}
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {/* Language Switcher */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                                    language === 'en' 
                                        ? 'bg-white text-green-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('vi')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                                    language === 'vi' 
                                        ? 'bg-white text-green-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                VI
                            </button>
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-semibold text-white text-sm">
                                    {user?.username?.charAt(0).toUpperCase() || 'L'}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{user?.username || 'Lecturer'}</span>
                                <svg className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="py-2">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                                            <p className="text-xs text-gray-500 mt-1">Lecturer</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false);
                                                logout();
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                <div className="max-w-7xl mx-auto px-6 mt-4">
                    <div className={`p-4 rounded-lg ${
                        message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{message}</span>
                            <button onClick={() => setMessage('')} className="text-xl hover:opacity-70 transition-opacity">&times;</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-6">
                {/* Action Bar */}
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => {
                            setShowCreateModal(true);
                            setFormData({
                                enrollment_type: 'open',
                                is_open_enrollment: true
                            });
                        }}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>{t[language].createClass}</span>
                    </button>

                    {/* View Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${
                                viewMode === 'grid'
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            title={t[language].gridView}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${
                                viewMode === 'list'
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            title={t[language].listView}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Classes Grid/List */}
                {classes.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t[language].noClasses}</h3>
                        <p className="text-gray-600">{t[language].startTeaching}</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'
                        : 'space-y-4'
                    }>
                        {classes.map((cls) => {                            
                            const gradientColor = getClassColor(cls.id);
                            const borderColor = getBorderColor(gradientColor);
                            
                            return (
                                <div
                                    key={cls.id}
                                    onClick={() => router.push(`/dashboard/class/${cls.id}`)}
                                    className={`bg-white rounded-xl border-2 ${borderColor} overflow-hidden hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1`}
                                >
                                    {/* Class Cover */}
                                    <div className={`h-24 bg-gradient-to-r ${gradientColor} p-4 relative`}>
                                        <h3 className="text-white text-lg font-semibold truncate mb-1">{cls.name}</h3>
                                        <p className="text-white/90 text-xs font-mono tracking-wider">
                                            {cls.class_code || 'No code'}
                                        </p>
                                    </div>

                                    {/* Class Info */}
                                    <div className="p-4">
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                                            {cls.description || 'No description'}
                                        </p>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600 font-medium">
                                                0 {t[language].students}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                cls.is_open_enrollment
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {cls.is_open_enrollment ? t[language].openToAll : t[language].codeRequired}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Create Class Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                                {t[language].createClass}
                            </h2>

                            <form onSubmit={handleCreateClass} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t[language].className}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t[language].description}
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        rows="3"
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t[language].startDate}
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                            value={formData.start_date || ''}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t[language].endDate}
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                            value={formData.end_date || ''}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t[language].enrollmentType}
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        value={formData.is_open_enrollment ? 'open' : 'code'}
                                        onChange={(e) => {
                                            const isOpen = e.target.value === 'open';
                                            setFormData({
                                                ...formData,
                                                is_open_enrollment: isOpen
                                            });
                                        }}
                                    >
                                        <option value="open">{t[language].openToAll}</option>
                                        <option value="code">{t[language].codeRequired}</option>
                                    </select>
                                </div>

                                {formData.is_open_enrollment === false && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start space-x-3">
                                            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm text-blue-800">
                                                {t[language].codeWillBeGenerated}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setFormData({});
                                        }}
                                        className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all font-medium border border-gray-300"
                                    >
                                        {t[language].cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm font-medium"
                                    >
                                        {t[language].create}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
