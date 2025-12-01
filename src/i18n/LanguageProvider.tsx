// src/i18n/LanguageProvider.tsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// Supported locales
export type Locale = 'en' | 'sr' | 'es' | 'fr' | 'de' | 'ru';

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'sr', 'es', 'fr', 'de', 'ru'] as const;

export const LOCALE_NAMES: Record<Locale, string> = {
    en: 'English',
    sr: 'Srpski',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    ru: 'Русский',
};

// Context type
interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

// Create context with default value
const LanguageContext = createContext<LanguageContextType>({
    locale: 'en',
    setLocale: () => { },
});

// Provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
    // Initialize from localStorage if available, fallback to 'en'
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('tierless_locale');
            if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
                return stored as Locale;
            }
        }
        return 'en';
    });

    // Persist locale changes to localStorage
    const setLocale = useCallback((newLocale: Locale) => {
        if (SUPPORTED_LOCALES.includes(newLocale)) {
            setLocaleState(newLocale);
            if (typeof window !== 'undefined') {
                localStorage.setItem('tierless_locale', newLocale);
            }
        }
    }, []);

    // Update HTML lang attribute
    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.lang = locale;
        }
    }, [locale]);

    return (
        <LanguageContext.Provider value={{ locale, setLocale }}>
            {children}
        </LanguageContext.Provider>
    );
}

// Hook to use language context
export function useLocale() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLocale must be used within LanguageProvider');
    }
    return context;
}
