// Language detection utility
const languagePatterns = {
  english: /^[a-zA-Z\s.,!?'"()-]+$/,
  hindi: /[\u0900-\u097F]/,
  bengali: /[\u0980-\u09FF]/,
  hinglish: /[a-zA-Z]+.*[\u0900-\u097F]|[\u0900-\u097F].*[a-zA-Z]+/,
  benglish: /[a-zA-Z]+.*[\u0980-\u09FF]|[\u0980-\u09FF].*[a-zA-Z]+/
};

exports.detectLanguage = (text) => {
  if (!text) return 'english';

  // Check for mixed languages first
  if (languagePatterns.hinglish.test(text)) return 'hinglish';
  if (languagePatterns.benglish.test(text)) return 'benglish';
  
  // Check for pure languages
  if (languagePatterns.hindi.test(text)) return 'hindi';
  if (languagePatterns.bengali.test(text)) return 'bengali';
  
  // Default to English
  return 'english';
};

// Emotional keyword detection
exports.detectEmotion = (text) => {
  const emotionalKeywords = {
    sad: ['sad', 'upset', 'down', 'depressed', 'unhappy', 'crying', 'दुखी', 'উদাস'],
    tired: ['tired', 'exhausted', 'sleepy', 'weary', 'थका', 'ক্লান্ত'],
    stressed: ['stressed', 'anxious', 'worried', 'nervous', 'तनाव', 'চাপ'],
    angry: ['angry', 'mad', 'furious', 'annoyed', 'गुस्सा', 'রাগ'],
    happy: ['happy', 'excited', 'joy', 'glad', 'खुश', 'আনন্দ']
  };

  const lowerText = text.toLowerCase();
  
  for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return emotion;
      }
    }
  }
  
  return null;
};
