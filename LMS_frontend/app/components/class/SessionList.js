import { useState } from 'react';
import { Calendar, Plus, ChevronRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function SessionList({ 
    sessions, 
    classId,
    canCreate, 
    onCreateSession,
    language,
    t 
}) {
    const router = useRouter();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({ topic: '', date: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!formData.topic.trim() || !formData.date) return;
        
        setIsSubmitting(true);
        try {
            await onCreateSession(formData);
            setShowCreateModal(false);
            setFormData({ topic: '', date: '' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSessionClick = (sessionId) => {
        router.push(`/dashboard/class/${classId}/session/${sessionId}`);
    };

    // Sort sessions by date (newest first)
    const sortedSessions = [...sessions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{t.sessions}</h3>
                    <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full">
                        {sessions.length}
                    </span>
                </div>
                {canCreate && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowCreateModal(true)}
                        icon={Plus}
                    >
                        {t.createSession}
                    </Button>
                )}
            </div>

            {/* Sessions List */}
            {sessions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">{t.noSessions}</p>
                    {canCreate && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCreateModal(true)}
                            className="mt-3"
                        >
                            {t.createSession}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedSessions.map((session) => {
                        const sessionDate = new Date(session.date);
                        const isUpcoming = sessionDate > new Date();
                        
                        return (
                            <div
                                key={session.id}
                                onClick={() => handleSessionClick(session.id)}
                                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h4 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                {session.topic}
                                            </h4>
                                            {isUpcoming && (
                                                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                                                    {language === 'en' ? 'Upcoming' : 'Sắp tới'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{sessionDate.toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                            <ChevronRight className="w-5 h-5 text-purple-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Session Modal */}
            {showCreateModal && (
                <Modal
                    isOpen={showCreateModal}
                    title={t.createSession}
                    onClose={() => {
                        setShowCreateModal(false);
                        setFormData({ topic: '', date: '' });
                    }}
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.topic}
                            </label>
                            <input
                                type="text"
                                value={formData.topic}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder={t.topic}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.date}
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowCreateModal(false);
                                setFormData({ topic: '', date: '' });
                            }}
                        >
                            {t.cancel}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreate}
                            loading={isSubmitting}
                            disabled={!formData.topic.trim() || !formData.date}
                        >
                            {t.create}
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
