const GEMINI_API_KEY = 'AIzaSyC1U4B2azzXyJwfO6byo_UHTJlb3MVU2uw';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface GeneratedLesson {
  id: string;
  title: string;
  content?: string;
  audioText?: string;
  text?: string;
  explanation?: string;
  examples?: string[];
  words?: VocabularyWord[];
  prompt?: string;
  instructions?: string[];
  prompts?: string[];
  minWords?: number;
  maxWords?: number;
  expectedDuration?: number;
  questions: GeneratedQuestion[];
  points: number;
}

export interface GeneratedQuestion {
  id: string;
  type: 'mcq' | 'true-false' | 'fill-blank' | 'open';
  question: string;
  options?: string[];
  correctAnswer: string | number | boolean;
  points: number;
}

export interface VocabularyWord {
  word: string;
  definition: string;
  example: string;
  synonyms: string[];
  pronunciation: string;
}

export interface UserPerformance {
  averageScore: number;
  completedLessons: number;
  weakAreas: string[];
  strongAreas: string[];
  recentScores: number[];
}

export async function generateLesson(
  skill: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  lessonNumber: number,
  userPerformance?: UserPerformance
): Promise<GeneratedLesson> {
  try {
    const prompt = createLessonPrompt(skill, level, lessonNumber, userPerformance);
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    const lessonData = JSON.parse(jsonMatch[0]);
    
    return {
      ...lessonData,
      id: `${skill}-${level}-${lessonNumber}-${Date.now()}`,
      points: calculateLessonPoints(level, lessonData.questions?.length || 0)
    };
    
  } catch (error) {
    console.error('Error generating lesson:', error);
    throw new Error('Failed to generate lesson content');
  }
}

function createLessonPrompt(
  skill: string,
  level: string,
  lessonNumber: number,
  performance?: UserPerformance
): string {
  const difficultyAdjustment = getDifficultyAdjustment(performance);
  
  const skillPrompts = {
    listening: `Create a listening comprehension lesson for ${level} level English learners.
    
Content Requirements:
- Generate a natural conversation or narrative (200-400 words) suitable for ${level} level
- Topic should be engaging and educational
- Use vocabulary appropriate for ${level} learners
- Include 4-5 comprehension questions about the audio content
- Mix question types: multiple choice (2-3), true/false (1), and fill-in-the-blank (1-2)

${difficultyAdjustment}`,

    reading: `Create a reading comprehension lesson for ${level} level English learners.
    
Content Requirements:
- Generate an engaging passage (250-500 words) appropriate for ${level} level
- Choose an interesting topic (science, culture, history, daily life, etc.)
- Use vocabulary and sentence structures suitable for ${level}
- Include 4-5 comprehension questions about the text
- Mix question types: multiple choice (2-3), true/false (1), and open-ended (1-2)

${difficultyAdjustment}`,

    speaking: `Create a speaking practice lesson for ${level} level English learners.
    
Content Requirements:
- Provide clear instructions for the speaking exercise
- Include 3-4 conversation prompts or discussion topics
- Expected duration: ${level === 'beginner' ? '60-90' : level === 'intermediate' ? '90-120' : '120-180'} seconds
- Add 2 open-ended evaluation questions for self-assessment
- Focus on practical communication skills

${difficultyAdjustment}`,

    writing: `Create a writing exercise for ${level} level English learners.
    
Content Requirements:
- Provide a clear, engaging writing prompt suitable for ${level} level
- Include specific instructions and guidelines
- Set word count: ${level === 'beginner' ? '50-100' : level === 'intermediate' ? '150-250' : '300-500'} words
- Add 2 evaluation questions focusing on different aspects (grammar, content, structure)
- Include helpful writing tips

${difficultyAdjustment}`,

    grammar: `Create a grammar lesson for ${level} level English learners.
    
Content Requirements:
- Explain one specific grammar rule appropriate for ${level} level
- Provide 3-4 clear example sentences demonstrating the rule
- Include 5-6 practice questions testing understanding
- Mix question types: multiple choice (3), fill-in-the-blank (2), true/false (1)
- Make explanations clear and easy to understand

${difficultyAdjustment}`,

    vocabulary: `Create a vocabulary lesson for ${level} level English learners.
    
Content Requirements:
- Introduce 5-6 new words appropriate for ${level} level
- For each word provide: definition, example sentence, synonyms (if any), pronunciation guide
- Include 4-5 practice questions testing word knowledge and usage
- Mix question types: multiple choice (2-3), fill-in-the-blank (2), usage questions (1)
- Choose words that are useful and commonly used

${difficultyAdjustment}`
  };

  let basePrompt = skillPrompts[skill as keyof typeof skillPrompts] || skillPrompts.reading;
  
  if (performance && performance.completedLessons > 0) {
    basePrompt += `\n\nUser Performance Context:
- Average score: ${performance.averageScore}%
- Completed lessons: ${performance.completedLessons}
- Recent performance trend: ${getPerformanceTrend(performance.recentScores)}
- Focus areas for improvement: ${performance.weakAreas.join(', ') || 'General practice'}`;
  }

  basePrompt += `\n\nThis is lesson ${lessonNumber} in the ${level} ${skill} series.

CRITICAL: Respond with ONLY a valid JSON object in this exact format:
{
  "title": "Lesson Title Here",
  ${skill === 'listening' ? '"audioText": "Complete text for audio conversion (200-400 words)",' : ''}
  ${skill === 'reading' ? '"text": "Complete reading passage (250-500 words)",' : ''}
  ${skill === 'grammar' ? '"explanation": "Clear grammar rule explanation", "examples": ["Example sentence 1", "Example sentence 2", "Example sentence 3"],' : ''}
  ${skill === 'vocabulary' ? '"words": [{"word": "example", "definition": "meaning", "example": "usage sentence", "synonyms": ["synonym1", "synonym2"], "pronunciation": "/pronunciation/"}],' : ''}
  ${skill === 'writing' ? '"prompt": "Writing prompt text", "instructions": ["Instruction 1", "Instruction 2", "Instruction 3"], "minWords": 50, "maxWords": 100,' : ''}
  ${skill === 'speaking' ? '"instructions": "Speaking exercise instructions", "prompts": ["Discussion prompt 1", "Discussion prompt 2", "Discussion prompt 3"], "expectedDuration": 90,' : ''}
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "points": ${level === 'beginner' ? 10 : level === 'intermediate' ? 15 : 20}
    }
  ]
}

Ensure all JSON is properly formatted and valid.`;

  return basePrompt;
}

