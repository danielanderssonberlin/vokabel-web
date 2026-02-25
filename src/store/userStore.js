export const getUserStats = () => {
  const stats = localStorage.getItem('user_stats');
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

export const updateStudyStats = () => {
  const stats = getUserStats();
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

  localStorage.setItem('user_stats', JSON.stringify(stats));
  return stats;
};
