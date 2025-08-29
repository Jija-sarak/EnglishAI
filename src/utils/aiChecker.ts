const GEMINI_API_KEY = 'AIzaSyC1U4B2azzXyJwfO6byo_UHTJlb3MVU2uw';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface AIFeedback {
  correct: boolean;
  score: number; // 0-100
  feedback: string;
}

export async function checkOpenAnswer(question: string, userAnswer: string, context?: string): Promise<AIFeedback> {
  try {
    const prompt = `
You are an English teacher evaluating a student's answer. Please provide structured feedback.

Question: ${question}
${context ? `Context: ${context}` : ''}
Student's Answer: ${userAnswer}

Please evaluate the answer and respond in this exact JSON format:
{
  "correct": true/false,
  "score": number (0-100),
  "feedback": "detailed feedback explaining what's good and what could be improved"
}

Consider grammar, vocabulary, content relevance, and completeness in your evaluation.
`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Try to parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }
    
    // Fallback response if JSON parsing fails
    return {
      correct: userAnswer.trim().length > 10,
      score: userAnswer.trim().length > 10 ? 75 : 25,
      feedback: responseText || 'Good effort! Keep practicing to improve your English skills.'
    };
    
  } catch (error) {
    console.error('Error checking answer with AI:', error);
    return {
      correct: false,
      score: 0,
      feedback: 'Unable to evaluate your answer at the moment. Please try again later.'
    };
  }
}

export async function checkSpeakingAnswer(prompt: string, transcript: string): Promise<AIFeedback> {
  return checkOpenAnswer(
    `Speaking prompt: ${prompt}`,
    transcript,
    'This is a speaking exercise. Evaluate pronunciation, fluency, grammar, and content.'
  );
}

export async function checkWritingAnswer(prompt: string, essay: string, minWords?: number): Promise<AIFeedback> {
  const wordCount = essay.trim().split(/\s+/).length;
  const context = `This is a writing exercise. ${minWords ? `Minimum words required: ${minWords}. ` : ''}Word count: ${wordCount}. Evaluate grammar, vocabulary, structure, and content.`;
  
  return checkOpenAnswer(prompt, essay, context);
}