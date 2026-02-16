import { CONTACTS } from '../constants';
import { SecurityService } from './securityService';

export interface ProcessedCommand {
  actionType: string;
  response: string;
  spokenResponse?: string;
  language: 'en' | 'hi';
  externalUrl?: string;
  data?: any;
}

// Keywords for robust language scoring
const HINDI_KEYWORDS = new Set([
  'kholo', 'band', 'karo', 'chalao', 'bhejo', 'kaun', 'kya', 'hai', 'samay', 
  'tareekh', 'din', 'aaj', 'kal', 'suno', 'sun', 'raha', 'hu', 'mujhe', 'tum', 'aap',
  'namaste', 'shukriya', 'dhanyavad', 'kaise', 'madad', 'sakte', 'ho', 'btao', 'batao',
  'dekhna', 'ruko', 'dheere', 'tez', 'badhao', 'kam', 'aawaz', 'par', 'ko', 'me', 
  'se', 'ka', 'ki', 'aur', 'kahan', 'kab', 'kyu', 'kaise', 'open', 'karo' // 'open karo' common hinglish
]);

const ENGLISH_KEYWORDS = new Set([
  'open', 'close', 'play', 'send', 'message', 'tell', 'what', 'is', 'the', 'time', 'date',
  'today', 'who', 'are', 'you', 'hello', 'hi', 'thank', 'thanks', 'help', 'commands', 'features', 'list',
  'search', 'volume', 'increase', 'decrease', 'navigate', 'go', 'to', 'for', 'on',
  'can', 'please', 'start', 'stop'
]);

// Helper to robustly detect language based on script and keywords
const detectLanguage = (text: string): 'en' | 'hi' => {
  const lowerText = text.toLowerCase();
  
  // 1. Script Check (Absolute confidence for Devanagari)
  const devanagariRange = /[\u0900-\u097F]/;
  if (devanagariRange.test(text)) {
    return 'hi';
  }

  // 2. Keyword Scoring for Latin script (Hinglish vs English)
  // Clean text: remove punctuation
  const tokens = lowerText.replace(/[^\w\s]/g, '').split(/\s+/);
  
  let hiScore = 0;
  let enScore = 0;

  tokens.forEach(t => {
    // Exact match check
    if (HINDI_KEYWORDS.has(t)) hiScore++;
    if (ENGLISH_KEYWORDS.has(t)) enScore++;
  });

  // Bias towards Hindi if scores are equal but contained known Hinglish markers
  // Otherwise default to English as it's the global default for Latin script
  if (hiScore > enScore) return 'hi';
  if (enScore > hiScore) return 'en';
  
  return 'en'; // Default fallback
};

