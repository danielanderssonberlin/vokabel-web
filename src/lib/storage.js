export const STORAGE_KEYS = {
  CURRENT_LANGUAGE: 'vokabro_current_language',
  LANGUAGES: 'vokabro_languages',
  USER_STATS: 'vokabro_user_stats',
  LEARNING_SESSION: (langCode) => `vokabro_learning_session_${langCode}`,
  UI_LANGUAGE: 'vokabro_ui_language',
  AUTO_PROCEED: 'vokabro_auto_proceed',
};

export const clearLearningSession = (langCode, userId) => {
  if (!langCode || !userId) return;
  const key = `${STORAGE_KEYS.LEARNING_SESSION(langCode)}_${userId}`;
  localStorage.removeItem(key);
};

export const updateWordInSession = (langCode, userId, updatedWord) => {
  if (!langCode || !userId || !updatedWord) return;
  const key = `${STORAGE_KEYS.LEARNING_SESSION(langCode)}_${userId}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const session = JSON.parse(saved);
      if (session.vokabeln) {
        session.vokabeln = session.vokabeln.map(v => v.id === updatedWord.id ? { ...v, ...updatedWord } : v);
        localStorage.setItem(key, JSON.stringify(session));
      }
    } catch (e) {
      console.error("Failed to update word in session", e);
    }
  }
};

export const removeWordFromSession = (langCode, userId, wordId) => {
  if (!langCode || !userId || !wordId) return;
  const key = `${STORAGE_KEYS.LEARNING_SESSION(langCode)}_${userId}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const session = JSON.parse(saved);
      if (session.vokabeln) {
        const wordIndex = session.vokabeln.findIndex(v => v.id === wordId);
        if (wordIndex !== -1) {
          session.vokabeln.splice(wordIndex, 1);
          
          // Adjust currentIndex if necessary
          if (wordIndex < session.currentIndex && session.currentIndex > 0) {
            session.currentIndex--;
          }
          
          // Ensure index is still valid
          if (session.currentIndex >= session.vokabeln.length && session.vokabeln.length > 0) {
            session.currentIndex = session.vokabeln.length - 1;
          }

          localStorage.setItem(key, JSON.stringify(session));
        }
      }
    } catch (e) {
      console.error("Failed to remove word from session", e);
    }
  }
};

export const clearUserStorage = () => {
  const keysToKeep = [STORAGE_KEYS.UI_LANGUAGE];
  const allKeys = Object.values(STORAGE_KEYS).filter(val => typeof val === 'string');
  
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
  
  // Also clear any language-specific learning sessions
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('vokabro_learning_session_') || key.startsWith('learning_session_'))) {
      localStorage.removeItem(key);
      i--; // Adjust index after removal
    }
  }

  // Legacy keys cleanup
  localStorage.removeItem('user_stats');
};
