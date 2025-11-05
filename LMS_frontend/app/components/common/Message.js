'use client';
import { X } from 'lucide-react';

export default function Message({ message, onClose, type = 'success' }) {
    if (!message) return null;
    
    const types = {
        success: 'bg-green-50 text-green-600 border-green-200',
        error: 'bg-red-50 text-red-600 border-red-200',
        warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        info: 'bg-blue-50 text-blue-600 border-blue-200',
    };
    
    // Auto-detect type from message content
    const detectedType = message.toLowerCase().includes('error') || message.includes('❌') 
        ? 'error' 
        : message.includes('⚠️') 
        ? 'warning'
        : message.includes('✅')
        ? 'success'
        : type;
    
    return (
        <div className={`mb-6 p-4 rounded-lg border ${types[detectedType]}`}>
            <div className="flex items-center justify-between">
                <span>{message}</span>
                <button onClick={onClose} className="text-xl hover:opacity-70">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
