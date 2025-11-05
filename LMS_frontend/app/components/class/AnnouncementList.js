import { useState } from 'react';
import { Megaphone, Plus, Edit, Trash2, Calendar, User } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function AnnouncementList({ 
    announcements, 
    canPost, 
    onCreateAnnouncement,
    onUpdateAnnouncement,
    onDeleteAnnouncement,
    language,
    t 
}) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.content.trim()) return;
        
        setIsSubmitting(true);
        try {
            await onCreateAnnouncement(formData);
            setShowCreateModal(false);
            setFormData({ title: '', content: '' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!formData.title.trim() || !formData.content.trim()) return;
        
        setIsSubmitting(true);
        try {
            await onUpdateAnnouncement(selectedAnnouncement.id, formData);
            setShowEditModal(false);
            setSelectedAnnouncement(null);
            setFormData({ title: '', content: '' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await onDeleteAnnouncement(selectedAnnouncement.id);
            setShowDeleteModal(false);
            setSelectedAnnouncement(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (announcement) => {
        setSelectedAnnouncement(announcement);
        setFormData({ title: announcement.title, content: announcement.content });
        setShowEditModal(true);
    };

    const openDeleteModal = (announcement) => {
        setSelectedAnnouncement(announcement);
        setShowDeleteModal(true);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{t.announcements}</h3>
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                        {announcements.length}
                    </span>
                </div>
                {canPost && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowCreateModal(true)}
                        icon={Plus}
                    >
                        {t.createAnnouncement}
                    </Button>
                )}
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">{t.noAnnouncements}</p>
                    {canPost && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCreateModal(true)}
                            className="mt-3"
                        >
                            {t.createAnnouncement}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-lg font-semibold text-gray-900 flex-1">
                                    {announcement.title}
                                </h4>
                                {canPost && (
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={() => openEditModal(announcement)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title={t.edit}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(announcement)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title={t.delete}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{announcement.content}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <User className="w-4 h-4" />
                                    <span>{announcement.created_by_name || t.lecturer}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Announcement Modal */}
            {showCreateModal && (
                <Modal
                    isOpen={showCreateModal}
                    title={t.createAnnouncement}
                    onClose={() => {
                        setShowCreateModal(false);
                        setFormData({ title: '', content: '' });
                    }}
                    size="lg"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.title}
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t.title}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.content}
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder={t.content}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowCreateModal(false);
                                setFormData({ title: '', content: '' });
                            }}
                        >
                            {t.cancel}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreate}
                            loading={isSubmitting}
                            disabled={!formData.title.trim() || !formData.content.trim()}
                        >
                            {t.post}
                        </Button>
                    </div>
                </Modal>
            )}

            {/* Edit Announcement Modal */}
            {showEditModal && (
                <Modal
                    isOpen={showEditModal}
                    title={t.editAnnouncement}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedAnnouncement(null);
                        setFormData({ title: '', content: '' });
                    }}
                    size="lg"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.title}
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.content}
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowEditModal(false);
                                setSelectedAnnouncement(null);
                                setFormData({ title: '', content: '' });
                            }}
                        >
                            {t.cancel}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpdate}
                            loading={isSubmitting}
                            disabled={!formData.title.trim() || !formData.content.trim()}
                        >
                            {t.update}
                        </Button>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <Modal
                    isOpen={showDeleteModal}
                    title={t.deleteAnnouncement}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedAnnouncement(null);
                    }}
                    size="sm"
                >
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-gray-700 mb-2">{t.confirmDelete}</p>
                        <p className="text-sm text-gray-500">{t.cannotUndo}</p>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setSelectedAnnouncement(null);
                            }}
                        >
                            {t.cancel}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            loading={isSubmitting}
                        >
                            {t.delete}
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
