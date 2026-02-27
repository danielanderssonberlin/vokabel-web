import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLanguages = async () => {
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
    } else if (profile) {
      const langs = profile.languages || [];
      setAvailableLanguages(langs);
      setSelectedLanguage(profile.current_language || (langs.length > 0 ? langs[0].code : null));
    } else {
      // Fallback: Keine Sprachen
      setAvailableLanguages([]);
      setSelectedLanguage(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const changeLanguage = async (code) => {
    setSelectedLanguage(code);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ current_language: code })
        .eq('id', user.id);
    }
  };

  const addLanguage = async (lang) => {
    const newLangs = [...availableLanguages, lang];
    setAvailableLanguages(newLangs);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ languages: newLangs })
        .eq('id', user.id);
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
        .update({ 
          languages: newLangs,
          current_language: newSelected
        })
        .eq('id', user.id);
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
