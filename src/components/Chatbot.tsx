import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

const GEMINI_API_KEY = 'AIzaSyC1U4B2azzXyJwfO6byo_UHTJlb3MVU2uw';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your English learning assistant. Ask me anything about grammar, vocabulary, pronunciation, or English usage!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const prompt = `
You are an expert English teacher and tutor. A student has asked you: "${inputText}"

Please provide a helpful, detailed response that:
1. Directly answers their question
2. Includes clear explanations
3. Provides examples when relevant
4. Uses simple language they can understand
5. Encourages further learning

If it's about grammar, explain the rule and give examples.
If it's about vocabulary, provide definitions, synonyms, and usage examples.
If it's about pronunciation, describe how to pronounce it.
If it's about usage, show different contexts.

Keep your response conversational but educational.
`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      });
      
      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again in a moment!",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-40 ${isOpen ? 'hidden' : ''}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50"
          >
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-semibold">English Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about English grammar, vocabulary, or usage..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}