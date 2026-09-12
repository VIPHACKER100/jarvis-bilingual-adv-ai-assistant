# Graph Report - jarvis-bilingual-adv-ai-assistant  (2026-09-13)

## Corpus Check
- 96 files · ~60,477 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1632 file(s) not represented in the graph (top: (none) 1240, .msg 143, .enc 80)

## Summary
- 844 nodes · 1462 edges · 68 communities (38 shown, 27 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.89)
- Token cost: 468,091 input · 0 output

## Community Hubs (Navigation)
- Backend Core & Config
- Automation & Macros
- Input Control (Mouse/Keyboard)
- REST API: File/Media Actions
- Frontend Bridge Services
- Desktop & Media Control
- WebSocket Protocol & Docs
- Context Manager
- REST API: Read/Status
- Media Processor (OCR/PDF)
- Memory Manager (SQLite)
- Frontend Dependencies
- Security & Confirmation
- Window Manager
- Distribution & Build (PyInstaller)
- System Commands
- File Manager
- TypeScript Config
- WhatsApp Integration
- React UI Components
- Voice Service & Types
- App Entry & Voice
- Module Functionality Tests
- Bilingual Parser
- Constants & Command Processor
- Sync Tests
- Command Endpoints
- Desktop Controls UI
- Audio Feedback System
- Status Broadcaster
- LLM Module
- Module Import Tests
- Logging Utilities
- JARVIS Brand & Logo
- Automation Dashboard UI
- App State Modes
- OCR & Cursor APIs
- Memory Facts API
- PDF Generation
- Image Compression
- PyInstaller Entry Point
- Frontend Dir Locator
- Batch PDF API
- Task Creation API
- Delete File API
- Drawing App API
- Screen OCR API
- Open Folder API
- PDF to Images API
- Conversation API
- Folder Scan API
- Notification API
- Theme Control
- Sync Verification Report
- fuzzywuzzy Library
- keyboard Library
- pdf2image Library
- psutil Library
- pygetwindow Library
- pyperclip Library
- pywhatkit Library
- pywin32 Library
- requests Library
- schedule Library
- Uvicorn Server

## God Nodes (most connected - your core abstractions)
1. `log_command()` - 57 edges
2. `is_windows()` - 42 edges
3. `is_macos()` - 42 edges
4. `AutomationManager` - 29 edges
5. `InputController` - 26 edges
6. `DesktopManager` - 24 edges
7. `MediaProcessor` - 22 edges
8. `SystemModule` - 21 edges
9. `FileManager` - 19 edges
10. `WindowManager` - 19 edges

## Surprising Connections (you probably didn't know these)
- `JARVIS Release README` --semantically_similar_to--> `JARVIS Project README`  [INFERRED] [semantically similar]
  release/README.txt → README.md
- `WebSocket Protocol (API Documentation)` --semantically_similar_to--> `WebSocket Command Message Protocol`  [INFERRED] [semantically similar]
  docs/API_DOCUMENTATION.md → BACKEND_FRONTEND_SYNC.md
- `FastAPI Controller` --semantically_similar_to--> `main.py - FastAPI Application`  [INFERRED] [semantically similar]
  README.md → BACKEND_FRONTEND_SYNC.md
- `Command Safety & Confirmation Process` --semantically_similar_to--> `Confirmation System`  [INFERRED] [semantically similar]
  docs/COMMANDS.md → README.md
- `Hinglish (Mixed Language) Support` --conceptually_related_to--> `Bilingual Parser`  [INFERRED]
  docs/COMMANDS.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **End-to-End WebSocket Voice Command Flow** — app, backend_frontend_sync_usejarvisbridge, backend_frontend_sync_websocketservice, backend_frontend_sync_main_py, backend_frontend_sync_handle_command, backend_modules_bilingual_parser [EXTRACTED 1.00]
