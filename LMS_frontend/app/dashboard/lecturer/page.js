'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { useClassManagement } from '../../hooks/useClassManagement';
import Header from '../../components/layout/Header';
import ClassList from '../../components/class/ClassList';
import CreateClassModal from '../../components/class/CreateClassModal';
import ActionCenter from '../../components/action-center/ActionCenter';
import LoadingScreen from '../../components/common/LoadingScreen';
import Message from '../../components/common/Message';
import Notification from '../../components/Notification';

export default function LecturerDashboard() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { t, language } = useTranslation();
    const { classes, loading: classLoading, createClass } = useClassManagement(user?.id, 'lecturer');
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [message, setMessage] = useState('');
    
    // Mock data for Action Center (will be replaced with real data later)
    const [todoItems] = useState([
        { id: 1, task: t.gradeAssignmentMidterm, className: 'Lecturer test', deadline: '2025-11-10', type: 'grading', count: 5 },
        { id: 2, task: t.replyStudentMessages, className: 'Test', type: 'message', count: 3 },
        { id: 3, task: t.approveNewMembers, className: 'Lecturer test', type: 'approval', count: 2 }
    ]);
    
    const [upcomingEvents] = useState([
        { id: 1, time: '10:00 AM', date: '2025-11-06', title: t.zoomClass, className: 'Test' },
        { id: 2, time: '02:00 PM', date: '2025-11-07', title: t.assignmentDeadline, className: 'Lecturer test' }
    ]);
    
    const [recentActivities] = useState([
        { id: 1, user: 'Nguyễn Văn A', action: t.justSubmitted, time: '5 phút trước', className: 'Test' },
        { id: 2, user: t.you, action: t.createdAnnouncement, time: '30 phút trước', className: 'Lecturer test' },
        { id: 3, user: 'Trần Thị B', action: t.joinedClass, time: '1 giờ trước', className: 'Test' }
    ]);

    // Redirect if not lecturer
    useEffect(() => {
        if (!authLoading && user?.role !== 'lecturer') {
            router.push('/');
        }
    }, [user, authLoading, router]);

    // Handle class creation
    const handleCreateClass = async (formData) => {
        try {
            const result = await createClass(formData);
            
            if (result.class_code && !result.is_open_enrollment) {
                setMessage(`✅ ${t.classCreatedSuccessfully} ${t.generatedCode}: ${result.class_code}`);
            } else {
                setMessage(`✅ ${t.classCreatedSuccessfully}`);
            }
            
            setShowCreateModal(false);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || t.errorCreatingClass;
            setMessage(`❌ ${errorMsg}`);
        }
    };

    // Show loading screen
    if (authLoading) {
        return <LoadingScreen message={t.loading} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <Header
                user={user}
                language={language}
                t={t}
                userRole="lecturer"
                showNavigation={true}
                activeNav="dashboard"
            />

            {/* Message */}
            {message && (
                <div className="max-w-7xl mx-auto px-6 mt-4">
                    <Message message={message} onClose={() => setMessage('')} />
                </div>
            )}

            {/* Main Content - 2 Column Layout */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Class List (2/3 width) */}
                    <div className="lg:col-span-2">
                        <ClassList
                            classes={classes}
                            loading={classLoading}
                            onCreateClass={() => setShowCreateModal(true)}
                            language={language}
                            t={t}
                        />
                    </div>

                    {/* Right Column: Action Center (1/3 width) */}
                    <div className="lg:col-span-1">
                        <ActionCenter
                            todoItems={todoItems}
                            upcomingEvents={upcomingEvents}
                            recentActivities={recentActivities}
                            language={language}
                            t={t}
                        />
                    </div>
                </div>
            </div>

            {/* Create Class Modal */}
            {showCreateModal && (
                <CreateClassModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateClass}
                    language={language}
                    t={t}
                />
            )}
        </div>
    );
}
