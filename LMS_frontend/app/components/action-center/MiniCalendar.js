'use client';
import { Calendar } from 'lucide-react';

export default function MiniCalendar({ upcomingEvents, t }) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = today.getDate();
    
    const cells = [];
    
    // Add empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        cells.push(<div key={`empty-${i}`} className="text-xs py-2"></div>);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === todayDate;
        const hasEvent = upcomingEvents.some(e => new Date(e.date).getDate() === day);
        
        cells.push(
            <div
                key={`day-${day}`}
                className={`text-xs py-2 rounded-lg cursor-pointer transition-all ${
                    isToday ? 'bg-purple-600 text-white font-bold shadow-lg' :
                    hasEvent ? 'bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200' :
                    'text-gray-700 hover:bg-gray-100'
                }`}
            >
                {day}
            </div>
        );
    }
    
    return (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span>{t?.calendar || 'Calendar'}</span>
                </h4>
                <span className="text-xs font-semibold text-purple-600">
                    {today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                </span>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                    <div key={day} className="text-xs font-semibold text-gray-500 py-2">
                        {day}
                    </div>
                ))}
                {cells}
            </div>
        </div>
    );
}
