'use client';
import { TrendingUp } from 'lucide-react';

export default function ActivityTab({ recentActivities, t }) {
    return (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>{t?.recentActivity || 'Recent Activity'}</span>
                </h4>
                <span className="text-xs font-semibold text-gray-500">
                    Cập nhật mới nhất
                </span>
            </div>
            
            {recentActivities.length === 0 ? (
                <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">{t?.noActivity || 'No recent activity'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-green-50 to-white rounded-xl hover:from-green-100 hover:to-green-50 transition-all cursor-pointer border border-green-100 group">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                index === 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 leading-relaxed">
                                    <span className="font-bold text-gray-900">{activity.user}</span>{' '}
                                    <span className="text-gray-700">{activity.action}</span>
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                        {activity.className}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">
                                        • {activity.time}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
