'use client';
import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import StudentClassCard from './StudentClassCard';
import ClassFilters from './ClassFilters';

export default function StudentClassList({ 
    classes, 
    language, 
    t, 
    onJoinClick,
    emptyTitle,
    emptyDescription
}) {
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredClasses = classes.filter(cls => 
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.lecturer_name && cls.lecturer_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="p-6 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                <span>{t?.myClasses || 'My Classes'}</span>
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {classes.length} {t?.activeClasses || 'active classes'}
                            </p>
                        </div>
                        {onJoinClick && (
                            <button
                                onClick={onJoinClick}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{t?.joinClass || 'Join Class'}</span>
                            </button>
                        )}
                    </div>

                    <div className="mt-4">
                        <ClassFilters
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            t={t}
                        />
                    </div>
                </div>
            </div>

            <div className="p-6">
                {filteredClasses.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {emptyTitle || t?.noClasses || 'No classes yet'}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                            {emptyDescription || t?.startLearning || 'Join a class to start learning'}
                        </p>
                        {onJoinClick && (
                            <button
                                onClick={onJoinClick}
                                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{t?.joinClass || 'Join Class'}</span>
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredClasses.map((cls) => (
                            <StudentClassCard
                                key={cls.id}
                                classData={cls}
                                language={language}
                                t={t}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredClasses.map((cls) => (
                            <StudentClassCard
                                key={cls.id}
                                classData={cls}
                                language={language}
                                t={t}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
