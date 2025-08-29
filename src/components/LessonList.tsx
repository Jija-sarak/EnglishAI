import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { loadLessonData, SectionData, LessonData } from '../utils/dataLoader';
import { Loader2, Play, BookOpen, Mic, PenTool, FileText, Brain } from 'lucide-react';

interface LessonListProps {
  skill: keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'>;
  level: 'beginner' | 'intermediate' | 'advanced';
  user: User;
  onLessonSelect: (lesson: LessonData) => void;
  onBack: () => void;
}

const skillIcons = {
  listening: Play,
  reading: BookOpen,
  speaking: Mic,
  writing: PenTool,
  grammar: Brain,
  vocabulary: FileText
};

export function LessonList({ skill, level, user, onLessonSelect, onBack }: LessonListProps) {
  const [sectionData, setSectionData] = useState<SectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [skill, level]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadLessonData(skill, level);
      setSectionData(data);
    } catch (err) {
      setError('Failed to load lessons. Please try again.');
      console.error('Error loading lesson data:', err);
    } finally {
      setLoading(false);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return user[skill].completed.includes(lessonId);
  };

  const canAccessLesson = (index: number) => {
    if (index === 0) return true;
    return isLessonCompleted(sectionData?.lessons[index - 1]?.id || '');
  };

  const IconComponent = skillIcons[skill];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading lessons...</p>
        </div>
      </div>
    );
  }

  if (error || !sectionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load lessons'}</p>
          <button 
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center space-x-2 transition-colors"
        >
          <span>←</span>
          <span>Back to Level Selection</span>
        </button>

        <div className="text-center mb-8">
          <IconComponent className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{sectionData.title}</h1>
          <p className="text-gray-600">{sectionData.description}</p>
        </div>

        <div className="grid gap-6">
          {sectionData.lessons.map((lesson, index) => {
            const completed = isLessonCompleted(lesson.id);
            const canAccess = canAccessLesson(index);

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl p-6 shadow-lg border-2 transition-all duration-200 ${
                  canAccess
                    ? 'border-gray-200 cursor-pointer hover:shadow-xl hover:border-blue-300'
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
                } ${completed ? 'border-green-300 bg-green-50' : ''}`}
                onClick={() => canAccess && onLessonSelect(lesson)}
                whileHover={canAccess ? { scale: 1.02 } : {}}
                whileTap={canAccess ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      completed ? 'bg-green-500 text-white' : 
                      canAccess ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {completed ? '✓' : index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{lesson.title}</h3>
                      <p className="text-sm text-gray-600">
                        {completed ? 'Completed' : canAccess ? 'Available' : 'Locked'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {!canAccess && index > 0 && (
                      <p className="text-sm text-gray-500">
                        Complete previous lesson to unlock
                      </p>
                    )}
                    {canAccess && (
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                        <span className="text-blue-600 font-medium">
                          {completed ? 'Review' : 'Start'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}