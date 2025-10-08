'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';

export default function StudentDashboard() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    
    const [enrolledClasses, setEnrolledClasses] = useState([]);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [activeTab, setActiveTab] = useState('enrolled'); // 'enrolled' or 'available'
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
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
            availableClasses: 'Available Classes',
            enrolledClasses: 'Enrolled Classes',
            noClasses: 'No classes yet',
            noAvailableClasses: 'No available classes',
            startLearning: 'Start learning by joining a class',
            enrollMe: 'Enroll Me',
            enterCode: 'Enter Code',
            enterClassCode: 'Enter class code to join',
            join: 'Join',
            cancel: 'Cancel',
            logout: 'Logout',
            loading: 'Loading...',
            gridView: 'Grid View',
            listView: 'List View',
            lecturer: 'Lecturer',
            openEnrollment: 'Open Enrollment',
            codeRequired: 'Code Required',
            alreadyEnrolled: 'Already Enrolled',
        },
        vi: {
            logo_name: 'OCS',
            myClasses: 'Lớp Của Tôi',
            availableClasses: 'Lớp Có Sẵn',
            enrolledClasses: 'Lớp Đã Tham Gia',
            noClasses: 'Chưa tham gia lớp nào',
            noAvailableClasses: 'Không có lớp nào',
            startLearning: 'Bắt đầu học bằng cách tham gia lớp',
            enrollMe: 'Ghi Danh Tôi',
            enterCode: 'Nhập Mã',
            enterClassCode: 'Nhập mã lớp để tham gia',
            join: 'Tham Gia',
            cancel: 'Hủy',
            logout: 'Đăng Xuất',
            loading: 'Đang tải...',
            gridView: 'Dạng Lưới',
            listView: 'Dạng Danh Sách',
            lecturer: 'Giảng viên',
            openEnrollment: 'Mở Tự Do',
            codeRequired: 'Yêu Cầu Mã',
            alreadyEnrolled: 'Đã Tham Gia',
        }
    };

    useEffect(() => {
        if (!loading && user?.role !== 'student') {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user?.role === 'student') {
            fetchEnrolledClasses();
            fetchAvailableClasses();
        }
    }, [user]);

    const fetchEnrolledClasses = async () => {
        try {
            const res = await api.get('/class-memberships/');
            const myClasses = res.data
                .filter(membership => membership.user === user.id)
                .map(membership => ({
                    ...membership.class_id,
                    membership_id: membership.id
                }));
            setEnrolledClasses(myClasses);
        } catch (error) {
            console.error('Error fetching enrolled classes:', error);
        }
    };

    const fetchAvailableClasses = async () => {
        try {
            const res = await api.get('/classes/available/');
            setAvailableClasses(res.data);
        } catch (error) {
            console.error('Error fetching available classes:', error);
        }
    };

    const handleJoinOpenClass = async (classId) => {
        try {
            await api.post(`/classes/${classId}/join/`);
            setMessage('✅ Successfully enrolled in class!');
            await fetchEnrolledClasses();
            await fetchAvailableClasses();
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
            await fetchEnrolledClasses();
            await fetchAvailableClasses();
            setActiveTab('enrolled'); 
        } catch (error) {
            setMessage('❌ ' + (error.response?.data?.detail || 'Error joining class'));
        }
    };

    const getClassCoverColor = (index) => {
        const colors = [
            'from-blue-600 to-blue-700',
            'from-green-600 to-green-700',
            'from-purple-600 to-purple-700',
            'from-orange-600 to-orange-700',
            'from-pink-600 to-pink-700',
            'from-indigo-600 to-indigo-700',
        ];
        return colors[index % colors.length];
    };

    const ClassCard = ({ cls, index, isEnrolled }) => {
        const gradientColor = getClassCoverColor(index);
        const borderColor = gradientColor.includes('blue') ? 'border-blue-200' :
                           gradientColor.includes('green') ? 'border-green-200' :
                           gradientColor.includes('purple') ? 'border-purple-200' :
                           gradientColor.includes('orange') ? 'border-orange-200' :
                           gradientColor.includes('pink') ? 'border-pink-200' :
                           'border-indigo-200';
        
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
                <div className="text-gray-600 text-lg">{t[language].loading}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-gray-800">
                            {t[language].myClasses}
                        </h1>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {/* Language Switcher */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                                    language === 'en' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('vi')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                                    language === 'vi' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
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
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-semibold text-white text-sm">
                                    {user?.username?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{user?.username || 'Student'}</span>
                                <svg className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="py-2">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                                            <p className="text-xs text-gray-500 mt-1">Student</p>
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
                        message.includes('❌')
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

            {/* Tabs and View Toggle */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center">
                        <div className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('enrolled')}
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'enrolled'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {t[language].enrolledClasses} ({enrolledClasses.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('available')}
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'available'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {t[language].availableClasses} ({availableClasses.length})
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white text-blue-600 shadow-sm'
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
                                        ? 'bg-white text-blue-600 shadow-sm'
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
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Enrolled Classes Tab */}
                {activeTab === 'enrolled' && (
                    <>
                        {enrolledClasses.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t[language].noClasses}</h3>
                                <p className="text-gray-600">{t[language].startLearning}</p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' 
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'
                                : 'space-y-4'
                            }>
                                {enrolledClasses.map((cls, index) => (
                                    <ClassCard key={cls.id} cls={cls} index={index} isEnrolled={true} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Available Classes Tab */}
                {activeTab === 'available' && (
                    <>
                        {availableClasses.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t[language].noAvailableClasses}</h3>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' 
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'
                                : 'space-y-4'
                            }>
                                {availableClasses.map((cls, index) => (
                                    <ClassCard key={cls.id} cls={cls} index={index} isEnrolled={false} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Join with Code Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            {selectedClass?.name}
                        </h2>
                        <p className="text-sm text-gray-600 mb-6">
                            {t[language].enterClassCode}
                        </p>

                        <form onSubmit={handleJoinWithCode} className="space-y-5">
                            <div>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-lg"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    placeholder="ABC123"
                                    required
                                />
                            </div>

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
