'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';

export default function LecturerDashboard() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    
    const [classes, setClasses] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [language, setLanguage] = useState('en');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({});
    const [viewMode, setViewMode] = useState('grid'); // grid or list

    // Translations
    const t = {
        en: {
            logo_name: 'OCS',
            myClasses: 'My Classes',
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
            create: 'Create',
            cancel: 'Cancel',
            logout: 'Logout',
            loading: 'Loading...',
            gridView: 'Grid View',
            listView: 'List View',
        },
        vi: {
            logo_name: 'OCS',
            myClasses: 'Lớp Của Tôi',
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
            // Filter only classes created by this lecturer
            const lecturerClasses = res.data.filter(cls => cls.lecturer === user.id || cls.created_by === user.id);
            setClasses(lecturerClasses);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            await api.post('/classes/', {
                ...formData,
                lecturer: user.id,
                created_by: user.id
            });
            setMessage('Class created successfully!');
            setShowCreateModal(false);
            setFormData({});
            fetchClasses();
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Error creating class');
        }
    };

    const getClassCoverColor = (index) => {
        const colors = [
            'from-blue-500 to-blue-600',
            'from-green-500 to-green-600',
            'from-purple-500 to-purple-600',
            'from-orange-500 to-orange-600',
            'from-pink-500 to-pink-600',
            'from-indigo-500 to-indigo-600',
        ];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-600">{t[language].loading}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-[#151520] border-b border-[#2a2a35] px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00ff88] to-[#0099ff] bg-clip-text text-transparent font-georgia">
                            {t[language].logo_name}
                        </h1>
                        <p className="text-white font-georgia">{t[language].myClasses}</p>
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
                                    {user?.username?.charAt(0).toUpperCase() || 'L'}
                                </div>
                                <span className="text-sm font-medium text-white">{user?.username || 'Lecturer'}</span>
                                <svg className={`w-4 h-4 transition-transform text-white ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a25] border border-[#2a2a35] rounded-lg shadow-lg z-50">
                                    <div className="py-2">
                                        <div className="px-4 py-2 border-b border-[#2a2a35]">
                                            <p className="text-sm font-medium text-white">{user?.email}</p>
                                            <p className="text-xs text-[#a0a0b0]">Lecturer</p>
                                        </div>
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

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        message.includes('Error') || message.includes('error')
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-green-50 text-green-600 border border-green-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span>{message}</span>
                            <button onClick={() => setMessage('')} className="text-xl">&times;</button>
                        </div>
                    </div>
                )}

                {/* Action Bar */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => {
                            setShowCreateModal(true);
                            setFormData({
                                enrollment_type: 'open',
                                is_open_enrollment: true,
                                class_code: ''
                            });
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-[#00ff88] text-[#0a0a0f] rounded-lg hover:bg-[#00dd77] transition-all shadow-lg shadow-[#00ff88]/30 font-semibold"
                        style={{ fontFamily: 'Georgia, serif' }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>{t[language].createClass}</span>
                    </button>

                    {/* View Toggle */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${
                                viewMode === 'grid'
                                    ? 'bg-[#00ff88]/10 text-[#00ff88] shadow-md'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                            title={t[language].gridView}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${
                                viewMode === 'list'
                                    ? 'bg-[#00ff88]/10 text-[#00ff88] shadow-md'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
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
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>{t[language].noClasses}</h3>
                        <p className="text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>{t[language].startTeaching}</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                    }>
                        {classes.map((cls, index) => (
                            <div
                                key={cls.id}
                                onClick={() => router.push(`/dashboard/class/${cls.id}`)}
                                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:border-[#00ff88]/30 transition-all cursor-pointer group"
                            >
                                {/* Class Cover */}
                                <div className={`h-24 bg-gradient-to-r ${getClassCoverColor(index)} p-4 group-hover:opacity-90 transition-opacity`}>
                                    <h3 className="text-white text-xl font-bold truncate" style={{ fontFamily: 'Georgia, serif' }}>{cls.name}</h3>
                                    <p className="text-white/80 text-sm truncate font-mono">{cls.class_code || 'No code'}</p>
                                </div>

                                {/* Class Info */}
                                <div className="p-4">
                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2" style={{ fontFamily: 'Georgia, serif' }}>
                                        {cls.description || 'No description'}
                                    </p>
                                    
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
                                            {/* TODO: Get actual student count */}
                                            0 {t[language].students}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            cls.is_open_enrollment
                                                ? 'bg-[#00ff88]/10 text-[#00ff88]'
                                                : 'bg-[#0099ff]/10 text-[#0099ff]'
                                        }`} style={{ fontFamily: 'Georgia, serif' }}>
                                            {cls.is_open_enrollment ? t[language].openToAll : t[language].codeRequired}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Class Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                                {t[language].createClass}
                            </h2>

                            <form onSubmit={handleCreateClass} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                        {t[language].className}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ff88] focus:border-transparent transition-all"
                                        style={{ fontFamily: 'Georgia, serif' }}
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                        {t[language].description}
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ff88] focus:border-transparent transition-all"
                                        style={{ fontFamily: 'Georgia, serif' }}
                                        rows="3"
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                            {t[language].startDate}
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ff88] focus:border-transparent transition-all"
                                            style={{ fontFamily: 'Georgia, serif' }}
                                            value={formData.start_date || ''}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                            {t[language].endDate}
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ff88] focus:border-transparent transition-all"
                                            style={{ fontFamily: 'Georgia, serif' }}
                                            value={formData.end_date || ''}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                        {t[language].enrollmentType}
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ff88] focus:border-transparent transition-all"
                                        style={{ fontFamily: 'Georgia, serif' }}
                                        value={formData.enrollment_type || 'open'}
                                        onChange={(e) => {
                                            const enrollmentType = e.target.value;
                                            setFormData({
                                                ...formData,
                                                enrollment_type: enrollmentType,
                                                is_open_enrollment: enrollmentType === 'open',
                                                class_code: enrollmentType === 'open' ? '' : formData.class_code
                                            });
                                        }}
                                    >
                                        <option value="open">{t[language].openToAll}</option>
                                        <option value="code_required">{t[language].codeRequired}</option>
                                    </select>
                                </div>

                                {formData.enrollment_type === 'code_required' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                            {t[language].classCode} *
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ff88] focus:border-transparent transition-all font-mono"
                                            value={formData.class_code || ''}
                                            onChange={(e) => setFormData({ ...formData, class_code: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setFormData({});
                                        }}
                                        className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all font-semibold border border-gray-300"
                                        style={{ fontFamily: 'Georgia, serif' }}
                                    >
                                        {t[language].cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-[#00ff88] text-[#0a0a0f] rounded-lg hover:bg-[#00dd77] transition-all shadow-lg shadow-[#00ff88]/30 font-bold"
                                        style={{ fontFamily: 'Georgia, serif' }}
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
