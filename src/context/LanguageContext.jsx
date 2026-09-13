import React, { createContext, useContext, useState, useEffect } from 'react';

import en from '../locales/en.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';
import bn from '../locales/bn.json';
import te from '../locales/te.json';

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
];

export const DICTIONARIES = {
  en,
  hi,
  mr,
  bn,
  te
};

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('sanchay_language');
      if (saved && DICTIONARIES[saved]) {
        return saved;
      }
    } catch (e) {}
    return 'en';
  });

  const setCurrentLang = (langCode) => {
    if (DICTIONARIES[langCode]) {
      setCurrentLangState(langCode);
      try {
        localStorage.setItem('sanchay_language', langCode);
      } catch (e) {}
    }
  };

  /**
   * Nested translation lookup:
   * e.g., t('nav.findMySchemes') or t('hero.headlinePrefix')
   */
  const t = (keyPath, fallback = '') => {
    if (!keyPath) return fallback;

    const resolveKey = (dict) => {
      if (!dict) return undefined;
      const parts = keyPath.split('.');
      let curr = dict;
      for (const part of parts) {
        if (curr && typeof curr === 'object' && part in curr) {
          curr = curr[part];
        } else {
          return undefined;
        }
      }
      return typeof curr === 'string' ? curr : undefined;
    };

    const targetDict = DICTIONARIES[currentLang];
    const resolved = resolveKey(targetDict);
    if (resolved !== undefined) return resolved;

    const enResolved = resolveKey(DICTIONARIES.en);
    if (enResolved !== undefined) return enResolved;

    return fallback || keyPath;
  };

  return (
    <LanguageContext.Provider value={{ currentLang, setCurrentLang, languages: LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
