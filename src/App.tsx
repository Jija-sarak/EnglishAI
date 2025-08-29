import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from './types';
import { GeneratedLesson } from './utils/contentGenerator';
import { loadProgress, saveProgress, addXP, completeActivity } from './utils/storage';
import { checkNewBadges } from './utils/badges';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LevelSelector } from './components/LevelSelector';
import { LessonList } from './components/LessonList';
import { LessonPage } from './components/LessonPage';
import { Confetti } from './components/Confetti';
import { Chatbot } from './components/Chatbot';

type ViewState = 
  | { type: 'dashboard' }
  | { type: 'levelSelector'; section: keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'> }
  | { type: 'lessonList'; section: keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'>; level: 'beginner' | 'intermediate' | 'advanced' }
  | { type: 'lesson'; section: keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'>; lesson: GeneratedLesson };

function App() {
  const [user, setUser] = useState<User>(loadProgress());
  const [currentView, setCurrentView] = useState<ViewState>({ type: 'dashboard' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [newBadgeCount, setNewBadgeCount] = useState(0);

  useEffect(() => {
    saveProgress(user);
  }, [user]);

  const handleSectionSelect = (section: keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'>) => {
    setCurrentView({ type: 'levelSelector', section });
  };

  const handleLevelSelect = (level: 'beginner' | 'intermediate' | 'advanced') => {
    if (currentView.type === 'levelSelector') {
      setCurrentView({ type: 'lessonList', section: currentView.section, level });
    }
  };

  const handleLessonSelect = (lesson: LessonData) => {
  const handleLessonSelect = (lesson: GeneratedLesson) => {
    if (currentView.type === 'lessonList') {
      setCurrentView({ type: 'lesson', section: currentView.section, lesson });
    }
  };

  const handleLessonComplete = (points: number, lessonId: string) => {
    if (currentView.type === 'lesson') {
      let updatedUser = addXP(user, currentView.section, points);
      updatedUser = completeActivity(updatedUser, currentView.section, lessonId);
      
      // Check for new badges
      const newBadges = checkNewBadges(updatedUser);
      if (newBadges.length > 0) {
        updatedUser = {
          ...updatedUser,
          badges: [...updatedUser.badges, ...newBadges]
        };
        setNewBadgeCount(newBadges.length);
        setShowConfetti(true);
      }
      
      // Check for level up
      const currentSection = updatedUser[currentView.section];
      const xpThresholds = { beginner: 50, intermediate: 150, advanced: 300 };
      
      if (currentSection.level === 'beginner' && currentSection.xp >= xpThresholds.beginner) {
        updatedUser[currentView.section].level = 'intermediate';
        setShowConfetti(true);
      } else if (currentSection.level === 'intermediate' && currentSection.xp >= xpThresholds.intermediate) {
        updatedUser[currentView.section].level = 'advanced';
        setShowConfetti(true);
      }
      
      setUser(updatedUser);
      
      // Navigate back to lesson list to show next lesson
      const section = currentView.section;
      const userLevel = updatedUser[section].level;
      setCurrentView({ type: 'lessonList', section, level: userLevel });
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView({ type: 'dashboard' });
  };

  const handleBackToLevelSelector = () => {
    if (currentView.type === 'lesson') {
      // Go back to lesson list first
      const section = currentView.section;
      // We need to determine the level - for now, let's go back to level selector
      setCurrentView({ type: 'levelSelector', section });
    } else if (currentView.type === 'lessonList') {
      setCurrentView({ type: 'levelSelector', section: currentView.section });
    }
  };

  const handleBackToLessonList = () => {
    if (currentView.type === 'lesson') {
      // We need to get the level from somewhere - let's determine it from user progress
      const section = currentView.section;
      const userLevel = user[section].level;
      setCurrentView({ type: 'lessonList', section, level: userLevel });
    }
  };

  const sectionIcons = {
    listening: '🎧',
    reading: '📖', 
    speaking: '🗣️',
    writing: '✍️',
    grammar: '📘',
    vocabulary: '🧩'
  };

  const sectionTitles = {
    listening: 'Listening',
    reading: 'Reading',
    speaking: 'Speaking', 
    writing: 'Writing',
    grammar: 'Grammar',
    vocabulary: 'Vocabulary'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <AnimatePresence mode="wait">
        {currentView.type === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Dashboard user={user} onSectionSelect={handleSectionSelect} />
          </motion.div>
        )}
        
        {currentView.type === 'levelSelector' && (
          <motion.div
            key="levelSelector"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <LevelSelector
              title={sectionTitles[currentView.section]}
              icon={sectionIcons[currentView.section]}
              progress={user[currentView.section]}
              onLevelSelect={handleLevelSelect}
              onBack={handleBackToDashboard}
            />
          </motion.div>
        )}
        
        {currentView.type === 'lessonList' && (
          <motion.div
            key="lessonList"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <LessonList
              skill={currentView.section}
              level={currentView.level}
              user={user}
              onLessonSelect={handleLessonSelect}
              onBack={handleBackToLevelSelector}
            />
          </motion.div>
        )}
        
        {currentView.type === 'lesson' && (
          <motion.div
            key="lesson"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <LessonPage
              skill={currentView.section}
              lesson={currentView.lesson}
              onComplete={handleLessonComplete}
              onBack={handleBackToLessonList}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <Confetti 
        show={showConfetti} 
        onComplete={() => {
          setShowConfetti(false);
          setNewBadgeCount(0);
        }} 
      />
      
      {newBadgeCount > 0 && showConfetti && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 flex items-center justify-center z-40 bg-black bg-opacity-50"
        >
          <div className="bg-white rounded-xl p-8 text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-yellow-600 mb-4">🏆 New Badge{newBadgeCount > 1 ? 's' : ''} Earned!</h2>
            <p className="text-gray-700 text-lg">
              Congratulations! You've earned {newBadgeCount} new badge{newBadgeCount > 1 ? 's' : ''}!
            </p>
          </div>
        </motion.div>
      )}
      
      <Chatbot />
    </div>
  );
}

export default App;