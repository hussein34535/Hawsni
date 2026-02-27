'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '@/locales/en';
import { ar } from '@/locales/ar';

type Language = 'en' | 'ar';
type Translations = typeof en;

interface LanguageContextType {
    language: Language;
    t: Translations;
    setLanguage: (lang: Language) => void;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('ar');

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
            setLanguageState(savedLang);
        } else {
            // Check browser preference
            const browserLang = navigator.language.split('-')[0];
            if (browserLang === 'ar') {
                setLanguageState('ar');
            }
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = language === 'ar' ? ar : en;
    const isRTL = false; // Always LTR layout, even for Arabic

    useEffect(() => {
        document.documentElement.dir = 'ltr'; // Always LTR
        document.documentElement.lang = language;
    }, [language]);

    if (!mounted) return null;

    return (
        <LanguageContext.Provider value={{ language, t, setLanguage, isRTL }}>
            <div className={isRTL ? 'font-arabic' : 'font-sans'}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
