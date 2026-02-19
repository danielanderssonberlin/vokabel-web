export const getUserStats = () => {
  const stats = localStorage.getItem('user_stats');
  if (!stats) {
    return {
      streak: 0,
      lastStudyDate: null,
      dailyGoal: 10,
      dailyProgress: 0,
      lastProgressDate: null
    };
  }
  const parsed = JSON.parse(stats);
  
  // Reset daily progress if it's a new day
  const today = new Date().toDateString();
  if (parsed.lastProgressDate !== today) {
    parsed.dailyProgress = 0;
    parsed.lastProgressDate = today;
  }

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

export const updateDailyProgress = (count = 1) => {
  const stats = getUserStats();
  const today = new Date().toDateString();
  
  stats.dailyProgress += count;
  stats.lastProgressDate = today;

  // Update streak if not already updated today
  if (stats.lastStudyDate !== today) {
    const lastDate = stats.lastStudyDate ? new Date(stats.lastStudyDate) : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (!lastDate || lastDate.toDateString() === yesterday.toDateString()) {
      stats.streak += 1;
    } else if (lastDate.toDateString() !== today) {
      stats.streak = 1;
    }
    stats.lastStudyDate = today;
  }

  localStorage.setItem('user_stats', JSON.stringify(stats));
  return stats;
};

export const setDailyGoal = (goal) => {
  const stats = getUserStats();
  stats.dailyGoal = goal;
  localStorage.setItem('user_stats', JSON.stringify(stats));
  return stats;
};
