const AboutMe = require('../models/AboutMe');
const User = require('../models/User');
const { detectLanguage, detectEmotion } = require('../utils/language');

/**
 * Automation Service - Updated for Firebase/Firestore
 * Bot mode system: "on" | "manual" | "auto" (per DM/Group)
 * AboutMe data is admin-only and UID-based
 * No presence-based logic
 */

class AutomationService {
  constructor() {
    this.aboutMeCache = {};
    this.lastCacheUpdate = {};
  }

  /**
   * Load AboutMe data for a specific admin
   * @param {string} adminUid - Admin's UID
   */
  async loadAboutMe(adminUid) {
    if (!this.aboutMeCache[adminUid] || Date.now() - this.lastCacheUpdate[adminUid] > 60000) {
      const factsMap = await AboutMe.getFactsMap(adminUid);
      this.aboutMeCache[adminUid] = factsMap;
      this.lastCacheUpdate[adminUid] = Date.now();
    }
    return this.aboutMeCache[adminUid];
  }

  /**
   * Determine if bot should auto-reply
   * @param {string} chatId - Chat ID
   * @param {string} chatType - 'dm' or 'group'
   * @param {string} botMode - 'on' | 'manual' | 'auto'
   * @param {boolean} isAdminActive - Whether admin is currently active
   * @returns {boolean}
   */
  async shouldAutoReply(chatId, chatType, botMode, isAdminActive) {
    // MANUAL mode - never auto reply
    if (botMode === 'manual') return false;

    // ON mode - always auto reply
    if (botMode === 'on') return true;

    // AUTO mode - smart decision based on admin activity
    if (botMode === 'auto') {
      // If admin is active, don't auto reply
      if (isAdminActive) return false;
      
      // Otherwise, auto reply
      return true;
    }

    return false;
  }

  /**
   * Generate automated reply
   * @param {string} message - User's message
   * @param {string} relationshipType - Relationship type
   * @param {string} language - Detected language
   * @param {string} adminUid - Admin's UID for AboutMe lookup
   */
  async generateReply(message, relationshipType, language, adminUid) {
    const emotion = detectEmotion(message);
    
    // Get admin's AboutMe data
    const aboutMe = await this.loadAboutMe(adminUid);

    // Check if message asks about something in AboutMe
    const lowerMessage = message.toLowerCase();
    for (const [key, value] of Object.entries(aboutMe)) {
      if (lowerMessage.includes(key)) {
        return this.formatReply(value, language, relationshipType, emotion);
      }
    }

    // If no match in AboutMe, return fallback
    return this.getFallbackReply(language);
  }

  /**
   * Get fallback reply when information is not in AboutMe
   * Bot must NEVER guess personal facts
   * @param {string} language - Detected language
   * @returns {string} Fallback response message
   */
  getFallbackReply(language) {
    const fallbacks = {
      english: "I'm not sure about that yet.",
      hindi: "मुझे इसके बारे में अभी तक पता नहीं है।",
      bengali: "আমি এখনও এটি সম্পর্কে নিশ্চিত নই।",
      hinglish: "Mujhe iske bare mein abhi tak pata nahi hai.",
      benglish: "Ami ekhono eta somporke nischit noi."
    };
    
    return fallbacks[language] || fallbacks.english;
  }

  generateContextualReply(message, relationshipType, emotion, language) {
    // If emotional context detected, respond appropriately (no jokes/roasts)
    if (emotion && ['sad', 'tired', 'stressed', 'angry'].includes(emotion)) {
      return this.getEmotionalResponse(emotion, relationshipType, language);
    }

    // Generate reply based on relationship type
    return this.getRelationshipBasedReply(message, relationshipType, language);
  }

  getEmotionalResponse(emotion, relationshipType, language) {
    const responses = {
      sad: {
        english: "I'm here for you. Want to talk about it?",
        hindi: "मैं यहाँ हूँ। बात करना चाहोगे?",
        bengali: "আমি এখানে আছি। কথা বলতে চাও?",
        hinglish: "Main yahan hoon. Baat karni hai?",
        benglish: "Ami ekhane achi. Kotha bolte chao?"
      },
      stressed: {
        english: "Take a deep breath. Everything will be okay.",
        hindi: "एक गहरी सांस लो। सब ठीक हो जाएगा।",
        bengali: "একটা গভীর শ্বাস নাও। সব ঠিক হয়ে যাবে।",
        hinglish: "Ek deep breath lo. Sab theek ho jayega.",
        benglish: "Ekta deep breath nao. Sob thik hoye jabe."
      },
      tired: {
        english: "You should rest. Take care of yourself.",
        hindi: "तुम्हें आराम करना चाहिए। अपना ख्याल रखो।",
        bengali: "তোমার বিশ্রাম নেওয়া উচিত। নিজের যত্ন নাও।",
        hinglish: "Tumhe rest karna chahiye. Apna khayal rakho.",
        benglish: "Tomar rest neoa uchit. Nije r jotno nao."
      }
    };

    return responses[emotion]?.[language] || responses[emotion]?.english || "I understand.";
  }

