import { User } from '../types';

export interface LessonResult {
  lessonId: string;
  skill: string;
  level: string;
  score: number;
  maxScore: number;
  completedAt: Date;
  timeSpent: number;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  type: string;
  correct: boolean;
  score: number;
  maxScore: number;
  topic?: string;
}

export interface UserPerformance {
  averageScore: number;
  completedLessons: number;
  weakAreas: string[];
  strongAreas: string[];
  recentScores: number[];
  skillPerformance: Record<string, SkillPerformance>;
}

export interface SkillPerformance {
  averageScore: number;
  completedLessons: number;
  lastLessonDate: Date;
  topicScores: Record<string, number[]>;
}

const STORAGE_KEY = 'english-learning-performance';

export function savePerformanceData(result: LessonResult): void {
  const existing = getPerformanceData();
  existing.push(result);
  
  // Keep only last 100 results to prevent storage bloat
  if (existing.length > 100) {
    existing.splice(0, existing.length - 100);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getPerformanceData(): LessonResult[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved).map((result: any) => ({
        ...result,
        completedAt: new Date(result.completedAt)
      }));
    } catch {
      return [];
    }
  }
  return [];
}

export function calculateUserPerformance(user: User, skill?: string): UserPerformance {
  const allResults = getPerformanceData();
  const relevantResults = skill 
    ? allResults.filter(r => r.skill === skill)
    : allResults;
  
  if (relevantResults.length === 0) {
    return {
      averageScore: 0,
      completedLessons: 0,
      weakAreas: [],
      strongAreas: [],
      recentScores: [],
      skillPerformance: {}
    };
  }

  const scores = relevantResults.map(r => (r.score / r.maxScore) * 100);
  const recentScores = scores.slice(-10); // Last 10 lessons
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Analyze question performance to identify weak/strong areas
  const topicPerformance: Record<string, { correct: number; total: number }> = {};
  
  relevantResults.forEach(result => {
    result.questionResults.forEach(qr => {
      const topic = qr.topic || qr.type;
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { correct: 0, total: 0 };
      }
      topicPerformance[topic].total++;
      if (qr.correct) {
        topicPerformance[topic].correct++;
      }
    });
  });

  const topicScores = Object.entries(topicPerformance).map(([topic, perf]) => ({
    topic,
    score: (perf.correct / perf.total) * 100
  }));

  const weakAreas = topicScores
    .filter(t => t.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(t => t.topic);

  const strongAreas = topicScores
    .filter(t => t.score >= 85)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(t => t.topic);

  // Calculate skill-specific performance
  const skillPerformance: Record<string, SkillPerformance> = {};
  const skills = ['listening', 'reading', 'speaking', 'writing', 'grammar', 'vocabulary'];
  
  skills.forEach(skillName => {
    const skillResults = allResults.filter(r => r.skill === skillName);
    if (skillResults.length > 0) {
      const skillScores = skillResults.map(r => (r.score / r.maxScore) * 100);
      const skillTopics: Record<string, number[]> = {};
      
      skillResults.forEach(result => {
        result.questionResults.forEach(qr => {
          const topic = qr.topic || qr.type;
          if (!skillTopics[topic]) skillTopics[topic] = [];
          skillTopics[topic].push((qr.score / qr.maxScore) * 100);
        });
      });

      skillPerformance[skillName] = {
        averageScore: skillScores.reduce((a, b) => a + b, 0) / skillScores.length,
        completedLessons: skillResults.length,
        lastLessonDate: new Date(Math.max(...skillResults.map(r => r.completedAt.getTime()))),
        topicScores: skillTopics
      };
    }
  });

  return {
    averageScore,
    completedLessons: relevantResults.length,
    weakAreas,
    strongAreas,
    recentScores,
    skillPerformance
  };
}

function calculateLessonPoints(level: string, questionCount: number): number {
  const basePoints = { beginner: 10, intermediate: 15, advanced: 20 };
  return (basePoints[level as keyof typeof basePoints] || 10) * questionCount;
}

export function getNextLessonNumber(user: User, skill: string, level: string): number {
  const completed = user[skill as keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'>].completed;
  const levelLessons = completed.filter(id => id.includes(`${skill}-${level}`));
  return levelLessons.length + 1;
}

export function shouldGenerateNewLesson(user: User, skill: string, level: string): boolean {
  // Always generate lessons dynamically
  return true;
}