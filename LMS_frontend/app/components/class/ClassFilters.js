'use client';
import { Search, Grid, List } from 'lucide-react';

export default function ClassFilters({ 
    searchQuery, 
    onSearchChange, 
    viewMode, 
    onViewModeChange, 
    t 
}) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder={t?.searchClasses || 'Search classes...'}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                />
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => onViewModeChange('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    title={t?.gridView || 'Grid View'}
                >
                    <Grid className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onViewModeChange('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    title={t?.listView || 'List View'}
                >
                    <List className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
