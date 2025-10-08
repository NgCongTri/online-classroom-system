'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../utils/api';

export default function ClassDetailPage() {
    const router = useRouter();
    const params = useParams();
    const classId = params.classId;
    const { user, loading } = useAuth();
    
    const [classData, setClassData] = useState(null);
    const [activeTab, setActiveTab] = useState('course'); 
    const [language, setLanguage] = useState('en'); 
    const [students, setStudents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
    const [sessionForm, setSessionForm] = useState({ topic: '', date: '' });
    const [message, setMessage] = useState('');
    
    const isLecturer = user?.role === 'lecturer';
    const isStudent = user?.role === 'student';
    const isAdmin = user?.role === 'admin';
    const canEdit = isLecturer || isAdmin;
    const canPost = isLecturer || isAdmin;

    // Translations - Đã sửa toàn bộ
    const t = {
        en: {
            backToClasses: 'Back to Classes',
            membersList: 'Members List',
            members: 'Members',
            activities: 'Activities',
            grades: 'Grades',
            classCode: 'Class Code',
            announcements: 'Announcements',
            createAnnouncement: 'Create Announcement',
            noAnnouncements: 'No announcements yet',
            students: 'Students',
            lecturer: 'Lecturer',
            title: 'Title',
            content: 'Content',
            post: 'Post',
            cancel: 'Cancel',
            loading: 'Loading...',
            enrolled: 'Enrolled',
            remove: 'Remove',
            invite: 'Invite Students',
            course: 'Course',
            sessions: 'Sessions',
            noSessions: 'No sessions yet',
            createSession: 'Create Session',
            topic: 'Topic',
            date: 'Date & Time',
            viewDetails: 'View Details',
            group: 'Group',
            noStudentsYet: 'No students enrolled yet',
            gradesComingSoon: 'Grades feature coming soon',
            activitiesComingSoon: 'Activities feature coming soon',
        },
        vi: {
            backToClasses: 'Quay lại Lớp học',
            membersList: 'Danh sách thành viên',
            members: 'Thành viên',
            activities: 'Hoạt động',
            grades: 'Điểm số',
            classCode: 'Mã lớp',
            announcements: 'Thông báo',
            createAnnouncement: 'Tạo Thông báo',
            noAnnouncements: 'Chưa có thông báo',
            students: 'Học sinh',
            lecturer: 'Giảng viên',
            title: 'Tiêu đề',
            content: 'Nội dung',
            post: 'Đăng',
            cancel: 'Hủy',
            loading: 'Đang tải...',
            enrolled: 'Đã tham gia',
            remove: 'Xóa',
            invite: 'Mời học sinh',
            course: 'Khóa học',
            sessions: 'Các buổi học',
            noSessions: 'Chưa có buổi học nào',
            createSession: 'Tạo buổi học',
            topic: 'Chủ đề',
            date: 'Ngày giờ',
            viewDetails: 'Xem chi tiết',
            group: 'Nhóm',
            noStudentsYet: 'Chưa có học sinh nào',
            gradesComingSoon: 'Tính năng điểm số sẽ sớm được cập nhật',
            activitiesComingSoon: 'Tính năng hoạt động sẽ sớm được cập nhật',
        }
    };

    useEffect(() => {
        if (!loading && classId) {
            fetchClassData();
            fetchStudents();
            fetchAnnouncements();
            fetchSessions();
        }
    }, [loading, classId]);

    const fetchClassData = async () => {
        try {
            const res = await api.get(`/classes/${classId}/`);
            setClassData(res.data);
        } catch (error) {
            console.error('Error fetching class:', error);
            router.push(isLecturer ? '/dashboard/lecturer' : '/dashboard/student');
        }
    };

    const fetchStudents = async () => {
        try {            
            const res = await api.get(`/class-memberships/?class_id=${classId}`);
            console.log('📥 Students response:', res.data);
            setStudents(res.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchAnnouncements = async () => {
        try {            
            const res = await api.get(`/announcements/class/${classId}/`);
            console.log('📥 Announcements response:', res.data);
            setAnnouncements(res.data);
        } 
        catch (error) {
            console.error('Error fetching announcements:', error);
            
            if (error.response?.status === 404) {
                console.warn('Announcements endpoint not found, setting empty array');
                setAnnouncements([]);
            }
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await api.get(`/sessions/?class_id=${classId}`);
            console.log('📥 Sessions response:', res.data);
            setSessions(res.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            setSessions([]);
        }
    };

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        try {           
            await api.post(`/announcements/class/${classId}/`, {
                title: announcementForm.title,
                content: announcementForm.content,                
            });
            setMessage('✅ ' + (language === 'vi' ? 'Đã đăng thông báo thành công!' : 'Announcement posted successfully!'));
            setShowAnnouncementModal(false);
            setAnnouncementForm({ title: '', content: '' });
            fetchAnnouncements();
        } catch (error) {
            console.error('Error posting announcement:', error.response?.data);
            setMessage('❌ ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        try {
            await api.post('/sessions/', {
                class_id: classId,
                topic: sessionForm.topic,
                date: sessionForm.date,
            });
            setMessage('✅ ' + (language === 'vi' ? 'Đã tạo buổi học thành công!' : 'Session created successfully!'));
            setShowSessionModal(false);
            setSessionForm({ topic: '', date: '' });
            fetchSessions();
        } catch (error) {
            console.error('Error creating session:', error.response?.data);
            setMessage('❌ ' + (error.response?.data?.detail || error.message));
        }
    };

    const getClassCoverColor = () => {
        const colors = [
            'from-blue-500 to-blue-600',
            'from-green-500 to-green-600',
            'from-purple-500 to-purple-600',
            'from-orange-500 to-orange-600',
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    if (loading || !classData) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-600">{t[language].loading}</div>
            </div>
        );
    }

    const tabs = [
        { id: 'course', name: t[language].course, icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
        )},        
        { id: 'member_list', name: t[language].membersList, icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        )},
        { id: 'grades', name: t[language].grades, icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        )},
        { id: 'activities', name: t[language].activities, icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        )},
    ];


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Class Cover */}
            <div className={`bg-gradient-to-r ${getClassCoverColor()} text-white`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-end mb-4">
                        {/* Language Switcher */}
                        <div className="flex bg-white/20 backdrop-blur-sm rounded-lg p-1">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                                    language === 'en' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-white hover:bg-white/10'
                                }`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('vi')}
                                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                                    language === 'vi' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-white hover:bg-white/10'
                                }`}
                            >
                                VI
                            </button>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold">{classData.name}</h1>
                    <p className="text-white/90 mt-2">{classData.description}</p>
                    {classData.class_code && (
                        <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                            <span className="text-sm">{t[language].classCode}: </span>
                            <span className="font-mono font-semibold">{classData.class_code}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        message.includes('❌')
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-green-50 text-green-600 border border-green-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span>{message}</span>
                            <button onClick={() => setMessage('')} className="text-xl">&times;</button>
                        </div>
                    </div>
                )}

                {/* Course Tab */}
                {activeTab === 'course' && (
                    <div className="space-y-6">
                        {canPost && (
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <button
                                    onClick={() => setShowAnnouncementModal(true)}
                                    className="w-full text-left px-4 py-3 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    {t[language].createAnnouncement}
                                </button>
                            </div>
                        )}

                        {/* Announcements Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900">{t[language].announcements}</h2>
                            {announcements.length === 0 ? (
                                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                    <p className="text-gray-500">{t[language].noAnnouncements}</p>
                                </div>
                            ) : (
                                announcements.map((announcement) => (
                                    <div key={announcement.id} className="bg-white rounded-lg border border-gray-200 p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                {announcement.posted_by_name?.charAt(0).toUpperCase() || 'L'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{announcement.posted_by_name}</h3>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(announcement.posted_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <h4 className="font-semibold text-lg mb-2">{announcement.title}</h4>
                                                <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Sessions Section */}
                        <div className="space-y-4 mt-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">{t[language].sessions}</h2>
                                {canPost && (
                                    <button
                                        onClick={() => setShowSessionModal(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        {t[language].createSession}
                                    </button>
                                )}
                            </div>

                            {sessions.length === 0 ? (
                                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-500">{t[language].noSessions}</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {sessions.map((session, index) => (
                                        <div 
                                            key={session.id} 
                                            className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                                            onClick={() => router.push(`/dashboard/class/${classId}/session/${session.id}`)}
                                        >
                                            <div className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start space-x-4 flex-1">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                                {session.topic}
                                                            </h3>
                                                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                                                                <div className="flex items-center space-x-1">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span>{new Date(session.date).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* members Tab */}
                {activeTab === 'member_list' && (
                    <div className="space-y-6">
                        {/* Lecturer */}
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">{t[language].lecturer}</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                        {classData.lecturer_name?.charAt(0).toUpperCase() || 'L'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{classData.lecturer_name || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Students */}
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t[language].students} ({students.length})
                                </h3>
                                {canEdit && (
                                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                        {t[language].invite}
                                    </button>
                                )}
                            </div>
                            <div className="divide-y divide-gray-200">
                                {students.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        {t[language].noStudentsYet}
                                    </div>
                                    ) : (
                                    students.map((membership) => (
                                        <div key={membership.id} className="p-6 flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {membership.user_name?.charAt(0).toUpperCase() || 'S'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{membership.user_name || 'Unknown'}</p>
                                                    <p className="text-sm text-gray-500">{membership.user_email}</p>
                                                    <p className="text-xs text-gray-400 capitalize">{membership.role}</p>
                                                </div>
                                            </div>
                                            {canEdit && (
                                                <button className="text-sm text-red-600 hover:text-red-700">
                                                    {t[language].remove}
                                                </button>
                                            )}
                                        </div>
                                    ))                            
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Grades Tab */}
                {activeTab === 'grades' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-gray-500">{t[language].gradesComingSoon}</p>
                    </div>
                )}

                {/* activities Tab */}
                {activeTab === 'activities' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500">{t[language].activitiesComingSoon}</p>
                    </div>
                )}
            </main>

            {/* Create Announcement Modal */}
            {showAnnouncementModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                {t[language].createAnnouncement}
                            </h2>

                            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t[language].title}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={announcementForm.title}
                                        onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t[language].content}
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="6"
                                        value={announcementForm.content}
                                        onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAnnouncementModal(false);
                                            setAnnouncementForm({ title: '', content: '' });
                                        }}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        {t[language].cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {t[language].post}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Session Modal */}
            {showSessionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            {t[language].createSession}
                        </h2>

                        <form onSubmit={handleCreateSession} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t[language].topic}
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={sessionForm.topic}
                                    onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                                    required
                                    placeholder={language === 'vi' ? "Nhập tên giáo viên hướng dẫn" : "Enter instructor name"}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t[language].date}
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={sessionForm.date}
                                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSessionModal(false);
                                        setSessionForm({ topic: '', date: '' });
                                    }}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {t[language].cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {t[language].post}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
