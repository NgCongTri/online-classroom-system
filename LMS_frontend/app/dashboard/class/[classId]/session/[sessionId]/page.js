'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import api from '../../../../../utils/api';

export default function SessionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const classId = params.classId;
    const sessionId = params.sessionId;
    const { user, loading } = useAuth();
    
    const [sessionData, setSessionData] = useState(null);
    const [classData, setClassData] = useState(null);
    const [language, setLanguage] = useState('vi');
    const [message, setMessage] = useState('');
    
    const isLecturer = user?.role === 'lecturer';
    const isStudent = user?.role === 'student';
    const isAdmin = user?.role === 'admin';

    const t = {
        en: {
            backToClass: 'Back to Class',
            sessionDetails: 'Session Details',
            topic: 'Topic',
            date: 'Date & Time',
            loading: 'Loading...',
            notFound: 'Session not found',
            classInfo: 'Class Information',
            className: 'Class Name',
            lecturer: 'Lecturer',
            classCode: 'Class Code',
            attendance: 'Attendance',
            materials: 'Materials',
            comingSoon: 'Feature coming soon',
            attendanceComingSoon: 'Attendance feature coming soon',
            noMaterials: 'No materials yet',
        },
        vi: {
            backToClass: 'Quay lại Lớp học',
            sessionDetails: 'Chi tiết buổi học',
            topic: 'Chủ đề',
            date: 'Ngày giờ',
            loading: 'Đang tải...',
            notFound: 'Không tìm thấy buổi học',
            classInfo: 'Thông tin lớp học',
            className: 'Tên lớp',
            lecturer: 'Giảng viên',
            classCode: 'Mã lớp',
            attendance: 'Điểm danh',
            materials: 'Tài liệu',
            comingSoon: 'Tính năng sẽ sớm được cập nhật',
            attendanceComingSoon: 'Chức năng điểm danh sẽ sớm được cập nhật',
            noMaterials: 'Chưa có tài liệu',
        }
    };

    useEffect(() => {
        if (!loading && sessionId && classId) {
            fetchSessionData();
            fetchClassData();
        }
    }, [loading, sessionId, classId]);

    const fetchSessionData = async () => {
        try {
            const res = await api.get(`/sessions/${sessionId}/`);
            setSessionData(res.data);
        } catch (error) {
            console.error('Error fetching session:', error);
            setMessage('Error loading session data');
        }
    };

    const fetchClassData = async () => {
        try {
            const res = await api.get(`/classes/${classId}/`);
            setClassData(res.data);
        } catch (error) {
            console.error('Error fetching class:', error);
        }
    };

    if (loading || !sessionData || !classData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">{t[language].loading}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Session Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-end mb-4">                                               
                        {/* Language Switcher */}
                        <div className="flex bg-white/20 backdrop-blur-sm rounded-lg p-1">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                                    language === 'en' 
                                        ? 'bg-white text-purple-600 shadow-sm' 
                                        : 'text-white hover:bg-white/10'
                                }`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('vi')}
                                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                                    language === 'vi' 
                                        ? 'bg-white text-purple-600 shadow-sm' 
                                        : 'text-white hover:bg-white/10'
                                }`}
                            >
                                VI
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-2">{sessionData.topic}</h2>
                            <p className="text-white/90">
                                {new Date(sessionData.date).toLocaleString('vi-VN', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Session Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {t[language].sessionDetails}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t[language].topic}
                                    </label>
                                    <p className="text-gray-900 text-lg">{sessionData.topic}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t[language].date}
                                    </label>
                                    <p className="text-gray-900">
                                        {new Date(sessionData.date).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Section - Coming Soon */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {t[language].attendance}
                            </h3>
                            <div className="text-center py-8 text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p>{t[language].attendanceComingSoon}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Additional Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {t[language].classInfo}
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">{t[language].className}</p>
                                    <p className="font-medium text-gray-900">{classData.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t[language].lecturer}</p>
                                    <p className="font-medium text-gray-900">{classData.lecturer_name}</p>
                                </div>
                                {classData.class_code && (
                                    <div>
                                        <p className="text-sm text-gray-600">{t[language].classCode}</p>
                                        <p className="font-mono font-semibold text-gray-900">{classData.class_code}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Materials Section - Coming Soon */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {t[language].materials}
                            </h3>
                            <div className="text-center py-8 text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <p>{t[language].noMaterials}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
