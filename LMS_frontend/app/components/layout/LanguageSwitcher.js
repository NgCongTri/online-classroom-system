'use client';
import { useTranslation } from '../../hooks/useTranslation';

export default function LanguageSwitcher({ className = '' }) {
    const { language, setLanguage } = useTranslation();
    
    return (
        <div className={`bg-gray-100 rounded-lg p-1 ${className}`}>
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    language === 'en' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                }`}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('vi')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    language === 'vi' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                }`}
            >
                VI
            </button>
        </div>
    );
}
