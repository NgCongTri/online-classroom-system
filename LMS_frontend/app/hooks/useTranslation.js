'use client';
import { useState, useEffect } from 'react';
import translations from '../locales';

export function useTranslation() {
    // Initialize from localStorage or default to 'en'
    const [language, setLanguageState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('language') || 'en';
        }
        return 'en';
    });
    
    // Sync with localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', language);
            
            // Dispatch custom event to sync across components
            window.dispatchEvent(new CustomEvent('languageChange', { detail: language }));
        }
    }, [language]);
    
    // Listen for language changes from other components
    useEffect(() => {
        const handleLanguageChange = (e) => {
            setLanguageState(e.detail);
        };
        
        if (typeof window !== 'undefined') {
            window.addEventListener('languageChange', handleLanguageChange);
            return () => window.removeEventListener('languageChange', handleLanguageChange);
        }
    }, []);
    
    const t = translations[language] || translations.en;
    
    const toggleLanguage = () => {
        setLanguageState(prev => prev === 'en' ? 'vi' : 'en');
    };
    
    const changeLanguage = (lang) => {
        if (translations[lang]) {
            setLanguageState(lang);
        }
    };
    
    return {
        t,
        language,
        setLanguage: changeLanguage,
        toggleLanguage
    };
}
