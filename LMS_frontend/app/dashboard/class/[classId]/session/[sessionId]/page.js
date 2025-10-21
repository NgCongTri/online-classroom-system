'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import api from '../../../../../utils/api';
import FaceAttendance from '../../../../../components/FaceAttendance';

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
    const [showFaceAttendance, setShowFaceAttendance] = useState(false);
    const [attendances, setAttendances] = useState([]);
    const [activeTab, setActiveTab] = useState('home');
    const [myAttendance, setMyAttendance] = useState(null);
    
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
            openAttendance: 'Open Attendance',
            closeAttendance: 'Close Attendance',
            attendanceClosed: 'Attendance is CLOSED',
            markAttendance: 'Mark Attendance with Face',
            attendanceNotOpen: 'Attendance has not been opened yet',
            attendanceList: 'Attendance List',
            studentName: 'Student Name',
            joinTime: 'Join Time',
            verified: 'Verified',
            manual: 'Manual',
            faceRecognition: 'Face Recognition',
            noAttendance: 'No one has marked attendance yet',
            home: 'Home',
            markAttendanceTab: 'Mark Attendance',
            alreadyMarked: 'You have already marked attendance',
            markedAt: 'Marked at',
            deleteAttendance: 'Delete',
            confirmDelete: 'Are you sure you want to delete this attendance?',
            sessionInfo: 'Session Information',
            actions: 'Actions',
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
            openAttendance: 'Mở Điểm danh',
            closeAttendance: 'Đóng Điểm danh',
            markAttendance: 'Điểm danh bằng Khuôn mặt',
            attendanceNotOpen: 'Giảng viên chưa mở điểm danh',
            attendanceList: 'Danh sách Điểm danh',
            studentName: 'Tên sinh viên',
            joinTime: 'Thời gian',
            verified: 'Xác thực',
            manual: 'Thủ công',
            faceRecognition: 'Nhận diện khuôn mặt',
            noAttendance: 'Chưa có ai điểm danh',
            home: 'Trang chủ',
            markAttendanceTab: 'Điểm danh',
            alreadyMarked: 'Bạn đã điểm danh',
            markedAt: 'Điểm danh lúc',
            deleteAttendance: 'Xóa',
            confirmDelete: 'Bạn có chắc muốn xóa điểm danh này?',
            sessionInfo: 'Thông tin buổi học',
            actions: 'Thao tác',
        }
    };

    useEffect(() => {
        if (!loading && sessionId && classId) {
            fetchSessionData();
            fetchClassData();
            fetchAttendances();
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

    const fetchAttendances = async () => {
        try {
            const res = await api.get(`/attendances/?session=${sessionId}`);
            setAttendances(res.data || []);
            
            // Check if current user already marked attendance
            if (isStudent && user) {
                const userAttendance = (res.data || []).find(att => att.user?.id === user.id);
                setMyAttendance(userAttendance || null);
            }
        } catch (error) {
            console.error('Error fetching attendances:', error);
        }
    };

    const toggleAttendance = async () => {
        try {
            const newStatus = !sessionData.is_attendance_open;
            const res = await api.post(`/sessions/${sessionId}/toggle-attendance/`, {
                is_open: newStatus
            });
            
            if (res.data.success) {
                setSessionData({ ...sessionData, is_attendance_open: newStatus });
                setMessage(newStatus ? 
                    'Đã mở điểm danh - sinh viên có thể điểm danh' : 
                    'Đã đóng điểm danh'
                );
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error toggling attendance:', error);
            setMessage('Lỗi khi thay đổi trạng thái điểm danh');
        }
    };

    const deleteAttendance = async (attendanceId) => {
        if (!confirm(t[language].confirmDelete)) return;
        
        try {
            await api.delete(`/attendances/${attendanceId}/`);
            setMessage('✅ Đã xóa điểm danh');
            fetchAttendances();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting attendance:', error);
            setMessage('❌ Lỗi khi xóa điểm danh');
        }
    };

    const handleAttendanceSuccess = (data) => {
        console.log('Điểm danh thành công:', data);
        setShowFaceAttendance(false);
        fetchAttendances();
        setMessage(`✅ Điểm danh thành công! Độ chính xác: ${data.confidence?.toFixed(1)}%`);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleAttendanceError = (error) => {
        console.error('Lỗi điểm danh:', error);
        setMessage(`❌ Lỗi: ${error}`);
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
            {/* Compact Session Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{sessionData.topic}</h2>
                                <p className="text-white/80 text-sm">{classData.name}</p>
                            </div>
                        </div>
                        
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
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('home')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'home'
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {t[language].home}
                        </button>
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'attendance'
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {t[language].markAttendanceTab}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        message.includes('Error') || message.includes('❌')
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-green-50 text-green-600 border border-green-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span>{message}</span>
                            <button onClick={() => setMessage('')} className="text-xl">&times;</button>
                        </div>
                    </div>
                )}

                {/* Tab Content */}
                {activeTab === 'home' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Session Info */}
                        <div className="lg:col-span-2 space-y-6">                         
                            {/* Materials Section */}
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
                        

                            {/* Lecturer/Admin can upload materials */}
                            {(isLecturer || isAdmin) && (
                                <div className="mt-4" >
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t[language].uploadMaterials}
                                    </label>                                
                                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md mt-2">
                                        Upload Material
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Class Info */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {t[language].classInfo}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[16px] font-medium text-gray-700 mb-1">
                                            {t[language].topic}
                                        </label>
                                        <p className="text-gray-900 text-[15px]">{sessionData.topic}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[16px] font-medium text-gray-700 mb-1">
                                            {t[language].date}
                                        </label>
                                        <p className="text-gray-900">
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
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="space-y-6">
                        {/* Lecturer/Admin Controls */}
                        {(isLecturer || isAdmin) && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {t[language].attendance}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {sessionData.is_attendance_open 
                                                ? 'Sinh viên có thể điểm danh' 
                                                : 'Sinh viên không thể điểm danh'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">                                
                                        <button
                                            onClick={toggleAttendance}
                                            className={`px-2 py-1.5 rounded-lg text-[16px] transition-all ${
                                                sessionData.is_attendance_open
                                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                        >
                                            {sessionData.is_attendance_open 
                                                ? t[language].closeAttendance 
                                                : t[language].openAttendance}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Student Attendance UI */}
                        {isStudent && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {myAttendance ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {t[language].alreadyMarked}
                                        </h3>
                                        <p className="text-gray-600">
                                            {t[language].markedAt}: {new Date(myAttendance.joined_time).toLocaleString('vi-VN')}
                                        </p>
                                        {myAttendance.is_verified && (
                                            <span className="inline-block mt-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                {t[language].faceRecognition}
                                            </span>
                                        )}
                                    </div>
                                ) : sessionData.is_attendance_open ? (
                                    !showFaceAttendance ? (
                                        <button
                                            onClick={() => setShowFaceAttendance(true)}
                                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {t[language].markAttendance}
                                        </button>
                                    ) : (
                                        <FaceAttendance
                                            sessionId={parseInt(sessionId)}
                                            onSuccess={handleAttendanceSuccess}
                                            onError={handleAttendanceError}
                                        />
                                    )
                                ) : (
                                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <p className="text-lg font-medium">{t[language].attendanceNotOpen}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Attendance List (For Lecturer/Admin) */}
                        {(isLecturer || isAdmin) && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                    {t[language].attendanceList} ({attendances.length})
                                </h4>
                                
                                {attendances.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="text-left p-3 font-semibold text-gray-700 text-sm">STT</th>
                                                    <th className="text-left p-3 font-semibold text-gray-700 text-sm">{t[language].studentName}</th>
                                                    <th className="text-left p-3 font-semibold text-gray-700 text-sm">{t[language].joinTime}</th>
                                                    <th className="text-left p-3 font-semibold text-gray-700 text-sm">{t[language].verified}</th>
                                                    <th className="text-center p-3 font-semibold text-gray-700 text-sm">{t[language].actions}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendances.map((att, index) => (
                                                    <tr key={att.id} className="border-b hover:bg-gray-50 transition-colors">
                                                        <td className="p-3 text-gray-600">{index + 1}</td>
                                                        <td className="p-3">
                                                            <div className="font-medium text-gray-900">{att.user?.username || 'N/A'}</div>
                                                            <div className="text-sm text-gray-500">{att.user?.email || ''}</div>
                                                        </td>
                                                        <td className="p-3 text-gray-600">
                                                            {new Date(att.joined_time).toLocaleString('vi-VN')}
                                                        </td>
                                                        <td className="p-3">
                                                            {att.is_verified ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                    </svg>
                                                                    {t[language].faceRecognition}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                                    {t[language].manual}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button
                                                                onClick={() => deleteAttendance(att.id)}
                                                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-sm font-medium transition-colors"
                                                            >
                                                                {t[language].deleteAttendance}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-lg font-medium">{t[language].noAttendance}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