- **OCR, PDF and Image Processing Stack** — backend_modules_media, backend_requirements_pytesseract, backend_requirements_pillow, backend_requirements_pypdf2, backend_requirements_pdf2image, docs_setup_tesseract_ocr [INFERRED 0.85]
- **Dangerous Command Confirmation and Security Flow** — readme_confirmation_system, backend_modules_security, docs_api_documentation_confirmation_endpoint, backend_frontend_sync_confirmation_flow, docs_setup_environment_config [INFERRED 0.85]

## Communities (68 total, 27 thin omitted)

### Community 0 - "Backend Core & Config"
Cohesion: 0.08
Nodes (41): get_config(), Load user config from JSON, Save user config to JSON, save_config(), handle_command(), Show system notification, Zoom screen using Windows Magnifier or built-in hotkeys, Delete file or folder (with confirmation) (+33 more)

### Community 1 - "Automation & Macros"
Cohesion: 0.06
Nodes (23): AutomationManager, Macro, Start the scheduler in a background thread, Run the scheduler loop, Schedule all enabled tasks, Schedule a single task, Execute a scheduled task, Register a callback function for a task (+15 more)

### Community 2 - "Input Control (Mouse/Keyboard)"
Cohesion: 0.07
Nodes (20): InputController, Cross-platform mouse and keyboard controller with human-like delays, Drag from start to end position, Add random human-like delay, Type text with human-like speed, Delay between keystrokes (typing speed), Get current cursor position, Press multiple keys simultaneously (hotkey) (+12 more)

### Community 3 - "REST API: File/Media Actions"
Cohesion: 0.08
Nodes (39): api_change_wallpaper(), api_compress_image(), api_convert_image(), api_copy_file(), api_create_folder(), api_create_macro(), api_empty_recycle_bin(), api_images_to_pdf() (+31 more)

### Community 4 - "Frontend Bridge Services"
Cohesion: 0.10
Nodes (13): ConfirmationModal(), ConfirmationModalProps, UseJarvisBridgeReturn, apiClient, MessageHandler, StatusHandler, websocketService, CommandRequest (+5 more)

### Community 5 - "Desktop & Media Control"
Cohesion: 0.07
Nodes (17): DesktopManager, Save base64 screenshot to file, Get text from clipboard, Set text to clipboard, Screenshots, clipboard, and media controls, Play/pause media playback, Mute/unmute system volume, Increase system volume (+9 more)

### Community 6 - "WebSocket Protocol & Docs"
Cohesion: 0.09
Nodes (35): WebSocket Command Message Protocol, main.py - FastAPI Application, Ping/Pong Keep-alive, System Status Broadcasting, useJarvisBridge Hook, voiceService, websocketService, Backend Python Dependencies (requirements.txt) (+27 more)

### Community 7 - "Context Manager"
Cohesion: 0.07
Nodes (19): ContextManager, ContextState, IntentAnalysis, Any, Update current context with new interaction, Analyze user intent from input, Current context state, Detect user mood from input (+11 more)

### Community 8 - "REST API: Read/Status"
Cohesion: 0.10
Nodes (30): api_clear_clipboard(), api_get_automation_status(), api_get_clipboard_text(), api_get_conversations(), api_get_file_info(), api_get_macros(), api_get_memory_facts(), api_get_memory_stats() (+22 more)

### Community 9 - "Media Processor (OCR/PDF)"
Cohesion: 0.07
Nodes (16): MediaProcessor, Take screenshot and extract text, Merge multiple PDFs into one, OCR, PDF, and Image processing tools, Extract specific pages from PDF, Convert PDF pages to images, Extract text from image file, Convert image to different format (+8 more)

### Community 10 - "Memory Manager (SQLite)"
Cohesion: 0.07
Nodes (17): ConversationEntry, MemoryManager, Save a conversation entry, Single conversation entry, Get recent conversation history, Search conversation history, Get conversation statistics, Save a memory/fact about the user (+9 more)

### Community 11 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (27): dependencies, @google/generative-ai, react, react-dom, devDependencies, @types/node, @types/react, @types/react-dom (+19 more)

