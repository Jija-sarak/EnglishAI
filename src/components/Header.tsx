import { User } from '../types';
import { badges } from '../utils/badges';
import { Flame, Trophy, Zap } from 'lucide-react';

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const userBadges = badges.filter(badge => user.badges.includes(badge.id));

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            EnglishAI
          </h1>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-full">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-700">{user.totalXP} XP</span>
          </div>
          
          <div className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-full">
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-orange-700">{user.streak} day streak</span>
          </div>
          
          <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-full">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <span className="font-semibold text-yellow-700">{userBadges.length} badges</span>
          </div>
          
          {userBadges.length > 0 && (
            <div className="flex space-x-1">
              {userBadges.slice(0, 3).map(badge => (
                <span key={badge.id} className="text-lg" title={badge.name}>
                  {badge.icon}
                </span>
              ))}
              {userBadges.length > 3 && (
                <span className="text-sm text-gray-500">+{userBadges.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}