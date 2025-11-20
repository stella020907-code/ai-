import React, { createContext, useState, useContext } from 'react';
import { translations } from '../translations';

export type Language = keyof typeof translations;

const getInitialLanguage = (): Language => {
    if (typeof navigator === 'undefined') {
        return 'en';
    }
    const browserLang = navigator.language.split(/[-_]/)[0];
    if (browserLang in translations) {
        return browserLang as Language;
    }
    return 'en'; // Default to English
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof translations.en; // Use 'en' as the base type
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(getInitialLanguage);

    const t = translations[language];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslations = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslations must be used within a LanguageProvider');
    }
    return context;
};
