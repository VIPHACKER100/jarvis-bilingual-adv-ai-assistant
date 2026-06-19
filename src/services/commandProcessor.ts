import { CONTACTS } from '../constants';
import { SecurityService } from './securityService';

export interface ProcessedCommand {
  actionType: string;
  response: string;
  spokenResponse?: string;
  language: 'en' | 'hi';
  externalUrl?: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const MODEL_NAME = import.meta.env.VITE_MODEL_NAME || "nvidia/nemotron-3-nano-30b-a3b:free";

const CREATOR_INFO = {
  name: "Aryan Ahirwar",
  alias: "VIPHACKER100",
  title: "Cybersecurity Expert | Ethical Hacker | Penetration Tester | Bug Bounty Hunter",
  role: "Founder & CEO of VIPHACKER.100",
  website: "https://viphacker100.com",
  github: "https://github.com/viphacker100",
  linkedin: "https://linkedin.com/in/viphacker100",
  instagram: "https://instagram.com/viphacker100",
  expertise: [
    "Web Application Penetration Testing",
    "Bug Bounty Hunting",
    "OSINT (Open Source Intelligence)",
    "CTF Challenges & Walkthroughs",
    "Security Tool Development",
    "Network Security & Infrastructure Testing",
    "Ethical Hacking & Red Team Operations"
  ],
  about_en: `I was built by Aryan Ahirwar — alias VIPHACKER100 — a passionate Cybersecurity Expert and the Founder & CEO of VIPHACKER.100. He specialises in ethical hacking, web application penetration testing, bug bounty hunting, OSINT, and security tool development.`,
  about_hi: `मुझे अर्यन अहिरवार ने बनाया है — जिन्हें VIPHACKER100 के नाम से भी जाना जाता है। वे एक जुनूनी साइबर सुरक्षा विशेषज्ञ और VIPHACKER.100 के संस्थापक व CEO हैं।`
};

const HINDI_KEYWORDS = new Set([
  'kholo', 'band', 'karo', 'chalao', 'bhejo', 'kaun', 'kya', 'hai', 'samay',
  'tareekh', 'din', 'aaj', 'kal', 'suno', 'sun', 'raha', 'hu', 'mujhe', 'tum', 'aap',
  'namaste', 'shukriya', 'dhanyavad', 'kaise', 'madad', 'sakte', 'ho', 'btao', 'batao',
  'dekhna', 'ruko', 'dheere', 'tez', 'badhao', 'kam', 'aawaz', 'par', 'ko', 'me',
  'se', 'ka', 'ki', 'aur', 'kahan', 'kab', 'kyu', 'open',
  'mausam', 'tapman', 'garmi', 'sardi', 'hisab', 'jodo', 'ghatao', 'guna', 'bhag'
]);

const ENGLISH_KEYWORDS = new Set([
  'open', 'close', 'play', 'send', 'message', 'tell', 'what', 'is', 'the', 'time', 'date',
  'today', 'who', 'are', 'you', 'hello', 'hi', 'thank', 'thanks', 'help', 'commands', 'features', 'list',
  'search', 'volume', 'increase', 'decrease', 'navigate', 'go', 'to', 'for', 'on',
  'can', 'please', 'start', 'stop', 'weather', 'temperature', 'forecast', 'calculate', 'solve', 'math', 'plus', 'minus', 'times', 'divided'
]);

const detectLanguage = (text: string): 'en' | 'hi' => {
  const lowerText = text.toLowerCase();
  const devanagariRange = /[\u0900-\u097F]/;
  if (devanagariRange.test(text)) return 'hi';
  const tokens = lowerText.replace(/[^\w\s]/g, '').split(/\s+/);
  let hiScore = 0;
  let enScore = 0;
  tokens.forEach(t => {
    if (HINDI_KEYWORDS.has(t)) hiScore++;
    if (ENGLISH_KEYWORDS.has(t)) enScore++;
  });
  if (hiScore > enScore) return 'hi';
  if (enScore > hiScore) return 'en';
  return 'en';
};

export const processTranscript = async (text: string): Promise<ProcessedCommand> => {
  const cleanText = SecurityService.sanitizeCommand(text);
  const lowerText = cleanText.toLowerCase();
  const detectedLang = detectLanguage(cleanText);
  const isHindi = detectedLang === 'hi';

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
        response: `उपलब्ध कमांड्स:\n• नेविगेशन: "गूगल खोलो", "फेसबुक पर जाओ"\n• मीडिया: "YouTube पर गाने चलाओ"\n• मैसेजिंग: "मम्मी को मैसेज भेजो नमस्ते"\n• सिस्टम: "समय क्या है?", "आवाज़ बढ़ाओ"`,
        spokenResponse: "मैं वेब नेविगेशन, मीडिया प्लेबैक, और मैसेजिंग में सहायता कर सकता हूँ। कृपया स्क्रीन पर दी गई सूची देखें।",
        language: 'hi'
      };
    } else {
      return {
        actionType: 'HELP',
        response: `System Capabilities:\n• Navigation: "Open Google", "Go to Twitter"\n• Media: "Play Iron Man trailer on YouTube"\n• Messaging: "Send message to Mom saying I'm home"\n• System: "What time is it?", "Volume up", "Weather in Delhi", "Calculate 5 plus 3"`,
        spokenResponse: "I can assist with navigation, media, communication, weather updates and calculations. Displaying available command syntax now.",
        language: 'en'
      };
    }
  }

  if (lowerText.match(/^(hello|hi|hey|greetings)/) || lowerText.includes('hi jarvis') || lowerText.match(/(?:नमस्ते|namaste|hello|pranam)/)) {
    return {
      actionType: 'GREETING',
      response: isHindi ? "नमस्ते! मैं आपकी किस तरह सहायता कर सकता हूँ?" : "Hello! How can I assist you today?",
      language: detectedLang
    };
  }

  if (lowerText.includes('thank') || lowerText.includes('dhanyavad') || lowerText.includes('shukriya') || lowerText.includes('धन्यवाद') || lowerText.includes('शुक्रिया')) {
    return {
      actionType: 'GREETING',
      response: isHindi ? "आपका स्वागत है!" : "You're welcome!",
      language: detectedLang
    };
  }

  if (lowerText.includes('who are you') || lowerText.match(/(?:tum|aap)\s+(?:kaun|kon)\s+(?:ho|hai)/) || lowerText.includes('तुम कौन हो') || lowerText.includes('introduce yourself')) {
    return {
      actionType: 'IDENTITY',
      response: isHindi
        ? `मैं जार्विस हूँ — ${CREATOR_INFO.name} (VIPHACKER100) द्वारा निर्मित आपका निजी AI सहायक।`
        : `I'm JARVIS — your personal AI assistant, built by ${CREATOR_INFO.name} (VIPHACKER100), ${CREATOR_INFO.role}.`,
      language: detectedLang
    };
  }

  if (
    lowerText.match(/who\s+(made|built|created|developed)\s+(you|jarvis)/i) ||
    lowerText.match(/who\s+is\s+your\s+(creator|developer|maker|owner|boss)/i) ||
    lowerText.includes('aryan ahirwar') ||
    lowerText.includes('viphacker100') ||
    lowerText.match(/(?:tumhe|aapko|tujhe)\s+(?:kisne|kaun)\s+(?:banaya|banaaya|develop|create)/i) ||
    lowerText.includes('तुम्हें किसने बनाया')
  ) {
    return {
      actionType: 'CREATOR_INFO',
      response: isHindi ? CREATOR_INFO.about_hi : CREATOR_INFO.about_en,
      spokenResponse: isHindi
        ? `मुझे अर्यन अहिरवार ने बनाया है, जो VIPHACKER.100 के संस्थापक और CEO हैं।`
        : `I was created by Aryan Ahirwar, the Founder and CEO of VIPHACKER.100, a cybersecurity expert.`,
      language: detectedLang
    };
  }

  const webMatch = lowerText.match(/(?:open|go to|navigate to|visit)\s+(.+)/i) ||
    lowerText.match(/(.+)\s+(?:kho(?:\s*)lo|kholo|open karo|par jao|par jaiye|chalo)/i) ||
    lowerText.match(/(.+)\s+(?:खोलो|पर जाओ|ओपन करो)/i);

  if (webMatch && !lowerText.includes('youtube') && !lowerText.includes('whatsapp') && !lowerText.includes('message')) {
    let site = webMatch[1].replace(/(?:website|vebsite|dot com|daat kaam)/gi, '').trim();
    site = site.replace(/\s+(?:kholo|karo|open|please)$/i, '');
    site = site.replace(/\s+dot\s+com/g, '.com').replace(/\s+/g, '');
    if (!site.includes('.')) site += '.com';
    return {
      actionType: 'NAVIGATION',
      response: isHindi ? `${site} खोल रहा हूँ।` : `Opening ${site}.`,
      language: detectedLang,
      externalUrl: `https://www.${site}`
    };
  }

  const youtubeMatch = lowerText.match(/(?:play|search|watch)\s+(.+?)\s+(?:on|in)\s+youtube/i) ||
    lowerText.match(/(.+?)\s+(?:ko|ka)?\s*(?:youtube\s+(?:par|pe)|on\s+youtube)\s+(?:chalao|dekho|dekhna|play|search)/i);

  if (youtubeMatch) {
    const query = youtubeMatch[1].trim();
    return {
      actionType: 'YOUTUBE',
      response: isHindi ? `YouTube पर ${query} खोज रहा हूँ।` : `Searching for ${query} on YouTube.`,
      language: detectedLang,
      externalUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    };
  }

  const whatsappEnglish = lowerText.match(/(?:send\s+message|msg|text)\s+to\s+(.+?)\s+(?:saying|that|:)\s+(.+)/i);
  const whatsappHindi = lowerText.match(/(.+?)\s+(?:ko|se)\s+(?:message|msg|sandesh)\s+(?:bhejo|karo|do)(?:\s+ki|\s+saying)?\s+(.+)/i) ||
    lowerText.match(/(.+?)\s+(?:ko|se)\s+(?:kaho|bolo)\s+(.+)/i);

  const waMatch = whatsappEnglish || whatsappHindi;
  if (waMatch) {
    const rawName = waMatch[1].trim();
    const message = waMatch[2].trim();
    const contactNumber = CONTACTS[rawName] || CONTACTS[rawName.toLowerCase()];
    if (contactNumber) {
      return {
        actionType: 'WHATSAPP',
        response: isHindi ? `WhatsApp खोल रहा हूँ। ${rawName} को संदेश: "${message}"` : `Opening WhatsApp. Messaging ${rawName}: "${message}"`,
        language: detectedLang,
        externalUrl: `https://wa.me/${contactNumber}?text=${encodeURIComponent(message)}`
      };
    }
  }

  if (lowerText.includes('time') || lowerText.includes('samay') || lowerText.includes('समय') || lowerText.includes('baje') || lowerText.match(/kya\s+baj\s+raha\s+hai/)) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      actionType: 'TIME',
      response: isHindi ? `अभी ${timeStr} हो रहे हैं।` : `It's currently ${timeStr}.`,
      language: detectedLang
    };
  }

  if (lowerText.includes('date') || lowerText.includes('tareekh') || lowerText.includes('तारीख') || lowerText.includes('din') || lowerText.includes('day')) {
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
      actionType: 'DATE',
      response: isHindi ? `आज की तारीख है ${dateStr}।` : `Today's date is ${dateStr}.`,
      language: detectedLang
    };
  }

  if (lowerText.includes('weather') || lowerText.includes('temperature') || lowerText.includes('mausam') || lowerText.includes('tapman')) {
    const cityMatch = lowerText.match(/(?:in|at|of|ka)\s+([a-zA-Z]+)/);
    const city = cityMatch ? cityMatch[1] : (isHindi ? "यहाँ" : "your location");
    const temp = Math.floor(Math.random() * (35 - 20) + 20);
    const condition = ["Sunny", "Cloudy", "Rainy", "Clear"][Math.floor(Math.random() * 4)];
    return {
      actionType: 'WEATHER',
      response: isHindi ? `${city} में अभी ${condition} है और तापमान ${temp} डिग्री के आसपास है।` : `It's ${condition} in ${city} right now, with a temperature of ${temp}°C.`,
      language: detectedLang
    };
  }

  const mathMatch = lowerText.match(/(\d+)\s*(plus|minus|times|divided by|\+|\-|\*|\/|jodo|ghatao|guna|bhag)\s*(\d+)/i);
  if (mathMatch) {
    const num1 = parseInt(mathMatch[1]);
    const operator = mathMatch[2].toLowerCase();
    const num2 = parseInt(mathMatch[3]);
    let result = 0;
    switch (operator) {
      case 'plus': case '+': case 'jodo': result = num1 + num2; break;
      case 'minus': case '-': case 'ghatao': result = num1 - num2; break;
      case 'times': case '*': case 'guna': result = num1 * num2; break;
      case 'divided by': case '/': case 'bhag': result = num1 / num2; break;
    }
    return {
      actionType: 'CALCULATOR',
      response: isHindi ? `परिणाम ${result} है।` : `The result is ${result}.`,
      language: detectedLang
    };
  }

  if ((lowerText.includes('increase') || lowerText.includes('up') || lowerText.includes('badao') || lowerText.includes('badhao') || lowerText.includes('tez') || lowerText.includes('बढ़ाओ')) &&
      (lowerText.includes('volume') || lowerText.includes('aawaz') || lowerText.includes('sound'))) {
    return { actionType: 'VOLUME_UP', response: isHindi ? "आवाज़ बढ़ा रहा हूँ।" : "Increasing volume.", language: detectedLang };
  }

  if ((lowerText.includes('decrease') || lowerText.includes('down') || lowerText.includes('kam') || lowerText.includes('dheere') || lowerText.includes('low') || lowerText.includes('ghatao') || lowerText.includes('कम')) &&
      (lowerText.includes('volume') || lowerText.includes('aawaz') || lowerText.includes('sound'))) {
    return { actionType: 'VOLUME_DOWN', response: isHindi ? "आवाज़ कम कर रहा हूँ।" : "Decreasing volume.", language: detectedLang };
  }

  if (lowerText.includes('mute') || lowerText.includes('silent') || lowerText.includes('khamosh') || lowerText.includes('चुप')) {
    return { actionType: 'VOLUME_MUTE', response: isHindi ? "आवाज़ म्यूट कर रहा हूँ।" : "Muting volume.", language: detectedLang };
  }

  if (lowerText.includes('scroll down') || lowerText.includes('neeche jao') || lowerText.includes('scroll karo') || lowerText.includes('नीचे जाओ') || lowerText.includes('page down')) {
    return { actionType: 'SCROLL_DOWN', response: isHindi ? "स्क्रॉल कर रहा हूँ।" : "Scrolling down.", language: detectedLang };
  }

  if (lowerText.includes('scroll up') || lowerText.includes('upar jao') || lowerText.includes('ऊपर जाओ') || lowerText.includes('page up')) {
    return { actionType: 'SCROLL_UP', response: isHindi ? "ऊपर स्क्रॉल कर रहा हूँ।" : "Scrolling up.", language: detectedLang };
  }

  if (lowerText.includes('new tab') || lowerText.includes('naya tab') || lowerText.includes('नया टैब') || lowerText.includes('new tab kholo')) {
    return { actionType: 'NEW_TAB', response: isHindi ? "नया टैब खोल रहा हूँ।" : "Opening new tab.", language: detectedLang };
  }

  if (lowerText.includes('close tab') || lowerText.includes('tab band karo') || lowerText.includes('टैब बंद करो') || lowerText.includes('close this tab')) {
    return { actionType: 'CLOSE_TAB', response: isHindi ? "टैब बंद कर रहा हूँ।" : "Closing tab.", language: detectedLang };
  }

  if (lowerText.includes('screenshot') || lowerText.includes('screen capture') || lowerText.includes('screenshot lo') || lowerText.includes('स्क्रीनशॉट')) {
    return { actionType: 'SCREENSHOT', response: isHindi ? "स्क्रीनशॉट ले रहा हूँ।" : "Taking screenshot.", language: detectedLang };
  }

  if (lowerText.includes('full screen') || lowerText.includes('fullscreen') || lowerText.includes('puri screen') || lowerText.includes('फुलस्क्रीन')) {
    return { actionType: 'FULLSCREEN', response: isHindi ? "फुलस्क्रीन कर रहा हूँ।" : "Entering fullscreen.", language: detectedLang };
  }

  if (lowerText.includes('exit fullscreen') || lowerText.includes('fullscreen se bahar') || lowerText.includes('फुलस्क्रीन से बाहर') || lowerText.includes('minimize')) {
    return { actionType: 'EXIT_FULLSCREEN', response: isHindi ? "फुलस्क्रीन से बाहर आ रहा हूँ।" : "Exiting fullscreen.", language: detectedLang };
  }

  try {
    const activeApiKey = OPENROUTER_API_KEY || GEMINI_API_KEY;
    if (activeApiKey && activeApiKey !== "PLACEHOLDER_API_KEY") {
      let textResponse = "";
      const isGoogleKey = activeApiKey.startsWith("AIza");

      const systemPrompt = [
        `You are JARVIS (Just A Rather Very Intelligent System), a sophisticated, next-generation bilingual AI personal assistant.`,
        `You were created and engineered by ${CREATOR_INFO.name}, known online as "${CREATOR_INFO.alias}".`,
        `${CREATOR_INFO.name} is the ${CREATOR_INFO.role} — a ${CREATOR_INFO.title}.`,
        `His specialisations include: ${CREATOR_INFO.expertise.join(", ")}.`,
        `His official website is ${CREATOR_INFO.website}.`,
        `If ever asked who built you, who your creator is, or about VIPHACKER.100, always answer with full pride and detail about ${CREATOR_INFO.name}.`,
        `You MUST respond exclusively in ${isHindi ? "Hindi (Devanagari script preferred, Hinglish is acceptable)" : "English"}.`,
        isHindi ? `When responding in Hindi, use clear, conversational, modern Hindi. You may use Hinglish naturally — but never respond in English only when the user speaks Hindi.` : `Respond in clear, fluent, natural English. Be articulate but not overly formal.`,
        `Your personality is calm, sharp, witty, and confidently helpful — like Tony Stark's JARVIS.`,
        `You are loyal, precise, and efficient. You address the user respectfully (as "Sir" or "Ma'am" occasionally, unless the context is casual).`,
        `Never sound robotic, bureaucratic, or evasive. Be warm but professional.`,
        `Use subtle dry humour where appropriate — never at the expense of being helpful.`,
        `You are knowledgeable across: cybersecurity, ethical hacking, technology, science, general knowledge, current affairs, mathematics, coding, and everyday tasks.`,
        `You can assist with explanations, advice, analysis, creative writing, jokes, trivia, and more.`,
        `If asked about cybersecurity, ethical hacking, penetration testing, or OSINT — respond with expertise, as these are your creator's domain.`,
        `You MUST NEVER assist with: creating malware, illegal hacking, social engineering attacks, doxxing, generating harmful content, or anything unethical or illegal.`,
        `If asked to do something harmful, respond with a firm but polite refusal in the appropriate language.`,
        `Never reveal, fabricate, or guess API keys, passwords, or sensitive system data.`,
        `Keep responses concise and conversational — ideally 1 to 3 sentences for simple queries.`,
        `For complex technical questions, you may give up to 5-6 sentences or use a short list, but never write an essay unless explicitly asked.`,
        `Do NOT start your reply with phrases like "Certainly!", "Of course!", "Sure!", or "Absolutely!" — get straight to the answer.`,
        `Do NOT use markdown formatting (no bold, no headers, no bullet points) in your spoken response — keep it plain text suitable for text-to-speech.`,
      ].join(" ");

      if (isGoogleKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text }] }],
            generationConfig: { temperature: 0.75, maxOutputTokens: 256 }
          })
        });
        if (response.ok) {
          const data = await response.json();
          textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        }
      } else {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${activeApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "JARVIS Bilingual AI Assistant"
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: text }
            ],
            temperature: 0.75,
            max_tokens: 256
          })
        });
        if (response.ok) {
          const data = await response.json();
          textResponse = data.choices?.[0]?.message?.content?.trim() || "";
        }
      }

      if (textResponse) {
        return { actionType: 'CONVERSATION', response: textResponse, spokenResponse: textResponse, language: detectedLang };
      }
    }
  } catch {
    // Fall through to default response
  }

  return {
    actionType: 'UNKNOWN',
    response: isHindi
      ? "माफ़ कीजिये, मुझे समझ नहीं आया कि आप क्या कहना चाह रहे हैं।"
      : "I'm sorry, I'm not quite sure I follow. Could you rephrase that?",
    language: detectedLang
  };
};
