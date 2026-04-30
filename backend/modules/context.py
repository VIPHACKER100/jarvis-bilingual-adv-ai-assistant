import re
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from modules.bilingual_parser import parser
from modules.memory import memory_manager, ConversationEntry, MemoryEntry
from utils.logger import logger


@dataclass
class ContextState:
    """Current context state"""
    session_id: str = ""
    last_command: str = ""
    last_command_type: str = ""
    last_successful: bool = True
    conversation_count: int = 0
    active_topic: str = ""  # e.g., "file_management", "media", "system"
    user_mood: str = "neutral"  # happy, frustrated, neutral
    pending_action: Optional[Dict] = None
    context_variables: Optional[Dict] = None  # Store temporary context

    def __post_init__(self):
        if self.context_variables is None:
            self.context_variables = {}


@dataclass
class IntentAnalysis:
    """Analysis of user intent"""
    primary_intent: str = ""  # e.g., "open_app", "search_file", "question"
    secondary_intents: Optional[List[str]] = None
    entities: Optional[Dict[str, Any]] = None  # Extracted entities
    confidence: float = 0.0
    requires_clarification: bool = False
    suggested_response: str = ""

    def __post_init__(self):
        if self.secondary_intents is None:
            self.secondary_intents = []
        if self.entities is None:
            self.entities = {}


