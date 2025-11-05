'use client';
import { Calendar, Clock } from 'lucide-react';
import MiniCalendar from './MiniCalendar';

export default function EventsTab({ upcomingEvents, t }) {
    return (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {/* Mini Calendar */}
            <MiniCalendar upcomingEvents={upcomingEvents} t={t} />

            {/* Upcoming Events List */}
            <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                    <span>📅</span>
                    <span>Sự kiện sắp tới</span>
                </h4>
                
                {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">{t?.noEvents || 'No upcoming events'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingEvents.map((event) => (
                            <div key={event.id} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-100 hover:shadow-md transition-all cursor-pointer group">
                                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex flex-col items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                    <span className="text-lg font-bold">
                                        {new Date(event.date).toLocaleDateString('vi-VN', {day: '2-digit'})}
                                    </span>
                                    <span className="text-xs font-semibold uppercase">
                                        {new Date(event.date).toLocaleDateString('vi-VN', {month: 'short'})}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 group-hover:text-purple-600 line-clamp-1">
                                        {event.title}
                                    </p>
                                    <p className="text-xs text-purple-600 font-semibold mt-1">
                                        {event.className}
                                    </p>
                                    <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        <span>{event.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
