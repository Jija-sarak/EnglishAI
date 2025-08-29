import { motion } from 'framer-motion';
import { User, UserProgress } from '../types';
import { ProgressBar } from './ProgressBar';
import { Lock } from 'lucide-react';

interface SectionCardProps {
  title: string;
  icon: string;
  description: string;
  progress: UserProgress;
  onClick: () => void;
  isLocked?: boolean;
}

export function SectionCard({ title, icon, description, progress, onClick, isLocked = false }: SectionCardProps) {
  const nextLevelXP = {
    beginner: 100,
    intermediate: 300,
    advanced: 500
  };

  const currentMax = nextLevelXP[progress.level];
  const canLevelUp = progress.xp >= currentMax;

  return (
    <motion.div
      whileHover={{ scale: isLocked ? 1 : 1.02, y: isLocked ? 0 : -5 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer transition-all duration-200 ${
        isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'
      }`}
      onClick={isLocked ? undefined : onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600 capitalize">{progress.level}</p>
          </div>
        </div>
        {isLocked && <Lock className="w-5 h-5 text-gray-400" />}
      </div>
      
      <p className="text-gray-600 mb-4 text-sm">{description}</p>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-semibold text-gray-800">{progress.xp} / {currentMax} XP</span>
        </div>
        <ProgressBar current={progress.xp} max={currentMax} />
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">{progress.completed.length} completed</span>
          {canLevelUp && progress.level !== 'advanced' && (
            <span className="text-green-600 font-medium">Ready to level up!</span>
          )}
          {progress.level === 'advanced' && progress.xp >= currentMax && (
            <span className="text-purple-600 font-medium">Mastered!</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}