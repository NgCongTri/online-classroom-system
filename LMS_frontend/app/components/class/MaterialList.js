import { useState } from 'react';
import { FileText, Plus, Edit, Trash2, Download, Calendar, User, File } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function MaterialList({ 
    materials, 
    canUpload, 
    onUploadMaterial,
    onUpdateMaterial,
    onDeleteMaterial,
    language,
    t 
}) {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '', file: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpload = async () => {
        if (!formData.title.trim() || !formData.file) {
            return;
        }
        
        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            if (formData.description) {
                data.append('description', formData.description);
            }
            data.append('file', formData.file);
            
            await onUploadMaterial(data);
            setShowUploadModal(false);
            setFormData({ title: '', description: '', file: null });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!formData.title.trim()) return;
        
        setIsSubmitting(true);
        try {
            await onUpdateMaterial(selectedMaterial.id, {
                title: formData.title,
                description: formData.description
            });
            setShowEditModal(false);
            setSelectedMaterial(null);
            setFormData({ title: '', description: '', file: null });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await onDeleteMaterial(selectedMaterial.id);
            setShowDeleteModal(false);
            setSelectedMaterial(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (material) => {
        setSelectedMaterial(material);
        setFormData({ 
            title: material.title, 
            description: material.description || '',
            file: null 
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (material) => {
        setSelectedMaterial(material);
        setShowDeleteModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, file });
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getFileIcon = (fileName) => {
        const ext = fileName?.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) return '📄';
        if (['doc', 'docx'].includes(ext)) return '📝';
        if (['ppt', 'pptx'].includes(ext)) return '📊';
        if (['xls', 'xlsx'].includes(ext)) return '📈';
        if (['zip', 'rar'].includes(ext)) return '📦';
        return '📎';
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{t.materials || 'Tài liệu'}</h3>
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                        {materials.length}
                    </span>
                </div>
                {canUpload && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowUploadModal(true)}
                        icon={Plus}
                    >
                        {t.uploadMaterial || 'Tải lên tài liệu'}
                    </Button>
                )}
            </div>

            {/* Materials List */}
            {materials.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">{t.noMaterials || 'Chưa có tài liệu'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {materials.map((material) => (
                        <div
                            key={material.id}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                    <div className="text-3xl mt-1">
                                        {getFileIcon(material.file_name)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                            {material.title}
                                        </h4>
                                        {material.description && (
                                            <p className="text-gray-600 text-sm mb-3">{material.description}</p>
                                        )}
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <div className="flex items-center space-x-1">
                                                <File className="w-4 h-4" />
                                                <span>{material.file_name}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <span>{formatFileSize(material.file_size)}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <User className="w-4 h-4" />
                                                <span>{material.uploaded_by_name}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(material.uploaded_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                    <a
                                        href={material.file_url}
                                        download
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                        title={t.download || 'Tải xuống'}
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                    {canUpload && (
                                        <>
                                            <button
                                                onClick={() => openEditModal(material)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title={t.edit}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(material)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title={t.delete}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Material Modal */}
            {showUploadModal && (
                <Modal
                    isOpen={showUploadModal}
                    title={t.uploadMaterial || 'Tải lên tài liệu'}
                    onClose={() => {
                        setShowUploadModal(false);
                        setFormData({ title: '', description: '', file: null });
                    }}
                    size="lg"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.title} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder={t.materialTitle || 'Ví dụ: Bài giảng Chương 1'}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.description} ({t.optional || 'Không bắt buộc'})
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                placeholder={t.materialDescription || 'Mô tả về tài liệu này...'}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.file} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            {formData.file && (
                                <p className="mt-2 text-sm text-gray-600">
                                    ✓ {formData.file.name} ({formatFileSize(formData.file.size)})
                                </p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">
                                📎 {t.acceptedFormats || 'Định dạng: PDF, Word, PowerPoint, Excel, ZIP, RAR'}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowUploadModal(false);
                                setFormData({ title: '', description: '', file: null });
                            }}
                        >
                            {t.cancel}
                        </Button>
                        <Button
                            variant="success"
                            onClick={handleUpload}
                            loading={isSubmitting}
                            disabled={!formData.title.trim() || !formData.file}
                        >
                            {t.upload || 'Tải lên'}
                        </Button>
                    </div>
                </Modal>
            )}

            {/* Edit Material Modal */}
            {showEditModal && (
                <Modal
                    isOpen={showEditModal}
                    title={t.editMaterial || 'Sửa tài liệu'}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedMaterial(null);
                        setFormData({ title: '', description: '', file: null });
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.description}
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">
                                💡 {t.cannotChangeFile || 'Không thể thay đổi file. Nếu cần đổi file, hãy xóa và tải lên lại.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowEditModal(false);
                                setSelectedMaterial(null);
                                setFormData({ title: '', description: '', file: null });
                            }}
                        >
                            {t.cancel}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpdate}
                            loading={isSubmitting}
                            disabled={!formData.title.trim()}
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
                    title={t.deleteMaterial || 'Xóa tài liệu'}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedMaterial(null);
                    }}
                    size="sm"
                >
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-gray-700 mb-2">
                            {t.confirmDeleteMaterial || 'Bạn có chắc muốn xóa tài liệu này?'}
                        </p>
                        <p className="text-sm text-gray-500">{t.cannotUndo}</p>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setSelectedMaterial(null);
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