  getRelationshipBasedReply(message, relationshipType, language) {
    const greetings = ['hi', 'hello', 'hey', 'नमस्ते', 'হাই', 'হ্যালো'];
    const isGreeting = greetings.some(g => message.toLowerCase().includes(g));

    if (isGreeting) {
      const greetingResponses = {
        close_friend: {
          english: "Hey! What's up?",
          hindi: "अरे! क्या चल रहा है?",
          bengali: "হেই! কী চলছে?",
          hinglish: "Hey! Kya chal raha hai?",
          benglish: "Hey! Ki cholche?"
        },
        brother: {
          english: "Hey bro! How's it going?",
          hindi: "अरे भाई! कैसा चल रहा है?",
          bengali: "হে ভাই! কেমন চলছে?",
          hinglish: "Hey bhai! Kaisa chal raha hai?",
          benglish: "Hey bhai! Kemon cholche?"
        },
        sister: {
          english: "Hi! How are you?",
          hindi: "नमस्ते! कैसी हो?",
          bengali: "হাই! কেমন আছো?",
          hinglish: "Hi! Kaisi ho?",
          benglish: "Hi! Kemon acho?"
        },
        crush: {
          english: "Hi there! How have you been?",
          hindi: "नमस्ते! कैसे हो?",
          bengali: "হ্যালো! কেমন আছেন?",
          hinglish: "Hi! Kaise ho?",
          benglish: "Hello! Kemon achen?"
        },
        customer: {
          english: "Hello! How can I help you today?",
          hindi: "नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूं?",
          bengali: "হ্যালো! আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
          hinglish: "Hello! Aaj main aapki kaise madad kar sakta hoon?",
          benglish: "Hello! Aj ami apnake kibhabe shahajjo korte pari?"
        }
      };

      return greetingResponses[relationshipType]?.[language] || 
             greetingResponses[relationshipType]?.english || 
             "Hello!";
    }

    // Default safe responses
    const defaultResponses = {
      english: "Got it. Let me know if you need anything.",
      hindi: "समझ गया। अगर कुछ चाहिए तो बताना।",
      bengali: "বুঝলাম। কিছু লাগলে বলো।",
      hinglish: "Samajh gaya. Agar kuch chahiye to batana.",
      benglish: "Bujhlam. Kichu lagle bolo."
    };

    return defaultResponses[language] || defaultResponses.english;
  }

  formatReply(content, language, relationshipType, emotion) {
    // For crush relationship, extra safe formatting
    if (relationshipType === 'crush') {
      return content;
    }

    // For emotional contexts, just return content as-is
    if (emotion && ['sad', 'tired', 'stressed', 'angry'].includes(emotion)) {
      return content;
    }

    return content;
  }

  addHumanDelay() {
    // Return delay in milliseconds (1-3 seconds for human-like typing)
    return Math.floor(Math.random() * 2000) + 1000;
  }

  async processMessageCommand(command, message) {
    switch (command) {
      case '@fix':
        return this.fixGrammar(message);
      case '@emoji':
        return this.addEmoji(message);
      case '@short':
        return this.shortenMessage(message);
      case '@polite':
        return this.makePolite(message);
      default:
        return message;
    }
  }

  fixGrammar(message) {
    // Basic grammar fixes
    let fixed = message.trim();
    fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);
    if (!/[.!?]$/.test(fixed)) {
      fixed += '.';
    }
    return fixed;
  }

  addEmoji(message) {
    const emojiMap = {
      'happy': ' 😊',
      'sad': ' 😢',
      'love': ' ❤️',
      'laugh': ' 😂',
      'great': ' 👍',
      'thanks': ' 🙏',
      'okay': ' 👌'
    };

    const lowerMsg = message.toLowerCase();
    for (const [keyword, emoji] of Object.entries(emojiMap)) {
      if (lowerMsg.includes(keyword)) {
        return message + emoji;
      }
    }
    return message + ' 👍';
  }

  shortenMessage(message) {
    const words = message.split(' ');
    if (words.length <= 10) return message;
    
    return words.slice(0, 10).join(' ') + '...';
  }

  makePolite(message) {
    let polite = message;
    
    // Add polite words if not present
    if (!polite.toLowerCase().includes('please') && !polite.toLowerCase().includes('कृपया')) {
      polite = 'Please ' + polite.toLowerCase();
    }
    
    if (!polite.includes('thank') && !polite.includes('धन्यवाद')) {
      polite += '. Thank you.';
    }
    
    return polite.charAt(0).toUpperCase() + polite.slice(1);
  }

  /**
   * Get admin UID (helper function)
   * Returns the first user with role === 'admin'
   */
  async getAdminUid() {
    const admin = await User.findByRole('admin');
    return admin ? admin.id : null;
  }
}

module.exports = new AutomationService();
