import { STORAGE_KEYS } from '../lib/storage';

export const getUserStats = (userId) => {
  const key = userId ? `${STORAGE_KEYS.USER_STATS}_${userId}` : STORAGE_KEYS.USER_STATS;
  const stats = localStorage.getItem(key);
  if (!stats) {
    return {
      streak: 0,
      lastStudyDate: null,
      studyHistory: []
    };
  }
  const parsed = JSON.parse(stats);
  if (!parsed.studyHistory) parsed.studyHistory = [];
  
  // Reset streak if more than 1 day has passed
  if (parsed.lastStudyDate) {
    const lastDate = new Date(parsed.lastStudyDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastDate < yesterday && lastDate.toDateString() !== yesterday.toDateString() && lastDate.toDateString() !== new Date().toDateString()) {
      parsed.streak = 0;
    }
  }

  return parsed;
};

export const updateStudyStats = (userId) => {
  const stats = getUserStats(userId);
  const today = new Date().toDateString();
  
  // Update streak if not already updated today
  if (stats.lastStudyDate !== today) {
    const lastDate = stats.lastStudyDate ? new Date(stats.lastStudyDate) : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (!lastDate || lastDate.toDateString() === yesterday.toDateString()) {
      stats.streak += 1;
    } else {
      stats.streak = 1;
    }
    stats.lastStudyDate = today;
  }

  if (!stats.studyHistory) stats.studyHistory = [];
  if (!stats.studyHistory.includes(today)) {
    stats.studyHistory.push(today);
  }

  const key = userId ? `${STORAGE_KEYS.USER_STATS}_${userId}` : STORAGE_KEYS.USER_STATS;
  localStorage.setItem(key, JSON.stringify(stats));
  return stats;
};

export const calculateStatsFromVocabulary = (vocabulary) => {
  if (!vocabulary || vocabulary.length === 0) {
    return { streak: 0, studyHistory: [] };
  }

  // Alle Review-Daten extrahieren (nur das Datum ohne Uhrzeit)
  const dates = vocabulary
    .filter(v => v.lastReviewed)
    .map(v => new Date(v.lastReviewed).toDateString());
  
  // Eindeutige Daten sortieren (neueste zuerst)
  const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
  
  if (uniqueDates.length === 0) {
    return { streak: 0, studyHistory: [] };
  }

  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  // Prüfen ob heute oder gestern gelernt wurde, sonst ist die Serie 0
  if (uniqueDates[0] === today || uniqueDates[0] === yesterdayStr) {
    streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i + 1]);
      
      // Differenz in Tagen berechnen
      const diffTime = Math.abs(current - next);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
  }

  return {
    streak,
    studyHistory: uniqueDates
  };
};
