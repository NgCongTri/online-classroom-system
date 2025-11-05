'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from '../../../hooks/useTranslation';
import api from '../../../utils/api';
import { getClassColor } from '../../../utils/class_color';
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import AnnouncementList from '../../../components/class/AnnouncementList';
import SessionList from '../../../components/class/SessionList';
import MemberList from '../../../components/class/MemberList';
import MaterialList from '../../../components/class/MaterialList';
import LoadingScreen from '../../../components/common/LoadingScreen';
import Message from '../../../components/common/Message';

export default function ClassDetailPage() {
    const router = useRouter();
    const params = useParams();
    const classId = params.classId;
    const { user, loading: authLoading } = useAuth();
    const { t, language } = useTranslation();
    
    const [classData, setClassData] = useState(null);
    const [activeTab, setActiveTab] = useState('course');
    const [students, setStudents] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    
    const isLecturer = user?.role === 'lecturer';
    const isStudent = user?.role === 'student';
    const isAdmin = user?.role === 'admin';
    const canEdit = isLecturer || isAdmin;
    const canPost = isLecturer || isAdmin;

    useEffect(() => {
        if (classId && !authLoading) {
            fetchClassData();
        }
    }, [classId, authLoading]);

    const fetchClassData = async () => {
        setLoading(true);
        try {
            const classRes = await api.get(`/classes/${classId}/`);
            setClassData(classRes.data);
            
            // Fetch other data in parallel
            const [membershipsRes, announcementsRes, sessionsRes, materialsRes] = await Promise.all([
                api.get(`/class-memberships/?class_id=${classId}`),
                api.get(`/announcements/class/${classId}/`),
                api.get(`/sessions/?class_id=${classId}`),
                api.get(`/classes/${classId}/materials/`)
            ]);
            
            // Extract students from memberships
            const studentMembers = membershipsRes.data.filter(m => m.user_details?.role === 'student');
            setMemberships(membershipsRes.data);
            setStudents(studentMembers.map(m => m.user_details));
            setAnnouncements(announcementsRes.data);
            setSessions(sessionsRes.data);
            setMaterials(materialsRes.data);
        } catch (error) {
            console.error('Error fetching class data:', error);
            setMessage('❌ ' + (language === 'en' ? 'Error loading class data' : 'Lỗi tải dữ liệu lớp học'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAnnouncement = async (formData) => {
        try {
            await api.post(`/announcements/class/${classId}/`, {
                title: formData.title,
                content: formData.content,
                class_id: classId,
                created_by: user.id
            });
            setMessage('✅ ' + (language === 'en' ? 'Announcement created successfully!' : 'Tạo thông báo thành công!'));
            fetchClassData();
        } catch (error) {
            throw error;
        }
    };

    const handleUpdateAnnouncement = async (announcementId, formData) => {
        try {
            await api.put(`/announcements/class/${classId}/${announcementId}/`, {
                title: formData.title,
                content: formData.content
            });
            setMessage('✅ ' + (language === 'en' ? 'Announcement updated successfully!' : 'Cập nhật thông báo thành công!'));
            fetchClassData();
        } catch (error) {
            throw error;
        }
    };

    const handleDeleteAnnouncement = async (announcementId) => {
        try {
            await api.delete(`/announcements/class/${classId}/${announcementId}/`);
            setMessage('✅ ' + (language === 'en' ? 'Announcement deleted successfully!' : 'Xóa thông báo thành công!'));
            fetchClassData();
        } catch (error) {
            throw error;
        }
    };

    const handleCreateSession = async (formData) => {
        try {
            await api.post(`/sessions/`, {
                topic: formData.topic,
                date: formData.date,
                class_id: classId
            });
            setMessage('✅ ' + (language === 'en' ? 'Session created successfully!' : 'Tạo buổi học thành công!'));
            fetchClassData();
        } catch (error) {
            throw error;
        }
    };

    const handleRemoveStudent = async (studentId) => {
        try {
            // Find membership ID for this student
            const membership = memberships.find(m => m.user_details?.id === studentId);
            if (!membership) {
                throw new Error('Membership not found');
            }
            await api.delete(`/class-memberships/${membership.id}/`);
            setMessage('✅ ' + (language === 'en' ? 'Student removed successfully!' : 'Xóa học sinh thành công!'));
            fetchClassData();
        } catch (error) {
            throw error;
        }
    };

    const handleUploadMaterial = async (formData) => {
        try {
            await api.post(`/classes/${classId}/materials/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('✅ ' + (language === 'en' ? 'Material uploaded successfully!' : 'Tải lên tài liệu thành công!'));
            fetchClassData();
        } catch (error) {
            throw error;
        }
    };

    const handleUpdateMaterial = async (materialId, data) => {
        try {
            await api.put(`/materials/${materialId}/`, data);
            setMessage('✅ ' + (language === 'en' ? 'Material updated successfully!' : 'Cập nhật tài liệu thành công!'));
            fetchClassData();
        } catch (error) {
            throw error;
        }
    };

    const handleDeleteMaterial = async (materialId) => {
        try {
            await api.delete(`/materials/${materialId}/`);
            setMessage('✅ ' + (language === 'en' ? 'Material deleted successfully!' : 'Xóa tài liệu thành công!'));
            fetchClassData();
        } catch (error) {
            throw error;
        }
    };

    const tabs = [
        { id: 'course', label: t.course, icon: BookOpen },
        { id: 'members', label: t.members, icon: Users },
        { id: 'grades', label: t.grades, icon: Award },
        { id: 'activities', label: t.activities, icon: TrendingUp }
    ];

    if (authLoading || loading) {
        return <LoadingScreen message={t.loading} />;
    }

    if (!classData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600">{t.notFound || 'Class not found'}</p>
                </div>
            </div>
        );
    }

    const classColor = getClassColor(classData.id);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Compact Header */}
            <div className={`bg-gradient-to-r ${classColor} text-white shadow-md`}>
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="flex flex-col">
                        <div>
                            <h1 className="text-3xl font-bold">{classData.name}</h1>
                            <p className="text-white/80 text-sm mt-1">{classData.description}</p>
                        </div>
                        <div className="flex space-x-5 text-sm mt-3">
                            {classData.class_code && (
                                <div className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm font-medium">
                                    {t.classCode}: {classData.class_code}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className="max-w-7xl mx-auto px-6 mt-4">
                    <Message message={message} onClose={() => setMessage('')} />
                </div>
            )}

            <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex space-x-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all relative ${
                                        activeTab === tab.id
                                            ? 'text-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-lg" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-10 py-6">
                {activeTab === 'course' && (
                    <div className="space-y-6">
                        {/* Announcements - Full Width */}
                        <AnnouncementList
                            announcements={announcements}
                            canPost={canPost}
                            onCreateAnnouncement={handleCreateAnnouncement}
                            onUpdateAnnouncement={handleUpdateAnnouncement}
                            onDeleteAnnouncement={handleDeleteAnnouncement}
                            language={language}
                            t={t}
                        />

                        {/* Sessions - Full Width */}
                        <SessionList
                            sessions={sessions}
                            classId={classId}
                            canCreate={canEdit}
                            onCreateSession={handleCreateSession}
                            language={language}
                            t={t}
                        />

                        {/* Materials - Full Width */}
                        <MaterialList
                            materials={materials}
                            canUpload={canPost}
                            onUploadMaterial={handleUploadMaterial}
                            onUpdateMaterial={handleUpdateMaterial}
                            onDeleteMaterial={handleDeleteMaterial}
                            language={language}
                            t={t}
                        />
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="max-w-7xl">
                        <MemberList
                            students={students}
                            lecturer={classData.lecturer_details}
                            canManage={canEdit}
                            onRemoveStudent={handleRemoveStudent}
                            language={language}
                            t={t}
                        />
                    </div>
                )}

                {activeTab === 'grades' && (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl text-gray-600 font-medium">{t.gradesComingSoon}</p>
                    </div>
                )}

                {activeTab === 'activities' && (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl text-gray-600 font-medium">{t.activitiesComingSoon}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