function getDifficultyAdjustment(performance?: UserPerformance): string {
  if (!performance || performance.completedLessons === 0) {
    return 'Use standard difficulty for this level.';
  }
  
  const avgScore = performance.averageScore;
  const trend = getPerformanceTrend(performance.recentScores);
  
  if (avgScore >= 85 && trend === 'improving') {
    return 'Increase difficulty slightly. Add more complex vocabulary and sentence structures.';
  } else if (avgScore <= 60 || trend === 'declining') {
    return 'Decrease difficulty slightly. Use simpler vocabulary and clearer explanations.';
  } else if (avgScore >= 75) {
    return 'Maintain current difficulty with slight variation to keep it engaging.';
  }
  
  return 'Use standard difficulty for this level.';
}

function getPerformanceTrend(recentScores: number[]): 'improving' | 'declining' | 'stable' {
  if (recentScores.length < 3) return 'stable';
  
  const recent = recentScores.slice(-3);
  const older = recentScores.slice(-6, -3);
  
  if (older.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  if (recentAvg > olderAvg + 10) return 'improving';
  if (recentAvg < olderAvg - 10) return 'declining';
  return 'stable';
}

function calculateLessonPoints(level: string, questionCount: number): number {
  const basePoints = { beginner: 10, intermediate: 15, advanced: 20 };
  return (basePoints[level as keyof typeof basePoints] || 10) * questionCount;
}

export async function generateLessonSequence(
  skill: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  startIndex: number = 1,
  count: number = 1,
  userPerformance?: UserPerformance
): Promise<GeneratedLesson[]> {
  const lessons: GeneratedLesson[] = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const lesson = await generateLesson(skill, level, startIndex + i, userPerformance);
      lessons.push(lesson);
      
      // Small delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to generate lesson ${startIndex + i}:`, error);
      throw error;
    }
  }
  
  return lessons;
}