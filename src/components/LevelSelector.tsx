import { motion } from 'framer-motion';
import { User, UserProgress } from '../types';
import { Lock, CheckCircle } from 'lucide-react';

interface LevelSelectorProps {
  title: string;
  icon: string;
  progress: UserProgress;
  onLevelSelect: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  onBack: () => void;
}

export function LevelSelector({ title, icon, progress, onLevelSelect, onBack }: LevelSelectorProps) {
  const levels = ['beginner', 'intermediate', 'advanced'] as const;
  
  const isUnlocked = (level: typeof levels[number]) => {
    if (level === 'beginner') return true;
    if (level === 'intermediate') return progress.xp >= 50 || progress.level === 'intermediate' || progress.level === 'advanced';
    if (level === 'advanced') return progress.xp >= 150 || progress.level === 'advanced';
    return false;
  };

  const isCompleted = (level: typeof levels[number]) => {
    const requiredXP = { beginner: 50, intermediate: 150, advanced: 300 };
    return progress.xp >= requiredXP[level];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center space-x-2 transition-colors"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>
        
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">{icon}</span>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-600">Choose your level and start learning</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {levels.map((level, index) => {
            const unlocked = isUnlocked(level);
            const completed = isCompleted(level);
            const isCurrent = progress.level === level;
            
            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl p-6 shadow-lg border-2 transition-all duration-200 ${
                  unlocked 
                    ? isCurrent 
                      ? 'border-blue-500 cursor-pointer hover:shadow-xl' 
                      : 'border-gray-200 cursor-pointer hover:shadow-xl hover:border-gray-300'
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => unlocked && onLevelSelect(level)}
                whileHover={unlocked ? { scale: 1.02 } : {}}
                whileTap={unlocked ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold capitalize text-gray-800">{level}</h3>
                  {!unlocked && <Lock className="w-5 h-5 text-gray-400" />}
                  {completed && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {isCurrent && unlocked && !completed && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Required XP:</span>
                    <span className="font-medium">
                      {level === 'beginner' ? '0' : level === 'intermediate' ? '50' : '150'}
                    </span>
                  </div>
                  
                  {level === 'beginner' && (
                    <p className="text-sm text-gray-600">Perfect for starting your English journey</p>
                  )}
                  {level === 'intermediate' && (
                    <p className="text-sm text-gray-600">Build on your existing knowledge</p>
                  )}
                  {level === 'advanced' && (
                    <p className="text-sm text-gray-600">Master complex English concepts</p>
                  )}
                  
                  {isCurrent && (
                    <div className="bg-blue-50 text-blue-700 text-sm px-3 py-2 rounded-lg">
                      Current Level
                    </div>
                  )}
                  
                  {!unlocked && (
                    <div className="bg-gray-100 text-gray-500 text-sm px-3 py-2 rounded-lg">
                      Complete previous level to unlock
                    </div>
                  )}
                  
                  {completed && (
                    <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg">
                      ✓ Completed
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}