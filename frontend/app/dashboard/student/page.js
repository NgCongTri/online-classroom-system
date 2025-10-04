'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';

export default function StudentDashboard() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    
    const [classes, setClasses] = useState([]);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [language, setLanguage] = useState('en');
    const [message, setMessage] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    // Translations
    const t = {
        en: {
            logo_name: 'OCS',
            myClasses: 'My Classes',
            joinClass: 'Join Class',
            noClasses: 'No classes yet',
            startLearning: 'Start learning by joining a class',
            viewClass: 'View Class',
            enterClassCode: 'Enter class code',
            join: 'Join',
            cancel: 'Cancel',
            logout: 'Logout',
            loading: 'Loading...',
            gridView: 'Grid View',
            listView: 'List View',
            lecturer: 'Lecturer',
        },
        vi: {
            logo_name: 'OCS',
            myClasses: 'Lớp Của Tôi',
            joinClass: 'Tham Gia Lớp',
            noClasses: 'Chưa tham gia lớp nào',
            startLearning: 'Bắt đầu học bằng cách tham gia lớp',
            viewClass: 'Xem Lớp',
            enterClassCode: 'Nhập mã lớp học',
            join: 'Tham Gia',
            cancel: 'Hủy',
            logout: 'Đăng Xuất',
            loading: 'Đang tải...',
            gridView: 'Dạng Lưới',
            listView: 'Dạng Danh Sách',
            lecturer: 'Giảng viên',
        }
    };

    useEffect(() => {
        if (!loading && user?.role !== 'student') {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user?.role === 'student') {
            fetchClasses();
        }
    }, [user]);

    const fetchClasses = async () => {
        try {
            // Get classes where student is enrolled
            const res = await api.get('/class-memberships/');
            const enrolledClasses = res.data
                .filter(membership => membership.student === user.id)
                .map(membership => membership.class_data);
            setClasses(enrolledClasses);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleJoinClass = async (e) => {
        e.preventDefault();
        try {
            // TODO: Implement join class API
            await api.post('/class-memberships/', {
                class_code: joinCode,
                student: user.id
            });
            setMessage('Joined class successfully!');
            setShowJoinModal(false);
            setJoinCode('');
            fetchClasses();
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Error joining class');
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
                                        ? 'bg-[#0099ff] text-white' 
                                        : 'text-[#a0a0b0] hover:text-white'
                                }`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('vi')}
                                className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                                    language === 'vi' 
                                        ? 'bg-[#0099ff] text-white' 
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
                                className="flex items-center space-x-3 px-4 py-2 bg-[#1a1a25] border border-[#2a2a35] rounded-lg hover:border-[#0099ff]/30 transition-all"
                            >
                                <div className="w-8 h-8 bg-gradient-to-r from-[#0099ff] to-[#00ff88] rounded-full flex items-center justify-center font-semibold text-white">
                                    {user?.username?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                <span className="text-sm font-medium text-white">{user?.username || 'Student'}</span>
                                <svg className={`w-4 h-4 transition-transform text-white ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a25] border border-[#2a2a35] rounded-lg shadow-lg z-50">
                                    <div className="py-2">
                                        <div className="px-4 py-2 border-b border-[#2a2a35]">
                                            <p className="text-sm font-medium text-white">{user?.email}</p>
                                            <p className="text-xs text-[#a0a0b0]">Student</p>
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
                        onClick={() => setShowJoinModal(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-[#0099ff] text-white rounded-lg hover:bg-[#0088ee] transition-all shadow-lg shadow-[#0099ff]/30 font-semibold"
                        style={{ fontFamily: 'Georgia, serif' }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>{t[language].joinClass}</span>
                    </button>

                    {/* View Toggle */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${
                                viewMode === 'grid'
                                    ? 'bg-[#0099ff]/10 text-[#0099ff] shadow-md'
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
                                    ? 'bg-[#0099ff]/10 text-[#0099ff] shadow-md'
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
                        <p className="text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>{t[language].startLearning}</p>
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
                                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:border-[#0099ff]/30 transition-all cursor-pointer group"
                            >
                                {/* Class Cover */}
                                <div className={`h-24 bg-gradient-to-r ${getClassCoverColor(index)} p-4 group-hover:opacity-90 transition-opacity`}>
                                    <h3 className="text-white text-xl font-bold truncate" style={{ fontFamily: 'Georgia, serif' }}>{cls.name}</h3>
                                    <p className="text-white/80 text-sm truncate" style={{ fontFamily: 'Georgia, serif' }}>
                                        {t[language].lecturer}: {cls.lecturer_name || 'Unknown'}
                                    </p>
                                </div>

                                {/* Class Info */}
                                <div className="p-4">
                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2" style={{ fontFamily: 'Georgia, serif' }}>
                                        {cls.description || 'No description'}
                                    </p>
                                    
                                    <div className="text-sm text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
                                        {cls.start_date} - {cls.end_date}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Join Class Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                            {t[language].joinClass}
                        </h2>

                        <form onSubmit={handleJoinClass} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                    {t[language].enterClassCode}
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099ff] focus:border-transparent transition-all font-mono"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    placeholder="e.g., ABC123"
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowJoinModal(false);
                                        setJoinCode('');
                                    }}
                                    className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all font-semibold border border-gray-300"
                                    style={{ fontFamily: 'Georgia, serif' }}
                                >
                                    {t[language].cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#0099ff] text-white rounded-lg hover:bg-[#0088ee] transition-all shadow-lg shadow-[#0099ff]/30 font-bold"
                                    style={{ fontFamily: 'Georgia, serif' }}
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
