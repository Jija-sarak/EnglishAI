const GEMINI_API_KEY = 'AIzaSyC1U4B2azzXyJwfO6byo_UHTJlb3MVU2uw';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface GeneratedLesson {
  id: string;
  title: string;
  content: string;
  questions: GeneratedQuestion[];
  audioText?: string;
  explanation?: string;
  examples?: string[];
  words?: VocabularyWord[];
  prompt?: string;
  instructions?: string[];
  prompts?: string[];
  minWords?: number;
  maxWords?: number;
  expectedDuration?: number;
  points: number;
}

export interface GeneratedQuestion {
  id: string;
  type: 'mcq' | 'true-false' | 'fill-blank' | 'open';
  question: string;
  options?: string[];
  correctAnswer: string | number | boolean;
  points: number;
  explanation?: string;
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
  preferredDifficulty: 'easy' | 'medium' | 'hard';
}

export async function generateLesson(
  skill: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  lessonNumber: number,
  userPerformance?: UserPerformance
): Promise<GeneratedLesson> {
  try {
    const difficultyAdjustment = getDifficultyAdjustment(userPerformance);
    const prompt = createLessonPrompt(skill, level, lessonNumber, difficultyAdjustment, userPerformance);
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    const lessonData = JSON.parse(jsonMatch[0]);
    
    return {
      ...lessonData,
      id: `${skill}-${level}-${lessonNumber}`,
      points: calculateLessonPoints(level, lessonData.questions?.length || 0)
    };
    
  } catch (error) {
    console.error('Error generating lesson:', error);
    throw new Error('Failed to generate lesson content');
  }
}

function getDifficultyAdjustment(performance?: UserPerformance): string {
  if (!performance) return 'standard';
  
  if (performance.averageScore >= 85) return 'increase difficulty';
  if (performance.averageScore <= 60) return 'decrease difficulty';
  return 'maintain current difficulty';
}

function createLessonPrompt(
  skill: string,
  level: string,
  lessonNumber: number,
  difficultyAdjustment: string,
  performance?: UserPerformance
): string {
  const basePrompts = {
    listening: `Create a listening comprehension lesson for ${level} level English learners. Include:
- A natural conversation or monologue (150-300 words) suitable for ${level} level
- 3-5 comprehension questions about the audio content
- Mix question types: multiple choice, true/false, and fill-in-the-blank`,

    reading: `Create a reading comprehension lesson for ${level} level English learners. Include:
- An engaging passage (200-400 words) appropriate for ${level} level
- 3-5 comprehension questions about the text
- Mix question types: multiple choice, true/false, and open-ended questions`,

    speaking: `Create a speaking practice lesson for ${level} level English learners. Include:
- Clear instructions for the speaking exercise
- 3-4 conversation prompts or topics to discuss
- Expected duration: ${level === 'beginner' ? '60-90' : level === 'intermediate' ? '90-120' : '120-180'} seconds
- 1-2 open-ended evaluation questions`,

    writing: `Create a writing exercise for ${level} level English learners. Include:
- A clear writing prompt suitable for ${level} level
- Specific instructions and guidelines
- Word count requirements: ${level === 'beginner' ? '50-100' : level === 'intermediate' ? '150-250' : '300-500'} words
- 1-2 evaluation criteria questions`,

    grammar: `Create a grammar lesson for ${level} level English learners. Include:
- Clear explanation of a grammar rule appropriate for ${level} level
- 3-4 example sentences demonstrating the rule
- 4-6 practice questions (mix of multiple choice, fill-in-the-blank, and true/false)`,

    vocabulary: `Create a vocabulary lesson for ${level} level English learners. Include:
- 4-6 new words appropriate for ${level} level with definitions, examples, synonyms, and pronunciation
- 3-5 practice questions testing word knowledge and usage
- Mix question types: multiple choice, fill-in-the-blank, and usage questions`
  };

  let prompt = basePrompts[skill as keyof typeof basePrompts] || basePrompts.reading;
  
  if (performance) {
    prompt += `\n\nUser Performance Context:
- Average score: ${performance.averageScore}%
- Completed lessons: ${performance.completedLessons}
- Weak areas: ${performance.weakAreas.join(', ')}
- Strong areas: ${performance.strongAreas.join(', ')}
- Adjustment needed: ${difficultyAdjustment}`;
  }

  prompt += `\n\nThis is lesson ${lessonNumber} in the ${level} ${skill} series.

CRITICAL: Respond with ONLY a valid JSON object in this exact format:
{
  "title": "Lesson Title",
  "content": "Main lesson content",
  ${skill === 'listening' ? '"audioText": "Text to be converted to audio",' : ''}
  ${skill === 'reading' ? '"text": "Reading passage",' : ''}
  ${skill === 'grammar' ? '"explanation": "Grammar rule explanation", "examples": ["example1", "example2"],' : ''}
  ${skill === 'vocabulary' ? '"words": [{"word": "word", "definition": "definition", "example": "example sentence", "synonyms": ["synonym1"], "pronunciation": "/pronunciation/"}],' : ''}
  ${skill === 'writing' ? '"prompt": "Writing prompt", "instructions": ["instruction1", "instruction2"], "minWords": 50, "maxWords": 100,' : ''}
  ${skill === 'speaking' ? '"instructions": "Speaking instructions", "prompts": ["prompt1", "prompt2"], "expectedDuration": 90,' : ''}
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0,
      "points": 10,
      "explanation": "Why this is correct"
    }
  ]
}

Make sure all JSON is valid and properly formatted.`;

  return prompt;
}

function calculateLessonPoints(level: string, questionCount: number): number {
  const basePoints = { beginner: 10, intermediate: 15, advanced: 20 };
  return (basePoints[level as keyof typeof basePoints] || 10) * questionCount;
}

export async function generateAdaptiveLessons(
  skill: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  count: number = 5,
  userPerformance?: UserPerformance
): Promise<GeneratedLesson[]> {
  const lessons: GeneratedLesson[] = [];
  
  for (let i = 1; i <= count; i++) {
    try {
      const lesson = await generateLesson(skill, level, i, userPerformance);
      lessons.push(lesson);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to generate lesson ${i}:`, error);
      // Continue with other lessons even if one fails
    }
  }
  
  return lessons;
}