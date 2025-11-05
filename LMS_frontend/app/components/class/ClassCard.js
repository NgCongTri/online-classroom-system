'use client';
import { useRouter } from 'next/navigation';
import { Calendar, Users, BookOpen } from 'lucide-react';
import { getClassColor, getBorderColor } from '../../utils/class_color';

export default function ClassCard({ classData, language, t, onClick }) {
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
            {/* Compact Header with Class Info */}
            <div className={`h-32 bg-gradient-to-br ${colorClass} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
                <div className="relative z-10 h-full flex flex-col justify-center px-5 py-4">
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 drop-shadow-lg">
                        {classData.name}
                    </h3>
                    <div className="flex items-center space-x-4">
                        <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold rounded-lg shadow-lg">
                            {classData.class_code || 'No code'}
                        </span>
                        <div className="flex items-center space-x-1.5 text-white">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-bold drop-shadow">
                                {classData.students_count || 0} {t?.students || 'students'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1.5 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">
                            {new Date(classData.start_date).toLocaleDateString('vi-VN')} - {new Date(classData.end_date).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>

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
