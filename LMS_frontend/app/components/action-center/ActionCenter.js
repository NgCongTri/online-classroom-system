'use client';
import { useState } from 'react';
import { CheckCheck, Calendar, TrendingUp } from 'lucide-react';
import TodoTab from './TodoTab';
import EventsTab from './EventsTab';
import ActivityTab from './ActivityTab';

export default function ActionCenter({ 
    todoItems = [], 
    upcomingEvents = [], 
    recentActivities = [],
    language,
    t 
}) {
    const [activeTab, setActiveTab] = useState('todo');
    
    const totalTodos = todoItems.reduce((sum, item) => sum + (item.count || 0), 0);
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
            {/* Action Center Header with Tabs */}
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="p-4 pb-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-3">
                        {t?.actionCenter || 'Action Center'}
                    </h3>
                    
                    {/* Tab Navigation */}
                    <div className="flex space-x-1">
                        {/* Todo Tab */}
                        <button
                            onClick={() => setActiveTab('todo')}
                            className={`flex-1 relative px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                                activeTab === 'todo'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <CheckCheck className="w-4 h-4" />
                                <span>{t?.todo || 'To-Do'}</span>
                            </div>
                            {totalTodos > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                                    {totalTodos}
                                </span>
                            )}
                            {activeTab === 'todo' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                            )}
                        </button>

                        {/* Events Tab */}
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`flex-1 relative px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                                activeTab === 'events'
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{t?.events || 'Events'}</span>
                            </div>
                            {upcomingEvents.length > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-purple-500 text-white text-xs font-bold rounded-full shadow-lg">
                                    {upcomingEvents.length}
                                </span>
                            )}
                            {activeTab === 'events' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                            )}
                        </button>

                        {/* Activity Tab */}
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`flex-1 relative px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                                activeTab === 'activity'
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <TrendingUp className="w-4 h-4" />
                                <span>{t?.activity || 'Activity'}</span>
                            </div>
                            {activeTab === 'activity' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-4">
                {activeTab === 'todo' && (
                    <TodoTab todoItems={todoItems} t={t} language={language} />
                )}
                {activeTab === 'events' && (
                    <EventsTab upcomingEvents={upcomingEvents} t={t} />
                )}
                {activeTab === 'activity' && (
                    <ActivityTab recentActivities={recentActivities} t={t} />
                )}
            </div>
        </div>
    );
}
