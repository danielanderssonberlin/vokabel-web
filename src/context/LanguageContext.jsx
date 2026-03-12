import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UI_STRINGS } from '../constants/uiContent';
import { STORAGE_KEYS, clearUserStorage } from '../lib/storage';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_LANGUAGE);
  });
  const [availableLanguages, setAvailableLanguages] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGES);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);

  const fetchLanguages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('languages, current_language')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching languages:', error);
    } 

    let langs = profile?.languages || [];
    let currentLang = profile?.current_language;

    // Falls keine Sprachen im Profil, prüfen ob Vokabeln in der DB existieren
    if (langs.length === 0) {
      const { data: vocabLangs, error: vocabError } = await supabase
        .from('vocabulary')
        .select('language')
        .eq('user_id', user.id);

      if (!vocabError && vocabLangs && vocabLangs.length > 0) {
        const uniqueCodes = [...new Set(vocabLangs.map(v => v.language))];
        const predefined = UI_STRINGS.de.COMMON.PREDEFINED_LANGUAGES;
        
        langs = uniqueCodes
          .map(code => predefined.find(p => p.code === code))
          .filter(Boolean);

        if (langs.length > 0) {
          currentLang = langs[0].code;
          // Wir versuchen nicht mehr, das Profil automatisch zu speichern (vermeidet 403 Fehler),
          // da die Erkennung aus der vocabulary-Tabelle oben bereits ausreicht.
        }
      }
    }

    setAvailableLanguages(langs);
    setSelectedLanguage(currentLang || (langs.length > 0 ? langs[0].code : null));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLanguages();
    
    // Auth-Status Änderungen überwachen
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        fetchLanguages();
      } else if (event === 'SIGNED_OUT') {
        setSelectedLanguage(null);
        setAvailableLanguages([]);
        clearUserStorage();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchLanguages]);

  // Synchronisation mit localStorage
  useEffect(() => {
    if (selectedLanguage) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_LANGUAGE, selectedLanguage);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_LANGUAGE);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGES, JSON.stringify(availableLanguages));
  }, [availableLanguages]);

  const changeLanguage = async (code) => {
    setSelectedLanguage(code);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          current_language: code 
        });
    }
  };

  const addLanguage = async (lang) => {
    const newLangs = [...availableLanguages, lang];
    setAvailableLanguages(newLangs);
    
    let newSelected = selectedLanguage;
    if (!selectedLanguage) {
      newSelected = lang.code;
      setSelectedLanguage(newSelected);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          languages: newLangs,
          current_language: newSelected
        });
    }
  };

  const removeLanguage = async (code) => {
    const newLangs = availableLanguages.filter(l => l.code !== code);
    setAvailableLanguages(newLangs);
    
    let newSelected = selectedLanguage;
    if (selectedLanguage === code) {
      newSelected = newLangs.length > 0 ? newLangs[0].code : null;
      setSelectedLanguage(newSelected);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          languages: newLangs,
          current_language: newSelected
        });
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      selectedLanguage, 
      availableLanguages, 
      loading, 
      changeLanguage, 
      addLanguage, 
      removeLanguage,
      refreshLanguages: fetchLanguages
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
