export interface UserProgress {
  level: 'beginner' | 'intermediate' | 'advanced';
  xp: number;
  completed: string[];
}

export interface User {
  listening: UserProgress;
  reading: UserProgress;
  speaking: UserProgress;
  writing: UserProgress;
  grammar: UserProgress;
  vocabulary: UserProgress;
  totalXP: number;
  streak: number;
  lastActiveDate: string;
  badges: string[];
}

export interface Activity {
  id: string;
  title: string;
  content: string;
  questions?: Question[];
  xpReward: number;
}

export interface Question {
  id: string;
  question: string;
  type: 'mcq' | 'true-false' | 'open-ended' | 'fill-blank';
  options?: string[];
  correctAnswer: string | number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: number;
  category: string;
}