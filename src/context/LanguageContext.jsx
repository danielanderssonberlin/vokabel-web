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

  const fetchLanguages = useCallback(async (force = false) => {
    // Wenn wir bereits Sprachen haben und nicht erzwingen, brechen wir ab
    // Dies verhindert, dass lokale Änderungen beim Tab-Wechsel überschrieben werden
    if (!force && availableLanguages.length > 0) {
      setLoading(false);
      return;
    }

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
    
    // Nur setzen, wenn noch keine Sprache ausgewählt ist
    if (!selectedLanguage) {
      const nextLang = currentLang || (langs.length > 0 ? langs[0].code : null);
      if (nextLang) {
        setSelectedLanguage(nextLang);
      }
    }
    setLoading(false);
  }, [selectedLanguage, availableLanguages.length]);

  useEffect(() => {
    fetchLanguages();
    
    // Auth-Status Änderungen überwachen
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        // Wenn wir eingeloggt sind, rufen wir fetchLanguages auf, aber nur wenn wir noch keine Sprachen haben
        // (Vermeidet Überschreiben nach dem Einloggen wenn localStorage noch da ist)
        if (session?.user) {
          // Kleine Verzögerung um DB-Konsistenz abzuwarten falls gerade registriert
          setTimeout(() => fetchLanguages(false), 100);
        }
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
      // Erst prüfen ob Profil existiert
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          current_language: code 
        });
      
      if (error) console.error('Error updating current language:', error);
    }
  };

  const addLanguage = async (lang) => {
    // Lokales Update sofort
    const newLangs = [...availableLanguages, lang];
    setAvailableLanguages(newLangs);
    
    let newSelected = selectedLanguage;
    if (!selectedLanguage) {
      newSelected = lang.code;
      setSelectedLanguage(newSelected);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Wir nutzen upsert, stellen aber sicher dass die ID gesetzt ist
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          languages: newLangs,
          current_language: newSelected
        }, { onConflict: 'id' });
        
      if (error) {
        console.error('Error adding language to Supabase:', error);
        // Fallback: Falls upsert fehlschlägt, versuchen wir es mit einem normalen update falls Zeile existiert
        await supabase
          .from('profiles')
          .update({ 
            languages: newLangs,
            current_language: newSelected
          })
          .eq('id', user.id);
      }
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
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          languages: newLangs,
          current_language: newSelected
        });
      if (error) console.error('Error removing language:', error);
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
      refreshLanguages: () => fetchLanguages(true)
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