class ContextManager:
    """Manage conversation context and intent recognition"""

    # Intent patterns for better understanding
    INTENT_PATTERNS = {
        'greeting': [
            r'\b(hello|hi|hey|namaste|namaskar|hola|greetings)\b',
            r'^(good morning|good afternoon|good evening|good night)'
        ],
        'farewell': [
            r'\b(bye|goodbye|see you|take care|alvida|phir milenge)\b',
            r'^(stop|exit|quit|band karo)'
        ],
        'gratitude': [
            r'\b(thank|thanks|shukriya|dhanyavad|thank you)\b'
        ],
        'question': [
            r'\b(what|who|where|when|why|how|kya|kaun|kahan|kab|kyu|kaise)\b',
            r'\?'
        ],
        'urgent': [
            r'\b(urgent|quick|fast|immediately|jaldi|turant)\b'
        ],
        'frustrated': [
            r'\b(not working|error|problem|issue|stupid|damn|hell|not again)\b'
        ],
        'follow_up': [
            r'\b(and|also|too|plus|aur|bhi|phir)\b'
        ]
    }

    # Context-aware response templates
    CONTEXT_RESPONSES = {
        'en': {
            'follow_up': 'Would you like me to do anything else?',
            'clarification': 'Could you please clarify what you mean?',
            'greeting_morning': 'Good morning! How can I help you today?',
            'greeting_afternoon': 'Good afternoon! What can I do for you?',
            'greeting_evening': 'Good evening! How may I assist you?',
            'remembered_fact': 'I remember you mentioned {fact}.',
            'context_aware': 'Based on our conversation, I think you want to {action}.',
        },
        'hi': {
            'follow_up': 'Kya main kuch aur kar sakta hoon?',
            'clarification': 'Kripaya spasht karein aap kya kehna chahte hain?',
            'greeting_morning': 'Shubh prabhat! Main aapki kya madad kar sakta hoon?',
            'greeting_afternoon': 'Namaste! Main aapke liye kya kar sakta hoon?',
            'greeting_evening': 'Shubh sandhya! Main kaise madad kar sakta hoon?',
            'remembered_fact': 'Mujhe yaad hai aapne kaha tha {fact}.',
            'context_aware': 'Hamari baat cheet ke aadhar par, mujhe lagta hai aap {action} karna chahte hain.',
        }}

    def __init__(self):
        self.current_context = ContextState()
        self.intent_history: List[IntentAnalysis] = []
        # Persistent language will be fetched on first update or when needed
        self.initialized = False

    async def _ensure_initialized(self):
        if not self.initialized:
            try:
                pref_lang = await memory_manager.get_setting("preferred_language", "en")
                self.set_context_variable("preferred_language", pref_lang)
                self.initialized = True
            except Exception as e:
                logger.error(f"Error initializing ContextManager: {e}")

    async def update_context(self, user_input: str, command_type: str,
                       success: bool, session_id: str = "") -> None:
        await self._ensure_initialized()
        """Update current context with new interaction"""
        self.current_context.last_command = user_input
        self.current_context.last_command_type = command_type
        self.current_context.last_successful = success
        self.current_context.conversation_count += 1

        if session_id:
            self.current_context.session_id = session_id

        # Persistent Language Tracking
        lang = self.get_context_variable("preferred_language")
        current_lang = parser.detect_language(user_input)
        if current_lang != lang:
             self.set_context_variable("preferred_language", current_lang)
             await memory_manager.save_setting("preferred_language", current_lang)

        # Update active topic based on command type
        topic_mapping = {
            'open_app': 'applications',
            'close_app': 'applications',
            'open_folder': 'file_management',
            'search_files': 'file_management',
            'ocr_image': 'media',
            'ocr_pdf': 'media',
            'take_screenshot': 'desktop',
            'shutdown': 'system',
            'restart': 'system',
        }

        if command_type in topic_mapping:
            self.current_context.active_topic = topic_mapping[command_type]

        # Detect user mood
        self.current_context.user_mood = self._detect_mood(user_input)
        
        # NEW: Extract and save personal facts from input
        asyncio.create_task(self.extract_and_save_facts(user_input))

        logger.info(f"Context updated: topic={self.current_context.active_topic}, mood={self.current_context.user_mood}")

    def analyze_intent(
            self,
            user_input: str,
            language: str = 'en') -> IntentAnalysis:
        """Analyze user intent from input"""
        analysis = IntentAnalysis()
        user_input_lower = user_input.lower()

        # Detect primary intents
        detected_intents = []

        for intent, patterns in self.INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, user_input_lower, re.IGNORECASE):
                    detected_intents.append(intent)
                    break

        if detected_intents:
            analysis.primary_intent = detected_intents[0]
            analysis.secondary_intents = detected_intents[1:]
            analysis.confidence = min(0.5 + (len(detected_intents) * 0.1), 0.9)

        # Extract entities
        analysis.entities = self._extract_entities(user_input, analysis)

        # Check if clarification is needed
        if analysis.confidence < 0.3 or len(user_input.split()) < 2:
            analysis.requires_clarification = True
            analysis.suggested_response = self.CONTEXT_RESPONSES[language]['clarification']

        # Store in history
        self.intent_history.append(analysis)

        return analysis

    def _detect_mood(self, user_input: str) -> str:
        """Detect user mood from input"""
        user_input_lower = user_input.lower()

        frustrated_patterns = [
            r'\b(not working|error|problem|issue|bug|broken|crash)\b',
            r'\b(stupid|idiot|damn|hell|shit|frustrat|annoy)\b',
            r'[!]{2,}',  # Multiple exclamation marks
            r'\b(again|still|yet)\b.*\b(not|no|never)\b'
        ]

        happy_patterns = [
            r'\b(great|awesome|excellent|perfect|amazing|thank|love|nice|good)\b',
            r'[:)]',  # Smileys
        ]

        urgent_patterns = [
            r'\b(urgent|emergency|quick|fast|hurry|immediately|asap|jaldi|turant)\b',
            r'[!]{3,}'  # Three or more exclamation marks
        ]

        for pattern in frustrated_patterns:
            if re.search(pattern, user_input_lower):
                return 'frustrated'

        for pattern in urgent_patterns:
            if re.search(pattern, user_input_lower):
                return 'urgent'

        for pattern in happy_patterns:
            if re.search(pattern, user_input_lower):
                return 'happy'

        return 'neutral'

    def _extract_entities(self, user_input: str, analysis: IntentAnalysis) -> Dict[str, Any]:
        """Extract entities from user input"""
        entities = {}
        user_input_lower = user_input.lower()
        
        # Extract file paths
        file_pattern = r'[\w\s-]+\.(txt|pdf|jpg|png|doc|docx|xls|xlsx|mp3|mp4)'
        files = re.findall(file_pattern, user_input, re.IGNORECASE)
        if files:
            entities['files'] = files

        # Extract numbers
        numbers = re.findall(r'\b\d+\b', user_input)
        if numbers:
            entities['numbers'] = [int(n) for n in numbers]

        # Extract URLs
        url_pattern = r'https?://[^\s<>"{}|\\^`[\]]+'
        urls = re.findall(url_pattern, user_input)
        if urls:
            entities['urls'] = urls

        # Extract email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, user_input)
        if emails:
            entities['emails'] = emails

        # Extract app names (common apps)
        common_apps = [
            'chrome',
            'firefox',
            'edge',
            'notepad',
            'word',
            'excel',
            'powerpoint',
            'spotify',
            'vlc',
            'calculator',
            'whatsapp']
        for app in common_apps:
            if app in user_input_lower:
                if analysis.entities is None:
                    analysis.entities = {}
                analysis.entities['app_name'] = app
                break

        return entities

    async def get_contextual_response(self, language: str = 'en') -> Optional[str]:
        await self._ensure_initialized()
        """Generate a context-aware response"""
        responses = self.CONTEXT_RESPONSES[language]

        # Check for greeting context
        hour = datetime.now().hour
        if self.current_context.conversation_count == 0:
            if 5 <= hour < 12:
                return responses['greeting_morning']
            elif 12 <= hour < 17:
                return responses['greeting_afternoon']
            else:
                return responses['greeting_evening']

        # Check for remembered facts
        if self.current_context.conversation_count > 5:
            memories = await memory_manager.get_memories_by_category('preferences')
            if memories and len(memories) > 0:
                memory = memories[0]
                return responses['remembered_fact'].format(
                    fact=f"{memory.key} is {memory.value}")

        # Follow-up after successful command
        if self.current_context.last_successful and self.current_context.conversation_count > 0:
            return responses['follow_up']

        return None

    async def get_visual_context(self) -> str:
        """Extract text from current screen and perform structural analysis to enrich context"""
        try:
            from modules.media import media_processor
            result = await media_processor.extract_text_from_screenshot()
            if result.get('success'):
                text = result.get('text', '')
                # Clean and limit
                text_clean = re.sub(r'\s+', ' ', text).strip()
                
                # Deep Contextual Enrichment: Identify document type
                doc_type = "Generic Text"
                if re.search(r'\b(invoice|bill|amount|total|tax|gst)\b', text_clean, re.I):
                    doc_type = "Financial Document"
                elif re.search(r'\b(contract|agreement|legal|terms|conditions|clause)\b', text_clean, re.I):
                    doc_type = "Legal Document"
                elif re.search(r'\b(api|code|class|function|npm|import|return)\b', text_clean, re.I):
                    doc_type = "Technical / Source Code"
                elif re.search(r'\b(dear|hello|regards|sincerely|subject:)\b', text_clean, re.I):
                    doc_type = "Correspondence / Email"
                
                # Extract potential entities for bridge
                entities = {
                    "document_type": doc_type,
                    "length": len(text_clean),
                    "timestamp": datetime.now().isoformat()
                }
                
                # Look for specific IDs or amounts if it's financial
                if doc_type == "Financial Document":
                    amounts = re.findall(r'(\d+\.\d{2})', text_clean)
                    if amounts:
                        entities["total_amount"] = amounts[-1]
                
                self.set_context_variable('last_visual_analysis', entities)
                self.set_context_variable('last_screen_text', text_clean[:500])
                
                logger.info(f"Visual analysis complete: Identified as {doc_type}")
                return f"[Visual Context: {doc_type}] " + text_clean[:1000]
            return ""
        except Exception as e:
            logger.error(f"Error getting visual context: {e}")
            return ""

    def get_alternative_suggestion(self, command_key: str, params: Any, language: str = 'en') -> Optional[str]:
        """Suggest an alternative when a command fails"""
        if command_key == 'open_app':
            app_name = str(params).lower()
            # If app opening failed, suggest web version
            web_mappings = {
                'spotify': 'https://open.spotify.com',
                'whatsapp': 'https://web.whatsapp.com',
                'chrome': 'https://www.google.com',
                'vscode': 'https://vscode.dev',
                'word': 'https://www.office.com',
                'excel': 'https://www.office.com',
                'powerpoint': 'https://www.office.com',
            }
            for key, url in web_mappings.items():
                if key in app_name:
                    return f"Sir, I couldn't find {key} on your system. Would you like me to open the web version at {url} instead?" if language == 'en' else f"सर, मुझे आपके सिस्टम पर {key} नहीं मिला। क्या आप चाहेंगे कि मैं इसके बजाय {url} पर वेब वर्शन खोलूँ?"
            
            return f"Sir, I couldn't find '{params}'. Should I search for it online?" if language == 'en' else f"सर, मुझे '{params}' नहीं मिला। क्या मुझे इसे ऑनलाइन खोजना चाहिए?"

        if command_key == 'file_management':
             return "I couldn't find the file. Should I search in a different directory or check the Recycle Bin?" if language == 'en' else "मुझे फ़ाइल नहीं मिली। क्या मुझे किसी दूसरी डायरेक्टरी में खोजना चाहिए?"

        return None

    async def suggest_next_action(self) -> Optional[str]:
        """Suggest next action based on context"""
        # 1. If last command failed, offer alternative
        if not self.current_context.last_successful and self.current_context.last_command_type:
            alt = self.get_alternative_suggestion(
                self.current_context.last_command_type, 
                self.current_context.last_command
            )
            if alt: return alt

        # 2. If no recent command, try proactive suggestion based on active window
        if not self.current_context.last_command_type:
            return await self.get_proactive_suggestions()

        # Topic-based suggestions
        suggestions = {
            'file_management': [
                'Would you like to search for another file?',
                'Should I open the folder?',
                'Do you want to organize these files?'
            ],
            'applications': [
                'Would you like to open another app?',
                'Should I close this application?',
                'Do you want to switch to a different window?'
            ],
            'media': [
                'Would you like to convert this to another format?',
                'Should I extract text from this?',
                'Do you want to resize the image?'
            ],
            'system': [
                'Would you like to check system status?',
                'Should I adjust any settings?',
                'Do you want to see battery level?'
            ]
        }

        topic = self.current_context.active_topic
        if topic in suggestions:
            import random
            return random.choice(suggestions[topic])

        return await self.get_proactive_suggestions()

    async def get_proactive_suggestions(self) -> Optional[str]:
        """Generate proactive suggestions based on active window and system state"""
        try:
            from modules.window_manager import window_manager
            active_win = await window_manager.get_active_window()
            
            if not active_win:
                return None
                
            title = active_win['title'].lower()
            proc_name = active_win['process_name'].lower()
            
            # Application specific proactive suggestions
            if any(b in proc_name for b in ["chrome", "edge", "firefox", "browser"]):
                if "youtube" in title:
                    return "Sir, I can help you search for other videos or download this audio if you'd like."
                if "github" in title:
                    return "You're on GitHub. Should I check for any pending pull requests or issues?"
                if "stackoverflow" in title or "docs." in title:
                    return "Researching? I can summarize this documentation or help you find specific code snippets."
                return "I see you're browsing. Need help searching for something specific or summarizing a page?"
                
            if any(c in proc_name for c in ["code", "visual studio", "jetbrains", "pycharm", "sublime"]):
                # Try to detect language from title
                langs = {
                    '.py': 'Python', '.js': 'JavaScript', '.ts': 'TypeScript', 
                    '.rs': 'Rust', '.go': 'Go', '.html': 'HTML', '.css': 'CSS'
                }
                detected_lang = None
                for ext, name in langs.items():
                    if ext in title:
                        detected_lang = name
                        break
                
                if detected_lang:
                    return f"Coding in {detected_lang}. Should I look for relevant documentation or check your syntax?"
                return "Coding session in progress. Should I look for documentation or help you manage your files?"
                
            if any(d in proc_name for d in ["word", "notepad", "text", "edit", "acrobat"]):
                if ".pdf" in title:
                    return "Reading a PDF? I can extract key points or summarize the entire document for you."
                return "Working on a document? I can help you with spell check, formatting, or summarization."
                
            if "whatsapp" in proc_name or "slack" in proc_name or "discord" in proc_name:
                return "Checking messages? I can help you send a quick reply to any of your contacts."
                
            if "spotify" in proc_name or "vlc" in proc_name:
                return "Listening to media. Should I find similar tracks or look up the lyrics for you?"

            # System state suggestions
            from modules.system import system_module
            status = await system_module.get_system_status()
            if status.cpu.percent > 85:
                return f"Sir, CPU usage is critical ({status.cpu.percent}%). Should I terminate heavy background processes?"
                
            if status.battery.percent and status.battery.percent < 25 and status.battery.is_charging is False:
                return f"Your battery is at {status.battery.percent}%. Would you like me to enable power saving or dim the screen?"

            # General productivity
            hour = datetime.now().hour
            if 9 <= hour <= 11:
                return "Good morning, sir. Ready to review today's schedule or start your primary workstation tasks?"
            if 14 <= hour <= 16:
                return "Mid-afternoon check. Should I summarize your recent activities or check for any urgent notifications?"

            return "I'm monitoring your system. Let me know if you need any assistance with your current task."
            
        except Exception as e:
            logger.error(f"Error in proactive suggestions: {e}")
            return None

    def is_follow_up_command(self, user_input: str) -> bool:
        """Check if this is a follow-up to previous command"""
        follow_up_indicators = [
            r'^and\s+',
            r'^also\s+',
            r'^too\s*$',
            r'^as well\s*$',
            r'\btoo\s*$',
            r'\bas well\s*$',
            r'\baur\b',  # Hindi
            r'\bbhi\b',  # Hindi
        ]

        user_input_lower = user_input.lower()

        for indicator in follow_up_indicators:
            if re.search(indicator, user_input_lower):
                return True

        # Check if command is very short (likely follow-up)
        if len(user_input.split()) <= 2 and self.current_context.last_command_type:
            return True

        return False

    async def get_conversation_context(self, limit: int = 5) -> List[Dict]:
        """Get recent conversation context for AI processing"""
        session_id = self.current_context.session_id
        entries = await memory_manager.get_recent_conversations(limit, session_id)

        context = []
        for entry in entries:
            context.append({
                'timestamp': entry.timestamp,
                'user': entry.user_input,
                'jarvis': entry.jarvis_response,
                'type': entry.command_type,
                'success': entry.success
            })

        return context

    def set_context_variable(self, key: str, value: Any) -> None:
        """Set a temporary context variable"""
        if self.current_context.context_variables is None:
            self.current_context.context_variables = {}
        self.current_context.context_variables[key] = value
        logger.info(f"Set context variable: {key} = {value}")

    def get_context_variable(self, key: str) -> Optional[Any]:
        """Get a context variable"""
        if self.current_context.context_variables is None:
            return None
        return self.current_context.context_variables.get(key)

    async def extract_and_save_facts(self, text: str) -> None:
        """Extract personal facts from text and save to memory"""
        from modules.memory import MemoryEntry
        
        # Simple extraction patterns
        patterns = [
            # Personal Info
            (r"(?:my name is|i am|called|naam hai)\s+([a-zA-Z\s]{2,20})", "name", "personal"),
            (r"(?:i live in|i'm from|rehta hoon|living in)\s+([a-zA-Z\s]{2,30})", "location", "personal"),
            (r"(?:my birthday is|born on|janamdin)\s+([a-zA-Z0-9\s]{4,20})", "birthday", "personal"),
            
            # Profession & Role
            (r"(?:i work as|my job is|i am a)\s+([a-zA-Z\s]{2,30})", "profession", "personal"),
            (r"(?:i study|student of)\s+([a-zA-Z\s]{2,30})", "education", "personal"),
            
            # Preferences & Hobbies
            (r"(?:i love|i like|i enjoy|pasand hai)\s+([a-zA-Z\s]{2,30})", "preference", "preferences"),
            (r"(?:i play|hobby is)\s+([a-zA-Z\s]{2,30})", "hobby", "preferences"),
            
            # Contacts & Relations
            (r"(?:my boss is|work with)\s+([a-zA-Z\s]{2,20})", "boss", "contacts"),
            (r"(?:my friend is|friend named)\s+([a-zA-Z\s]{2,20})", "friend", "contacts"),
            (r"(?:my (wife|husband|son|daughter|brother|sister) is)\s+([a-zA-Z\s]{2,20})", "family", "contacts")
        ]
        
        text_lower = text.lower()
        for pattern, base_key, category in patterns:
            match = re.search(pattern, text_lower)
            if match:
                value = match.group(1).strip()
                # Clean up if matched "favorite color" instead of just "color"
                if "favorite" in base_key and "is" in value:
                    value = value.split("is")[-1].strip()
                
                # Check for "my favorite X is Y"
                if "my favorite" in text_lower:
                    pref_match = re.search(r"my favorite\s+([\w\s]+)\s+is\s+([\w\s]+)", text_lower)
                    if pref_match:
                        key = f"favorite_{pref_match.group(1).strip().replace(' ', '_')}"
                        val = pref_match.group(2).strip()
                        await memory_manager.save_memory(MemoryEntry(
                            key=key, value=val, category="preferences", source="conversation"
                        ))
                        continue

                await memory_manager.save_memory(MemoryEntry(
                    key=base_key,
                    value=value,
                    category=category,
                    source="conversation",
                    confidence=0.8
                ))

    def clear_context(self) -> None:
        """Clear current context"""
        self.current_context = ContextState()
        self.intent_history.clear()
        logger.info("Context cleared")

    def export_context(self) -> Dict:
        """Export current context for debugging/analysis"""
        return {
            'current_context': {
                'session_id': self.current_context.session_id,
                'last_command': self.current_context.last_command,
                'last_command_type': self.current_context.last_command_type,
                'conversation_count': self.current_context.conversation_count,
                'active_topic': self.current_context.active_topic,
                'user_mood': self.current_context.user_mood,
                'context_variables': self.current_context.context_variables
            },
            'intent_history': [
                {
                    'primary_intent': h.primary_intent,
                    'confidence': h.confidence,
                    'entities': h.entities
                }
                for h in self.intent_history[-10:]  # Last 10
            ]
        }


# Singleton instance
context_manager = ContextManager()