export const processTranscript = (text: string): ProcessedCommand => {
  // 1. Security Sanitization
  const cleanText = SecurityService.sanitizeCommand(text);
  const lowerText = cleanText.toLowerCase();
  const detectedLang = detectLanguage(cleanText);
  const isHindi = detectedLang === 'hi';

  // 2. Phishing/Threat Detection
  if (SecurityService.analyzeForPhishing(cleanText)) {
    return {
      actionType: 'SECURITY_ALERT',
      response: isHindi 
        ? "चेतावनी: संवेदनशील जानकारी साझा न करें। यह एक सुरक्षा जोखिम हो सकता है।" 
        : "SECURITY ALERT: Sensitive information detected. Do not share passwords or OTPs.",
      spokenResponse: isHindi
        ? "चेतावनी। सुरक्षा प्रोटोकॉल सक्रिय। संवेदनशील डेटा साझा न करें।"
        : "Security protocol engaged. Potential phishing attempt detected.",
      language: detectedLang
    };
  }

  // --- Help / Madad ---
  if (
    lowerText.includes('help') ||
    lowerText.includes('madad') ||
    lowerText.match(/(?:what|kya)\s+(?:can|sakte)\s+(?:you|tum|aap)\s+(?:do|karo|ho)/) ||
    lowerText.includes('commands') ||
    lowerText.includes('features') ||
    lowerText.includes('capabilities')
  ) {
    if (isHindi) {
      return {
        actionType: 'HELP',
        response: `उपलब्ध कमांड्स (Capabilities):
• नेविगेशन: "गूगल खोलो", "फेसबुक पर जाओ"
• मीडिया: "YouTube पर गाने चलाओ"
• मैसेजिंग: "मम्मी को मैसेज भेजो नमस्ते"
• सिस्टम: "समय क्या है?", "आवाज़ बढ़ाओ"`,
        spokenResponse: "मैं वेब नेविगेशन, मीडिया प्लेबैक, और मैसेजिंग में सहायता कर सकता हूँ। कृपया स्क्रीन पर दी गई सूची देखें।",
        language: 'hi'
      };
    } else {
      return {
        actionType: 'HELP',
        response: `System Capabilities:
• Navigation: "Open Google", "Go to Twitter"
• Media: "Play Iron Man trailer on YouTube"
• Messaging: "Send message to Mom saying I'm home"
• System: "What time is it?", "Volume up"`,
        spokenResponse: "I can assist with navigation, media, and communication protocols. Displaying available command syntax now.",
        language: 'en'
      };
    }
  }

  // --- Greetings ---
  if (
    lowerText.match(/^(hello|hi|hey|greetings)/) || 
    lowerText.includes('hi jarvis') || 
    lowerText.match(/(?:नमस्ते|namaste|hello|pranam)/)
  ) {
    return {
      actionType: 'GREETING',
      response: isHindi ? "नमस्ते सर, मैं आपकी कैसे मदद कर सकता हूँ?" : "Hello Sir, how can I help you?",
      language: detectedLang
    };
  }

  if (
    lowerText.includes('thank') || 
    lowerText.includes('dhanyavad') || 
    lowerText.includes('shukriya') ||
    lowerText.includes('धन्यवाद') || 
    lowerText.includes('शुक्रिया')
  ) {
    return {
      actionType: 'GREETING',
      response: isHindi ? "आपका स्वागत है सर।" : "You're welcome, Sir.",
      language: detectedLang
    };
  }

  if (
    lowerText.includes('who are you') || 
    lowerText.match(/(?:tum|aap)\s+(?:kaun|kon)\s+(?:ho|hai)/) || 
    lowerText.includes('तुम कौन हो')
  ) {
    return {
      actionType: 'IDENTITY',
      response: isHindi 
        ? "मैं JARVIS हूँ, आपका निजी AI सहायक।" 
        : "I am JARVIS, your personal AI assistant.",
      language: detectedLang
    };
  }

  // --- Web Navigation ---
  // Regex updated to handle Hinglish (Latin script Hindi)
  const webMatch = 
    lowerText.match(/(?:open|go to|navigate to|visit)\s+(.+)/i) || 
    lowerText.match(/(.+)\s+(?:kho(?:\s*)lo|kholo|open karo|par jao|par jaiye|chalo)/i) ||
    lowerText.match(/(.+)\s+(?:खोलो|पर जाओ|ओपन करो)/i) ||
    lowerText.match(/(?:वेबसाइट खोलो|website kholo)\s+(.+)/i);

  // Exclude other commands if they accidentally match "open" structure
  if (webMatch && !lowerText.includes('youtube') && !lowerText.includes('whatsapp') && !lowerText.includes('message')) {
    let site = webMatch[1].replace(/(?:website|vebsite|dot com|daat kaam)/gi, '').trim();
    // Remove trailing Hindi particles often caught in capture group
    site = site.replace(/\s+(?:kholo|karo|open|please)$/i, '');
    
    // Fix common speech-to-text formatting
    site = site.replace(/\s+dot\s+com/g, '.com').replace(/\s+/g, '');
    
    if (!site.includes('.')) site += '.com';
    
    return {
      actionType: 'NAVIGATION',
      response: isHindi ? `${site} खोल रहा हूँ।` : `Opening ${site}.`,
      language: detectedLang,
      externalUrl: `https://www.${site}`
    };
  }

  // --- YouTube ---
  const youtubeMatch = 
    // English
    lowerText.match(/(?:play|search|watch)\s+(.+?)\s+(?:on|in)\s+youtube/i) ||
    // Hinglish/Hindi: "song name youtube par chalao"
    lowerText.match(/(.+?)\s+(?:ko|ka)?\s*(?:youtube\s+(?:par|pe)|on\s+youtube)\s+(?:chalao|dekho|dekhna|play|search)/i) ||
    // Hinglish/Hindi: "youtube par song name"
    lowerText.match(/(?:youtube\s+(?:par|pe)|on\s+youtube)\s+(.+?)\s+(?:chalao|dekho|search|dhoondo)/i) ||
    // Devanagari
    lowerText.match(/(.+)\s+(?:चलाओ|chalao)\s+(?:youtube\s+par|यूट्यूब\s+पर)/i) ||
    lowerText.match(/(?:youtube\s+par|यूट्यूब\s+पर)\s+(.+)\s+(?:search|सर्च|dekhna)/i);

  if (youtubeMatch) {
    const query = youtubeMatch[1].trim();
    return {
      actionType: 'YOUTUBE',
      response: isHindi 
        ? `YouTube पर ${query} खोज रहा हूँ।` 
        : `Searching for ${query} on YouTube.`,
      language: detectedLang,
      externalUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    };
  }

  // --- WhatsApp ---
  const whatsappEnglish = lowerText.match(/(?:send\s+message|msg|text)\s+to\s+(.+?)\s+(?:saying|that|:)\s+(.+)/i);
  
  // Hinglish/Hindi: "mom ko message bhejo hello"
  const whatsappHindi = 
    lowerText.match(/(.+?)\s+(?:ko|se)\s+(?:message|msg|sandesh)\s+(?:bhejo|karo|do)(?:\s+ki|\s+saying)?\s+(.+)/i) ||
    lowerText.match(/(.+?)\s+(?:ko|se)\s+(?:kaho|bolo)\s+(.+)/i) || 
    lowerText.match(/(.+?)\s+को\s+मैसेज\s+भेजो\s+(.+)/i) ||
    lowerText.match(/(.+?)\s+को\s+कहो\s+(.+)/i) ||
    lowerText.match(/व्हाट्सएप\s+पर\s+(.+?)\s+को\s+संदेश\s+दो\s+(.+)/i);

  const waMatch = whatsappEnglish || whatsappHindi;

  if (waMatch) {
    const rawName = waMatch[1].trim();
    const message = waMatch[2].trim();
    
    // Normalize name lookup
    const contactNumber = CONTACTS[rawName] || CONTACTS[rawName.toLowerCase()];
    
    if (contactNumber) {
      // Validate Number using Security Service
      if (!SecurityService.validateWhatsAppNumber(contactNumber)) {
        return {
          actionType: 'ERROR',
          response: isHindi
            ? `त्रुटि: संपर्क ${rawName} का नंबर अमान्य प्रारूप में है।`
            : `Error: Contact number for ${rawName} is invalid.`,
          language: detectedLang
        };
      }

      return {
        actionType: 'WHATSAPP',
        response: isHindi 
          ? `WhatsApp खोल रहा हूँ। ${rawName} को संदेश: "${message}"`
          : `Opening WhatsApp. Messaging ${rawName}: "${message}"`,
        language: detectedLang,
        externalUrl: `https://wa.me/${contactNumber}?text=${encodeURIComponent(message)}`
      };
    } else {
      return {
        actionType: 'ERROR',
        response: isHindi 
          ? `संपर्क सूची में '${rawName}' नहीं मिला।`
          : `Contact '${rawName}' not found in database.`,
        language: detectedLang
      };
    }
  }

  // --- Time & Date ---
  if (
    lowerText.includes('time') || 
    lowerText.includes('samay') || 
    lowerText.includes('समय') ||
    lowerText.includes('baje') ||
    lowerText.match(/kya\s+baj\s+raha\s+hai/)
  ) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      actionType: 'TIME',
      response: isHindi 
        ? `अभी समय ${timeStr} है।` 
        : `Current time is ${timeStr}.`,
      language: detectedLang
    };
  }

  if (
    lowerText.includes('date') || 
    lowerText.includes('tareekh') || 
    lowerText.includes('तारीख') ||
    lowerText.includes('din') ||
    lowerText.includes('day')
  ) {
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
      actionType: 'DATE',
      response: isHindi 
        ? `आज की तारीख है ${dateStr}।` 
        : `Today's date is ${dateStr}.`,
      language: detectedLang
    };
  }

  // --- Volume Control ---
  if (
    lowerText.includes('increase') || 
    lowerText.includes('up') || 
    lowerText.includes('badao') || 
    lowerText.includes('badhao') ||
    lowerText.includes('tez') ||
    lowerText.includes('ज्यादा') ||
    lowerText.includes('बढ़ाओ')
  ) {
    if (lowerText.includes('volume') || lowerText.includes('aawaz') || lowerText.includes('sound')) {
      return {
        actionType: 'VOLUME_UP',
        response: isHindi ? "आवाज़ बढ़ा रहा हूँ।" : "Increasing volume.",
        language: detectedLang
      };
    }
  }

  if (
    lowerText.includes('decrease') || 
    lowerText.includes('down') || 
    lowerText.includes('kam') || 
    lowerText.includes('dheere') || 
    lowerText.includes('low') ||
    lowerText.includes('ghatao') ||
    lowerText.includes('कम')
  ) {
    if (lowerText.includes('volume') || lowerText.includes('aawaz') || lowerText.includes('sound')) {
      return {
        actionType: 'VOLUME_DOWN',
        response: isHindi ? "आवाज़ कम कर रहा हूँ।" : "Decreasing volume.",
        language: detectedLang
      };
    }
  }

  // --- Default Fallback ---
  return {
    actionType: 'UNKNOWN',
    response: isHindi ? "क्षमा करें, मुझे समझ नहीं आया।" : "I'm sorry, I didn't understand that command.",
    language: detectedLang
  };
};