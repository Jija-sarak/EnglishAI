import { User } from '../types';

const STORAGE_KEY = 'english-learning-progress';

export const defaultUser: User = {
  listening: { level: 'beginner', xp: 0, completed: [] },
  reading: { level: 'beginner', xp: 0, completed: [] },
  speaking: { level: 'beginner', xp: 0, completed: [] },
  writing: { level: 'beginner', xp: 0, completed: [] },
  grammar: { level: 'beginner', xp: 0, completed: [] },
  vocabulary: { level: 'beginner', xp: 0, completed: [] },
  totalXP: 0,
  streak: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  badges: []
};

export function loadProgress(): User {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return { ...defaultUser, ...JSON.parse(saved) };
    } catch {
      return defaultUser;
    }
  }
  return defaultUser;
}

export function saveProgress(user: User): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function updateStreak(user: User): User {
  const today = new Date().toISOString().split('T')[0];
  const lastActive = new Date(user.lastActiveDate);
  const todayDate = new Date(today);
  const daysDiff = Math.floor((todayDate.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    return { ...user, streak: user.streak + 1, lastActiveDate: today };
  } else if (daysDiff > 1) {
    return { ...user, streak: 1, lastActiveDate: today };
  }
  
  return { ...user, lastActiveDate: today };
}

export function addXP(user: User, section: keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'>, amount: number): User {
  const updatedUser = {
    ...user,
    [section]: {
      ...user[section],
      xp: user[section].xp + amount
    },
    totalXP: user.totalXP + amount
  };
  
  // Check for level up
  const currentSection = updatedUser[section];
  const xpThresholds = { beginner: 50, intermediate: 150, advanced: 300 };
  
  if (currentSection.level === 'beginner' && currentSection.xp >= xpThresholds.beginner) {
    updatedUser[section].level = 'intermediate';
  } else if (currentSection.level === 'intermediate' && currentSection.xp >= xpThresholds.intermediate) {
    updatedUser[section].level = 'advanced';
  }
  
  return updateStreak(updatedUser);
}

export function completeActivity(user: User, section: keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'>, activityId: string): User {
  const sectionData = user[section];
  if (sectionData.completed.includes(activityId)) {
    return user;
  }
  
  return {
    ...user,
    [section]: {
      ...sectionData,
      completed: [...sectionData.completed, activityId]
    }
  };
}