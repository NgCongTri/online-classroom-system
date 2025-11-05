import { useState } from 'react';
import { Users, UserPlus, UserMinus, Crown, Mail, Search } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function MemberList({ 
    students, 
    lecturer,
    canManage, 
    onRemoveStudent,
    language,
    t 
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [removingId, setRemovingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToRemove, setStudentToRemove] = useState(null);

    const handleRemoveClick = (student) => {
        setStudentToRemove(student);
        setShowDeleteModal(true);
    };

    const handleConfirmRemove = async () => {
        if (!studentToRemove) return;
        
        setRemovingId(studentToRemove.id);
        try {
            await onRemoveStudent(studentToRemove.id);
            setShowDeleteModal(false);
            setStudentToRemove(null);
        } finally {
            setRemovingId(null);
        }
    };

    const handleCancelRemove = () => {
        setShowDeleteModal(false);
        setStudentToRemove(null);
    };

    // Filter students by search query
    const filteredStudents = students.filter(student => 
        student.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Header with Statistics */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{t.members}</h3>
                    </div>
                    {canManage && (
                        <Button
                            variant="primary"
                            size="sm"
                            icon={UserPlus}
                        >
                            {t.invite}
                        </Button>
                    )}
                </div>
                
                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-700">{students.length}</div>
                        <div className="text-sm text-blue-600 font-medium">{t.students || 'Students'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
                        <div className="text-2xl font-bold text-purple-700">1</div>
                        <div className="text-sm text-purple-600 font-medium">{t.lecturer || 'Lecturer'}</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            {students.length > 5 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchMembers || 'Search students...'}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>
            )}

            {/* Lecturer Card - Compact */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-semibold text-white shadow-md">
                            {lecturer?.username?.charAt(0).toUpperCase() || 'L'}
                        </div>
                        <div>
                            <div className="flex items-center space-x-1.5">
                                <p className="font-semibold text-gray-900 text-sm">{lecturer?.username || t.lecturer}</p>
                                <Crown className="w-3.5 h-3.5 text-yellow-500" />
                            </div>
                            <p className="text-xs text-gray-600 flex items-center space-x-1">
                                <Mail className="w-3 h-3" />
                                <span>{lecturer?.email || 'lecturer@example.com'}</span>
                            </p>
                        </div>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                        {t.lecturer}
                    </span>
                </div>
            </div>

            {/* Students List */}
            {students.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">{t.noStudentsYet}</p>
                    {canManage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={UserPlus}
                            className="mt-3"
                        >
                            {t.invite}
                        </Button>
                    )}
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <p className="text-gray-600">{t.noResults || 'No results found'}</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {filteredStudents.map((student, index) => (
                            <div
                                key={student.id || index}
                                className="p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center font-semibold text-white shadow-sm">
                                            {student.username?.charAt(0).toUpperCase() || 'S'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{student.username}</p>
                                            <p className="text-sm text-gray-600 flex items-center space-x-1">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span>{student.email}</span>
                                            </p>
                                        </div>
                                    </div>
                                    {canManage && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleRemoveClick(student)}
                                            loading={removingId === student.id}
                                            icon={UserMinus}
                                        >
                                            {t.remove}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={handleCancelRemove}
                title={t.confirmRemove || 'Confirm Remove Student'}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        {t.confirmRemoveMessage || 'Are you sure you want to remove'}{' '}
                        <span className="font-semibold text-gray-900">{studentToRemove?.username}</span>{' '}
                        {t.fromClass || 'from this class'}?
                    </p>
                    <p className="text-sm text-gray-600">
                        {t.removeWarning || 'This action cannot be undone. The student will lose access to all class materials and sessions.'}
                    </p>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <Button
                        variant="ghost"
                        onClick={handleCancelRemove}
                        disabled={removingId}
                    >
                        {t.cancel || 'Cancel'}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirmRemove}
                        loading={removingId}
                        icon={UserMinus}
                    >
                        {t.confirmRemoveBtn || 'Yes, Remove'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
