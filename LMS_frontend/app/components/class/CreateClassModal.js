'use client';
import { useState } from 'react';
import { Info } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function CreateClassModal({ isOpen, onClose, onSubmit, language, t }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        is_open_enrollment: true
    });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await onSubmit(formData);
        if (result.success) {
            onClose();
            setFormData({
                name: '',
                description: '',
                start_date: '',
                end_date: '',
                is_open_enrollment: true
            });
        }
    };
    
    const footer = (
        <>
            <Button
                variant="secondary"
                onClick={onClose}
            >
                {t?.cancel || 'Cancel'}
            </Button>
            <Button
                type="submit"
                onClick={handleSubmit}
            >
                {t?.create || 'Create Class'}
            </Button>
        </>
    );
    
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t?.createClass || 'Create New Class'}
            footer={footer}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t?.className || 'Class Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., Web Development Fundamentals"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t?.description || 'Description'}
                    </label>
                    <textarea
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        rows="4"
                        placeholder="Describe what students will learn in this class..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            {t?.startDate || 'Start Date'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            {t?.endDate || 'End Date'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                        {t?.enrollmentType || 'Enrollment Type'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            formData.is_open_enrollment === true ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <input
                                type="radio"
                                checked={formData.is_open_enrollment === true}
                                onChange={() => setFormData({ ...formData, is_open_enrollment: true })}
                                className="mt-1"
                            />
                            <div className="ml-3">
                                <p className="font-semibold text-gray-900">{t?.openToAll || 'Open Enrollment'}</p>
                                <p className="text-xs text-gray-600 mt-1">Anyone can join this class</p>
                            </div>
                        </label>

                        <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            formData.is_open_enrollment === false ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <input
                                type="radio"
                                checked={formData.is_open_enrollment === false}
                                onChange={() => setFormData({ ...formData, is_open_enrollment: false })}
                                className="mt-1"
                            />
                            <div className="ml-3">
                                <p className="font-semibold text-gray-900">{t?.codeRequired || 'Code Required'}</p>
                                <p className="text-xs text-gray-600 mt-1">Students need a code to join</p>
                            </div>
                        </label>
                    </div>
                </div>

                {formData.is_open_enrollment === false && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900 mb-1">
                                    {t?.classCode || 'Class Code'}
                                </p>
                                <p className="text-sm text-blue-800">
                                    {t?.codeWillBeGenerated || 'A unique code will be generated automatically'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
}
