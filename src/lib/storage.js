export const STORAGE_KEYS = {
  CURRENT_LANGUAGE: 'vokabro_current_language',
  LANGUAGES: 'vokabro_languages',
  USER_STATS: 'vokabro_user_stats',
  LEARNING_SESSION: (langCode) => `vokabro_learning_session_${langCode}`,
  UI_LANGUAGE: 'vokabro_ui_language',
  AUTO_PROCEED: 'vokabro_auto_proceed',
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