### Community 12 - "Security & Confirmation"
Cohesion: 0.08
Nodes (18): Command Confirmation Flow, Manage command confirmations and security checks, Get status of confirmation: None=pending, True=confirmed, False=rejected/timeout, Register async callback for confirmation result, Get confirmation request details, Remove expired confirmations, Check if command requires confirmation, Request user confirmation for dangerous command Returns confirmation_id (+10 more)

### Community 13 - "Window Manager"
Cohesion: 0.10
Nodes (14): Cross-platform window and application manager, List all running applications, Get list of windows on Windows, Initialize platform-specific components, Get list of open windows, Get list of running processes, Snap window to left/right/top/bottom, Bring a window to front and focus it (+6 more)

### Community 14 - "Distribution & Build (PyInstaller)"
Cohesion: 0.10
Nodes (27): PyInstaller, Installer Options (Inno Setup / NSIS), JARVIS_Backend.spec, JARVIS Distribution Guide, One-file vs One-dir Packaging, PyInstaller Backend Build, START_JARVIS.bat, Web Deployment (Heroku/Railway/Netlify) (+19 more)

### Community 15 - "System Commands"
Cohesion: 0.12
Nodes (10): Any, Handle system-related commands, Sleep/suspend computer, Get current screen brightness, Set screen brightness (0-100), Get network connection information, Open web browser for Google search, Get weather info (simplified browser-based or API if key available) (+2 more)

### Community 16 - "File Manager"
Cohesion: 0.13
Nodes (10): FileManager, Path, List files in folder with optional pattern matching, Cross-platform file system manager, Search for files by name, Get common folder paths, Resolve folder name to path (supports fuzzy matching), Rename file or folder (+2 more)

### Community 17 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, isolatedModules, jsx (+11 more)

### Community 18 - "WhatsApp Integration"
Cohesion: 0.18
Nodes (9): Open WhatsApp Web in browser, WhatsApp automation via Web and Desktop, Open WhatsApp Desktop application, Send message via WhatsApp Web, Find WhatsApp Desktop installation, Send message via WhatsApp Desktop automation, Check if WhatsApp Desktop is running, Search for contact in WhatsApp Desktop (+1 more)

### Community 19 - "React UI Components"
Cohesion: 0.18
Nodes (10): ArcReactor(), ArcReactorProps, PermissionModal(), PermissionModalProps, VolumeControl(), VolumeControlProps, Conversation, MemoryViewer() (+2 more)

### Community 20 - "Voice Service & Types"
Cohesion: 0.19
Nodes (9): HistoryLog(), HistoryLogProps, CommandResult, ISpeechRecognitionErrorEvent, ISpeechRecognitionEvent, SpeechRecognitionAlternative, SpeechRecognitionResult, SpeechRecognitionResultList (+1 more)

### Community 21 - "App Entry & Voice"
Cohesion: 0.18
Nodes (7): App(), root, rootElement, voiceService, Language, ENGLISH, HINDI

### Community 22 - "Module Functionality Tests"
Cohesion: 0.26
Nodes (11): main(), Test input control module, Module Functionality Test Script Tests specific functionality of each module, Test automation module, Test file manager module, test_automation(), test_desktop(), test_file_manager() (+3 more)

### Community 23 - "Bilingual Parser"
Cohesion: 0.22
Nodes (6): BilingualParser, Parse and translate between Hindi and English commands, Build reverse mapping from Hindi phrases to command keys, Get response text in the appropriate language, Detect if text is Hindi or English, Parse command text and return (command_key, language, parameters)

### Community 24 - "Constants & Command Processor"
Cohesion: 0.24
Nodes (6): CONTACTS, GREETINGS, INITIAL_VOLUME, UNKNOWN_COMMAND, ProcessedCommand, SecurityService

### Community 25 - "Sync Tests"
Cohesion: 0.31
Nodes (8): main(), Test command routing to modules, Backend-Frontend Sync Test Script Tests WebSocket connection and command…, Test REST API endpoints, Test WebSocket endpoint, test_command_routing(), test_rest_endpoints(), test_websocket()

