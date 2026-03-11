import React, { createContext, useContext, useState, useEffect } from 'react';
import { UI_STRINGS } from '../constants/uiContent';

const UiLanguageContext = createContext();

export const useUiLanguage = () => {
  const context = useContext(UiLanguageContext);
  if (!context) {
    throw new Error('useUiLanguage must be used within a UiLanguageProvider');
  }
  return context;
};

export const UiLanguageProvider = ({ children }) => {
  const [uiLanguage, setUiLanguage] = useState(() => {
    return localStorage.getItem('ui_language') || 'de';
  });

  const [strings, setStrings] = useState(UI_STRINGS[uiLanguage] || UI_STRINGS.de);

  useEffect(() => {
    localStorage.setItem('ui_language', uiLanguage);
    const newStrings = UI_STRINGS[uiLanguage] || UI_STRINGS.de;
    // Nur setzen wenn wirklich anders, um unnötige Renders zu vermeiden
    setStrings(prev => prev === newStrings ? prev : newStrings);
  }, [uiLanguage]);

  const toggleUiLanguage = (lang) => {
    if (UI_STRINGS[lang]) {
      setUiLanguage(lang);
    }
  };

  return (
    <UiLanguageContext.Provider value={{ uiLanguage, toggleUiLanguage, strings }}>
      {children}
    </UiLanguageContext.Provider>
  );
};
