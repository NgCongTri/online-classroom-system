'use client';
import { Clock } from 'lucide-react';

export default function TodoTab({ todoItems, t, language }) {
    if (todoItems.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{t?.noTasks || 'All caught up!'}</p>
                <p className="text-xs text-gray-500">Bạn đã hoàn thành tất cả nhiệm vụ</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {todoItems.length} nhiệm vụ đang chờ
                </p>
            </div>
            {todoItems.map((item) => (
                <div 
                    key={item.id}
                    className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl hover:from-blue-100 hover:to-blue-50 transition-all cursor-pointer border border-blue-100 group"
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                                {item.task}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                    {item.className}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    item.type === 'grading' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                    item.type === 'message' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                    'bg-purple-50 text-purple-700 border border-purple-200'
                                }`}>
                                    {item.type === 'grading' ? '📝 Chấm bài' :
                                     item.type === 'message' ? '💬 Tin nhắn' :
                                     '✅ Duyệt'}
                                </span>
                            </div>
                        </div>
                        {item.count && (
                            <span className="ml-3 px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full flex-shrink-0 shadow-lg animate-pulse">
                                {item.count}
                            </span>
                        )}
                    </div>
                    {item.deadline && (
                        <div className="flex items-center space-x-2 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-medium">{t?.dueDate || 'Due'}:</span>
                            <span className="font-semibold">{new Date(item.deadline).toLocaleDateString('vi-VN')}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