### Community 26 - "Command Endpoints"
Cohesion: 0.29
Nodes (7): execute_command(), handle_command(), Process a command and return result, WebSocket endpoint for real-time communication, REST endpoint for executing commands, websocket_endpoint(), WebSocket

### Community 27 - "Desktop Controls UI"
Cohesion: 0.36
Nodes (6): DesktopControls(), DesktopControlsProps, MediaTools(), MediaToolsProps, react, useJarvisBridge()

### Community 29 - "Status Broadcaster"
Cohesion: 0.40
Nodes (5): broadcast_system_status(), lifespan(), Startup and shutdown events, Broadcast system status to all connected clients every 5 seconds, FastAPI

### Community 30 - "LLM Module"
Cohesion: 0.40
Nodes (3): LLMModule, Module for handling conversational AI using OpenRouter or Gemini, Get a response from the LLM with automatic fallback

### Community 31 - "Module Import Tests"
Cohesion: 0.50
Nodes (4): main(), Test importing a single module, Module Import Test Script Tests all backend modules for import errors and…, test_module()

### Community 32 - "Logging Utilities"
Cohesion: 0.50
Nodes (4): Custom console handler that handles UTF-8 encoding properly on Windows, Setup logger with file and console handlers, setup_logger(), UTF8ConsoleHandler

### Community 33 - "JARVIS Brand & Logo"
Cohesion: 0.50
Nodes (5): Arc-Reactor HUD Aesthetic (glowing cyan core, concentric rings, rotating arc segments, hexagon, orbiting dots, scan lines), JARVIS Bilingual Advanced AI Assistant Project, JARVIS Project Brand Identity (logo referenced as README.md banner, alt='JARVIS Logo'), JARVIS Logo - Animated Arc-Reactor HUD Emblem (SVG), SVG SMIL Animation (animate, animateTransform, animateMotion)

### Community 34 - "Automation Dashboard UI"
Cohesion: 0.40
Nodes (4): AutomationDashboard(), AutomationDashboardProps, Macro, Task

### Community 35 - "App State Modes"
Cohesion: 0.40
Nodes (5): AppMode, IDLE, LISTENING, PROCESSING, SPEAKING

### Community 36 - "OCR & Cursor APIs"
Cohesion: 0.33
Nodes (4): api_ocr_pdf(), move_cursor(), Move cursor to position, Extract text from PDF

### Community 37 - "Memory Facts API"
Cohesion: 0.50
Nodes (4): api_save_memory_fact(), Save a user fact/memory, MemoryEntry, User memory/fact storage

### Community 41 - "Frontend Dir Locator"
Cohesion: 0.67
Nodes (3): _find_frontend_dir(), Path, Find the frontend dist directory in multiple candidate locations.

## Knowledge Gaps
- **91 isolated node(s):** `ArcReactorProps`, `DesktopControlsProps`, `MediaToolsProps`, `PermissionModalProps`, `VolumeControlProps` (+86 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 362 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `handle_command()` connect `Backend Core & Config` to `Security & Confirmation`, `WebSocket Protocol & Docs`?**
  _High betweenness centrality (0.320) - this node is a cross-community bridge._
- **Why does `useJarvisBridge Hook` connect `WebSocket Protocol & Docs` to `React UI Components`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **What connects `ArcReactorProps`, `DesktopControlsProps`, `MediaToolsProps` to the rest of the system?**
  _91 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Core & Config` be split into smaller, more focused modules?**
  _Cohesion score 0.08056265984654731 - nodes in this community are weakly interconnected._
- **Should `Automation & Macros` be split into smaller, more focused modules?**
  _Cohesion score 0.062040816326530614 - nodes in this community are weakly interconnected._
- **Should `Input Control (Mouse/Keyboard)` be split into smaller, more focused modules?**
  _Cohesion score 0.06659619450317125 - nodes in this community are weakly interconnected._
- **Should `REST API: File/Media Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.08367071524966262 - nodes in this community are weakly interconnected._