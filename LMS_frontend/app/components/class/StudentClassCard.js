'use client';
import { useRouter } from 'next/navigation';
import { Calendar, Users, BookOpen, GraduationCap } from 'lucide-react';
import { getClassColor, getBorderColor } from '../../utils/class_color';

export default function StudentClassCard({ classData, language, t, onClick }) {
    const router = useRouter();
    const colorClass = getClassColor(classData.id);
    const borderColorClass = getBorderColor(colorClass);
    
    const handleClick = (e) => {
        if (onClick) {
            onClick(classData);
        } else {
            router.push(`/dashboard/class/${classData.id}`);
        }
    };
    
    return (
        <div
            className={`group relative bg-white rounded-xl border-2 ${borderColorClass} hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer`}
        >
            {/* Compact Header - Student View */}
            <div className={`h-36 bg-gradient-to-br ${colorClass} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
                <div className="relative z-10 h-full flex flex-col justify-center px-6 py-4">
                    <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-white line-clamp-2 drop-shadow-lg flex-1 pr-2">
                            {classData.name}
                        </h3>
                        <GraduationCap className="w-6 h-6 text-white/90 flex-shrink-0" />
                    </div>
                    {classData.lecturer_name && (
                        <p className="text-sm text-white/90 font-medium drop-shadow">
                            👨‍🏫 {classData.lecturer_name}
                        </p>
                    )}
                </div>
            </div>

            <div className="p-5">
                {/* Class Info */}
                <div className="space-y-2.5 mb-4">
                    <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-medium">
                            {new Date(classData.start_date).toLocaleDateString('vi-VN')} - {new Date(classData.end_date).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-medium">
                            {classData.students_count || 0} {t?.students || 'students'}
                        </span>
                    </div>
                </div>

                {/* Enter Class Button */}
                <button
                    onClick={handleClick}
                    className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                    <BookOpen className="w-4 h-4" />
                    <span>{t?.enterClass || 'Enter Class'}</span>
                </button>
            </div>
        </div>
    );
}
