import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { LessonData } from '../utils/dataLoader';
import { checkOpenAnswer, checkSpeakingAnswer, checkWritingAnswer, AIFeedback } from '../utils/aiChecker';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Play, Square, Mic, MicOff, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface LessonPageProps {
  skill: keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'>;
  lesson: LessonData;
  onComplete: (points: number, lessonId: string) => void;
  onBack: () => void;
}

interface Answer {
  questionId: string;
  answer: string | number | boolean;
  isCorrect?: boolean;
  feedback?: string;
  points?: number;
}

export function LessonPage({ skill, lesson, onComplete, onBack }: LessonPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);

  const { isListening, transcript, error: speechError, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  const questions = lesson.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => {
    if (transcript && skill === 'speaking') {
      setUserInput(transcript);
    }
  }, [transcript, skill]);

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  const handleMCQAnswer = (optionIndex: number) => {
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    const points = isCorrect ? (currentQuestion.points || 10) : 0;
    
    const answer: Answer = {
      questionId: currentQuestion.id,
      answer: optionIndex,
      isCorrect,
      points,
      feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${currentQuestion.options?.[currentQuestion.correctAnswer as number]}`
    };

    setAnswers(prev => [...prev, answer]);
    
    if (isLastQuestion) {
      finishLesson([...answers, answer]);
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 1500);
    }
  };

  const handleTrueFalseAnswer = (answer: boolean) => {
    const isCorrect = answer === currentQuestion.correctAnswer;
    const points = isCorrect ? (currentQuestion.points || 10) : 0;
    
    const answerObj: Answer = {
      questionId: currentQuestion.id,
      answer,
      isCorrect,
      points,
      feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`
    };

    setAnswers(prev => [...prev, answerObj]);
    
    if (isLastQuestion) {
      finishLesson([...answers, answerObj]);
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 1500);
    }
  };

  const handleFillBlankAnswer = () => {
    const isCorrect = userInput.toLowerCase().trim() === (currentQuestion.correctAnswer as string).toLowerCase().trim();
    const points = isCorrect ? (currentQuestion.points || 10) : 0;
    
    const answer: Answer = {
      questionId: currentQuestion.id,
      answer: userInput,
      isCorrect,
      points,
      feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`
    };

    setAnswers(prev => [...prev, answer]);
    
    if (isLastQuestion) {
      finishLesson([...answers, answer]);
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setUserInput('');
      }, 1500);
    }
  };

  const handleOpenAnswer = async () => {
    if (!userInput.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      let feedback: AIFeedback;
      
      if (skill === 'speaking') {
        feedback = await checkSpeakingAnswer(currentQuestion.question, userInput);
      } else if (skill === 'writing') {
        feedback = await checkWritingAnswer(lesson.prompt || currentQuestion.question, userInput, lesson.minWords);
      } else {
        feedback = await checkOpenAnswer(currentQuestion.question, userInput, lesson.text || lesson.audioText);
      }
      
      setAiFeedback(feedback);
      
      const answer: Answer = {
        questionId: currentQuestion.id,
        answer: userInput,
        isCorrect: feedback.correct,
        points: Math.round((feedback.score / 100) * (currentQuestion.points || 20)),
        feedback: feedback.feedback
      };

      setAnswers(prev => [...prev, answer]);
      
      if (isLastQuestion) {
        setTimeout(() => finishLesson([...answers, answer]), 3000);
      } else {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
          setUserInput('');
          setAiFeedback(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      setAiFeedback({
        correct: false,
        score: 0,
        feedback: 'Unable to evaluate your answer. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishLesson = (allAnswers: Answer[]) => {
    const total = allAnswers.reduce((sum, answer) => sum + (answer.points || 0), 0);
    setTotalScore(total);
    setShowResults(true);
    onComplete(total, lesson.id);
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const hasAnswered = answers.some(a => a.questionId === currentQuestion.id) || aiFeedback;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{currentQuestion.question}</h3>

          {currentQuestion.type === 'mcq' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const isSelected = answers.find(a => a.questionId === currentQuestion.id)?.answer === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                
                return (
                  <button
                    key={index}
                    onClick={() => !hasAnswered && handleMCQAnswer(index)}
                    disabled={hasAnswered}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      hasAnswered
                        ? isSelected
                          ? isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-red-500 bg-red-50 text-red-800'
                          : isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {hasAnswered && isSelected && (
                        isCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      {hasAnswered && !isSelected && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'true-false' && (
            <div className="flex space-x-4">
              {[true, false].map((value) => {
                const isSelected = answers.find(a => a.questionId === currentQuestion.id)?.answer === value;
                const isCorrect = value === currentQuestion.correctAnswer;
                
                return (
                  <button
                    key={value.toString()}
                    onClick={() => !hasAnswered && handleTrueFalseAnswer(value)}
                    disabled={hasAnswered}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      hasAnswered
                        ? isSelected
                          ? isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-red-500 bg-red-50 text-red-800'
                          : isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{value ? 'True' : 'False'}</span>
                      {hasAnswered && isSelected && (
                        isCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      {hasAnswered && !isSelected && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'fill-blank' && (
            <div className="space-y-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={hasAnswered}
              />
              {!hasAnswered && (
                <button
                  onClick={handleFillBlankAnswer}
                  disabled={!userInput.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit Answer
                </button>
              )}
            </div>
          )}

          {currentQuestion.type === 'open' && (
            <div className="space-y-4">
              {skill === 'speaking' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={hasAnswered}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        isListening 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isListening ? 'Stop Recording' : 'Start Recording'}</span>
                    </button>
                    
                    {transcript && (
                      <button
                        onClick={resetTranscript}
                        className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg"
                        disabled={hasAnswered}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {speechError && (
                    <p className="text-red-600 text-sm">{speechError}</p>
                  )}
                </div>
              )}

              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={skill === 'speaking' ? "Your speech will appear here..." : "Type your answer here..."}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={hasAnswered || (skill === 'speaking' && isListening)}
              />
              
              {skill === 'writing' && lesson.minWords && (
                <p className="text-sm text-gray-500">
                  Words: {userInput.trim().split(/\s+/).filter(word => word.length > 0).length} / {lesson.minWords} minimum
                </p>
              )}

              {!hasAnswered && (
                <button
                  onClick={handleOpenAnswer}
                  disabled={!userInput.trim() || isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Evaluating...' : 'Submit Answer'}</span>
                </button>
              )}
            </div>
          )}

          {/* Show feedback for answered questions */}
          {hasAnswered && (
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              {aiFeedback ? (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    {aiFeedback.correct ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-semibold">
                      Score: {aiFeedback.score}/100
                    </span>
                  </div>
                  <p className="text-gray-700">{aiFeedback.feedback}</p>
                </div>
              ) : (
                <p className="text-gray-700">
                  {answers.find(a => a.questionId === currentQuestion.id)?.feedback}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (skill === 'listening' && lesson.audioText) {
      return (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800">Listen to the passage</h3>
            <button
              onClick={() => playAudio(lesson.audioText)}
              disabled={isPlaying}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Playing...' : 'Play Audio'}</span>
            </button>
          </div>
        </div>
      );
    }

    if (skill === 'reading' && lesson.text) {
      return (
        <div className="mb-8 p-6 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Read the passage</h3>
          <p className="text-gray-700 leading-relaxed">{lesson.text}</p>
        </div>
      );
    }

    if (skill === 'speaking' && lesson.instructions) {
      return (
        <div className="mb-8 p-6 bg-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Speaking Exercise</h3>
          <p className="text-gray-700 mb-4">{lesson.instructions}</p>
          {lesson.prompts && (
            <div className="space-y-2">
              <p className="font-medium text-purple-700">Prompts:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {lesson.prompts.map((prompt: string, index: number) => (
                  <li key={index}>{prompt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (skill === 'writing' && lesson.prompt) {
      return (
        <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Writing Prompt</h3>
          <p className="text-gray-700 mb-4">{lesson.prompt}</p>
          {lesson.instructions && (
            <div className="space-y-2">
              <p className="font-medium text-yellow-700">Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {lesson.instructions.map((instruction: string, index: number) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (skill === 'grammar' && lesson.explanation) {
      return (
        <div className="mb-8 p-6 bg-indigo-50 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4">Grammar Rule</h3>
          <p className="text-gray-700 mb-4">{lesson.explanation}</p>
          {lesson.examples && (
            <div className="space-y-2">
              <p className="font-medium text-indigo-700">Examples:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {lesson.examples.map((example: string, index: number) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (skill === 'vocabulary' && lesson.words) {
      return (
        <div className="mb-8 p-6 bg-pink-50 rounded-lg">
          <h3 className="text-lg font-semibold text-pink-800 mb-4">Vocabulary Words</h3>
          <div className="grid gap-4">
            {lesson.words.map((word: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-pink-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">{word.word}</h4>
                  {word.pronunciation && (
                    <span className="text-sm text-gray-500">{word.pronunciation}</span>
                  )}
                </div>
                <p className="text-gray-700 mb-2">{word.definition}</p>
                <p className="text-gray-600 italic mb-2">"{word.example}"</p>
                {word.synonyms && word.synonyms.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Synonyms: {word.synonyms.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-md w-full"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Lesson Complete!</h2>
          <p className="text-xl text-gray-600 mb-6">
            You earned <span className="font-bold text-blue-600">{totalScore} points</span>
          </p>
          <div className="space-y-4">
            <button
              onClick={onBack}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Continue Learning
            </button>
          </div>
        </motion.div>
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
          <span>Back to Lessons</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{lesson.title}</h1>
        </div>

        {renderContent()}

        {questions.length > 0 ? (
          renderQuestion()
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Practice Complete!</h3>
            <p className="text-gray-600 mb-6">You've reviewed all the content for this lesson.</p>
            <button
              onClick={() => onComplete(lesson.points || 20, lesson.id)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Mark as Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}