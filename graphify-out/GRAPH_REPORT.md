# Graph Report - backend  (2026-06-23)

## Corpus Check
- 118 files · ~51,908 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1460 nodes · 2004 edges · 128 communities (90 shown, 38 thin omitted)
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 295 edges (avg confidence: 0.75)
- Token cost: 4,528 input · 2,351 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 115|Community 115]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 122|Community 122]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 125|Community 125]]
- [[_COMMUNITY_Community 126|Community 126]]

## God Nodes (most connected - your core abstractions)
1. `SystemModule` - 37 edges
2. `AutomationManager` - 32 edges
3. `BaseResponse` - 31 edges
4. `is_windows()` - 31 edges
5. `is_macos()` - 30 edges
6. `MediaProcessor` - 27 edges
7. `BilingualParser` - 26 edges
8. `InputController` - 26 edges
9. `DesktopManager` - 24 edges
10. `MemoryManager` - 24 edges

## Surprising Connections (you probably didn't know these)
- `cb()` --calls--> `CircuitBreaker`  [INFERRED]
  tests/test_v4.py → modules/llm_gateway/circuit.py
- `SystemModule` --uses--> `VolumeResponse`  [INFERRED]
  modules/system.py → models.py
- `SystemModule` --uses--> `UptimeResponse`  [INFERRED]
  modules/system.py → models.py
- `SystemModule` --uses--> `NetworkInfoResponse`  [INFERRED]
  modules/system.py → models.py
- `test_proactivity()` --calls--> `handle_command()`  [INFERRED]
  test_proactivity.py → handlers/command_handler.py

## Hyperedges (group relationships)
- **15 Core Backend Modules** — backend_modules_status_input_control, backend_modules_status_llm_module, backend_modules_status_media_module, backend_modules_status_desktop_module, backend_modules_status_automation_module, backend_modules_status_file_manager_module, backend_modules_status_bilingual_parser, backend_modules_status_context_module, backend_modules_status_memory_module, backend_modules_status_security_module, backend_modules_status_system_module, backend_modules_status_whatsapp_module, backend_modules_status_window_manager [EXTRACTED 1.00]
- **Phase 6 Premium Features** — backend_modules_status_ai_vision_hud, backend_modules_status_whatsapp_pro, backend_modules_status_neural_map, backend_modules_status_rich_aesthetics [EXTRACTED 1.00]
- **v4.0 Development Additions** — backend_requirements_dev_database_stack, backend_requirements_dev_observability_stack, backend_requirements_dev_audio_streaming, backend_requirements_dev_testing [EXTRACTED 1.00]

## Communities (128 total, 38 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (39): InputController, Cross-platform mouse and keyboard controller with human-like delays, Add random human-like delay (async), Drag from start to end position, Type text with human-like speed, Delay between keystrokes (typing speed) (async), Get current cursor position, Press multiple keys simultaneously (hotkey) (+31 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (29): AutomationManager, Macro, Save tasks and macros to file asynchronously, Start the scheduler as an async task, Run the async scheduler loop, Determine if a task should run based on its schedule and condition, Evaluate a simple automation condition, Execute a scheduled task asynchronously (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (29): get_config(), Load user config from JSON, merging with defaults, Save user config to JSON, save_config(), get_battery_status(), get_command_insights(), get_network_info(), get_network_scan() (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (42): boss, aliases, language_preference, name, phone, role, brother, aliases (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (19): DesktopManager, Save base64 screenshot to file, Get text from clipboard, Set text to clipboard, Screenshots, clipboard, and media controls, Play/pause media playback, Mute/unmute system volume, Increase system volume (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (21): MediaProcessor, Extract text from PDF file, Take screenshot, extract text, and categorize content, OCR, PDF, and Image processing tools, Categorize OCR text into workspace types (Code, Browser, Doc, etc.), Capture screenshot and analyze it using a multimodal LLM, Locate tesseract binary and verify it runs., Merge multiple PDFs into one (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (20): Search for contact in WhatsApp Desktop (async), WhatsApp automation via Web and Desktop, Open WhatsApp Web in browser, Open WhatsApp (prefers desktop), Open WhatsApp Desktop application, Send message (prefers desktop if running, else web), Send message via WhatsApp Web, Initialize the manager async (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (23): event_loop(), mock_desktop(), mock_llm(), mock_memory(), mock_system(), MockConnection, MockPool, JARVIS v3.8.0 — Test Configuration & Shared Fixtures  Provides isolated test dat (+15 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (17): Find executable path for an application asynchronously, Cross-platform window and application manager, List all running applications, Get list of windows on Windows asynchronously, Initialize platform-specific components, Get list of open windows, Get list of running processes asynchronously, Show desktop (minimize all windows) (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (20): BatteryInfo, BatteryResponse, CPUInfo, DateResponse, DiskInfo, MemoryInfo, NetworkIOInfo, SystemStatusResponse (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (32): ApiKeyStatusResponse, ApiKeyUpdateRequest, AutomationTaskRequest, CommandRequest, ConfirmationRequest, ConversationEntryModel, ConversationEntryRequest, DevicePairingRequest (+24 more)

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (9): connection(), DatabaseManager, MockCursor, MockCursorWrapper, _parse_url(), JARVIS v4.0 — Async PostgreSQL Database Manager Drop-in replacement for the SQLi, PostgreSQL connection pool manager with:     - Async connection pooling (asyncpg, transaction() (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (30): AI Vision HUD, Antigravity AI Agent, Automation Module, Bilingual Parser (English/Hindi), Context Module, Core API Stack (FastAPI/Uvicorn/WebSockets), Desktop Module, File Manager Module (+22 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (11): FileManager, List files in folder with optional pattern matching, Cross-platform file system manager, Search for files by name, Get common folder paths, Delete file or folder (with confirmation), Resolve folder name to path (supports fuzzy matching), Rename file or folder (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (15): MemoryManager, Manage conversation history and user memory, Initialize memory system asynchronously, Save a conversation entry, Get conversation statistics, Mines command history to produce behavioral usage insights.                  U, Save system performance metrics to database, Retrieve recent performance history (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (12): ContextManager, Update context with mobile sensor data (battery, network, etc.), Detect user mood from input, Extract text from current screen and perform structural analysis to enrich conte, Suggest an alternative when a command fails, Suggest next action based on context, Generate proactive suggestions based on active window and system state, Manage conversation context and intent recognition (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (8): ABC, GoogleAdapter, OllamaAdapter, OpenAICompatibleAdapter, ProviderAdapter, Provider adapters for LLM Gateway.  Each adapter wraps a specific LLM provider a, Adapter for Google Gemini via OpenAI-compatible endpoint., Single adapter for any OpenAI-compatible provider (NVIDIA, OpenRouter, OpenAI, G

### Community 17 - "Community 17"
Cohesion: 0.1
Nodes (14): BaseHTTPMiddleware, _get_configured_key(), MaxBodySizeMiddleware, PerRouteRateLimiter, Security Middleware — CSP headers, input sanitization, body limits, per-route ra, Single source for API key — matches main.py module-level BACKEND_API_KEY., FastAPI dependency — requires valid API key for protected routes.      Bypasses, Wraps an ASGI receive callable to deliver a pre-read body. (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (22): AppListResponse, BaseResponse, ClipboardResponse, ConversationListResponse, CursorPositionResponse, FactListResponse, FileInfoResponse, FileListResponse (+14 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (8): BilingualParser, Parse and translate between Hindi and English commands, Build reverse mapping from Hindi phrases to command keys, Test bilingual command parsing accuracy., Every command key should have at least one trigger phrase., Hindi phrases should map back to valid command keys., Short phrases must not match inside longer words (e.g. time vs uptime)., TestBilingualParsing

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (10): NeuralMemoryManager, Log a user decision (Approval/Rejection) to decisions.md, Read content and parse metadata of a memory node, Dynamically collect relevant memory nodes for LLM context.         Uses hybrid, Calculate semantic similarity scores via pgvector cosine distance, Synchronize Markdown nodes with vector embeddings in the database, Manage file-based Markdown memory nodes, Read content of a specific memory node (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (10): Manage command confirmations and security checks, Get status of confirmation: None=pending, True=confirmed, False=rejected/timeout, Register async callback for confirmation result, Get confirmation request details, Remove expired confirmations, Check if command requires confirmation, Request user confirmation for dangerous command         Returns confirmation_id, Handle confirmation timeout (+2 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (5): Run a GUI action (pyautogui) in a thread pool with safety checks, Run a system command asynchronously with timeout and safety, Wrapper for GUI and system automation to ensure safety and reliability, Return a PIL Image from pyautogui.screenshot, or raise on failure., SafeAutomation

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (14): get_facts(), get_memory_node(), list_memory_nodes(), Update a Markdown memory node, Save conversation entry, Inject new memory fact, Retrieve learned facts, Update existing manual memory (+6 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (14): add_request_id(), broadcast_system_status(), _find_frontend_dir(), lifespan(), monitor_event_loop_lag(), periodic_prune_conversations(), Monitor event loop latency to detect blocking calls, Broadcast system status to all connected clients every 5 seconds (+6 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (15): CommandResult, test_proactivity(), dispatch_command(), handle_command(), JARVIS v4.0 — Command Handler (Orchestrator) Delegates to domain-specific handle, JARVIS v3.8.0 — Command Handler Tests  Validates that every registered command k, Verify response structure matches frontend expectations., Test individual command execution paths with mocked modules. (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.14
Nodes (10): AgentController, JARVIS v3.9.0 — Autonomous Agent Controller Implements the ReAct (Reasoning and, Write the complete ReAct trace to memory/agent_traces.md for auditability., Invoke the system tools via the direct dispatcher with safety checks., Manages the autonomous reasoning loop for JARVIS., Extract content of a field like 'Thought: ...' or 'Action: ..., Execute the Thought-Action-Observation loop to resolve a complex query., get_tools_prompt() (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (8): Background listening loop with noise gate and dynamic cooldown, Local Wake-Word Detection Engine using OpenWakeWord (v2).     Runs in a backgrou, Attempt to reopen microphone stream after failure, Load the model and prepare the audio stream, with graceful fallback, Start listening for the wake word, Simple RMS-based noise gate — returns True if signal is above threshold, Higher confidence = shorter cooldown (0.5–2.0s), WakeWordEngine

### Community 28 - "Community 28"
Cohesion: 0.21
Nodes (7): AsyncDatabaseManager, connection(), _parse_url(), JARVIS v4.0 — Async PostgreSQL Database Manager Drop-in replacement for the SQLi, Parse a postgresql+asyncpg:// URL into connection kwargs., PostgreSQL connection pool manager with:     - Async connection pooling (asyncpg, transaction()

### Community 29 - "Community 29"
Cohesion: 0.16
Nodes (8): ProactiveManager, Use LLM to determine if a proactive suggestion is helpful, Intelligent background engine for proactive suggestions, Send the suggestion to all connected clients, Start the proactive analysis loop, Stop the proactive analysis loop, Background loop for situational awareness, Re-index what the user has historically rejected so we stop repeating them

### Community 30 - "Community 30"
Cohesion: 0.12
Nodes (10): drag(), get_cursor_position(), hotkey(), move_cursor(), Get current cursor position, Move cursor to position, Type text keyboard simulation, Drag mouse from start to end position (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.13
Nodes (13): DevicePairingResponse, MobileTelemetryResponse, SyncStatusResponse, get_new_pairing_code(), get_paired_devices(), get_sync_status(), pair_device(), Update mobile sensor data for proactive intelligence (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (6): RAGContext, RAGPipeline, RAG Pipeline — retrieves relevant context from memory and formats it for LLM con, HybridSearch, Hybrid Search — combines keyword (fuzzy) + semantic (pgvector) retrieval. Uses r, SearchResult

### Community 33 - "Community 33"
Cohesion: 0.13
Nodes (6): change_wallpaper(), Capture specific area, Copy text to clipboard, Change desktop wallpaper, screenshot_region(), set_clipboard_text()

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (3): ProviderConfig, LLMGateway, TestLLMGateway

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (8): Test input control module, Test automation module, Test file manager module, Test Vision capability (Visual Analysis), test_automation(), test_file_manager(), test_input_control(), test_vision()

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (10): WebSocketMessage, WebSocketResponse, Check system health and broadcast notifications for critical events, Scan for suspicious processes based on Neural Security Node and resource usage, push_notification(), Push a notification to all connected WebSocket clients, broadcast_notification(), Broadcast a UI notification to all connected WebSocket clients (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (11): create_macro(), create_task(), get_automation_status(), get_macros(), get_tasks(), Get scheduler engine status, List all scheduled tasks, Enable/Disable a task (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (8): delete_file(), get_file_info(), open_folder(), Open folder in explorer, Search for files in folder (recursive), Delete file or folder (safe trash), Get file or folder metadata, search_files()

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (5): cb(), JARVIS v4.0 — Tests for LLM Gateway, RAG Pipeline, Agent Router, Security Middle, TestAudioServices, TestCircuitBreaker, TestRAGPipeline

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (12): call_contact(), draft_whatsapp_reply(), get_whatsapp_status(), list_contacts(), open_whatsapp(), Open WhatsApp Desktop app, Send a text message safely via automation, Initialize a voice or video call (+4 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (3): CircuitBreaker, Circuit Breaker — prevents cascading failures across providers., TestAgentRouter

### Community 42 - "Community 42"
Cohesion: 0.21
Nodes (5): CostTracker, Clear all history. Returns the number of records evicted., Bounded cost tracker — retains only the most recent MAX_HISTORY records., cost_tracker(), TestCostTracker

### Community 43 - "Community 43"
Cohesion: 0.15
Nodes (5): Cost Tracker — per-provider token usage and cost estimation. Bounded to 1000 mos, Export records as JSON-serializable list of dicts., Serialize for JSON export., Record a usage event. Oldest record is auto-evicted when full., UsageRecord

### Community 45 - "Community 45"
Cohesion: 0.21
Nodes (5): EmbeddingService, Embedding Service — generates vector embeddings via available LLM providers., Get embedding dimension from database schema, caching it., Embed a single text, gated by the concurrency semaphore., Embed multiple texts concurrently with bounded concurrency.         Returns a li

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (6): activate_window(), maximize_window(), minimize_window(), Minimize active window or specified window, Maximize active window or specified window, Activate window by title

### Community 47 - "Community 47"
Cohesion: 0.27
Nodes (11): audit_env(), audit_module_imports(), audit_parser(), audit_tesseract(), main(), JARVIS Project Audit — parser, dispatch coverage, module imports, pytest summary, Safe read-only command smoke tests (no shutdown/restart)., Run fast unit tests only. Full suite: python -m pytest tests/ -q (+3 more)

### Community 49 - "Community 49"
Cohesion: 0.24
Nodes (6): Enum, PersonalityManager, PersonalityType, Manages JARVIS personalities, themes, and conversational styles, Get the configuration for the current personality, Get list of all available personalities for UI selection

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (10): agent_chat(), agent_health(), agent_rag_search(), agent_stream(), AgentQuery, JARVIS v4.0 — Agent Streaming Router Exposes Server-Sent Events (SSE) endpoint f, Retrieve RAG context without LLM generation., Non-streaming agent response with optional RAG context. (+2 more)

### Community 51 - "Community 51"
Cohesion: 0.2
Nodes (10): get_keys(), get_settings(), Verify an API key by making a test request, Get all current settings, Get status of configured API keys (redacted), Update system configuration, Update API keys in the .env file, test_key() (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.18
Nodes (4): JARVIS v3.8.0 — Memory Module Tests, TestConversationCRUD, TestMemoryFacts, TestPerformanceMetrics

### Community 53 - "Community 53"
Cohesion: 0.2
Nodes (6): MemoryEntry, User memory/fact storage, Save a memory/fact about the user, Get all memories in a category, Search memory entries, Save a system setting to memory

### Community 54 - "Community 54"
Cohesion: 0.24
Nodes (5): PairingManager, Generate a new pairing code, Check if a code is valid and not expired, Remove expired codes from the active list, Manages temporary pairing codes for mobile device linking

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (8): images_to_pdf(), merge_pdfs(), pdf_to_images(), Merge multiple PDF files, Split specific PDF pages, Convert PDF pages to images, Create PDF from image list, split_pdf()

### Community 56 - "Community 56"
Cohesion: 0.36
Nodes (7): main(), Test command routing to modules, Test REST API endpoints, Test WebSocket endpoint, test_command_routing(), test_rest_endpoints(), test_websocket()

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (4): IntentAnalysis, Analyze user intent from input, Extract entities from user input, Analysis of user intent

### Community 58 - "Community 58"
Cohesion: 0.25
Nodes (5): Verify command routing completeness and correctness., Every command key in HINDI_COMMANDS must be coverable by         the DOMAIN_HAND, Sanity check: the command registry must have entries., Verify Hindi command mappings are registered., TestCommandDispatch

### Community 59 - "Community 59"
Cohesion: 0.25
Nodes (4): mDNSBroadcaster, Start the mDNS broadcast, Stop the mDNS broadcast, Broadcasts the JARVIS service on the local network using mDNS (ZeroConf).     Al

### Community 61 - "Community 61"
Cohesion: 0.29
Nodes (4): ConversationEntry, Single conversation entry, Get recent conversation history, Search conversation history

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (6): get_quick_actions(), get_suggestion(), Get a context-aware proactive suggestion on demand, Get list of user-configured quick actions, Update user-configured quick actions, update_quick_actions()

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (6): ocr_image(), ocr_pdf(), ocr_screen(), Extract text from image, Extract text from PDF page, Extract text from current screen (OCR + Screen Analytics)

### Community 64 - "Community 64"
Cohesion: 0.29
Nodes (6): confirm_command(), execute_command(), get_pending_actions(), Execute a single command via REST, Confirm or deny a pending dangerous command, List actions awaiting confirmation

### Community 66 - "Community 66"
Cohesion: 0.4
Nodes (3): Alembic environment config for async PostgreSQL migrations., run_async_migrations(), run_migrations_online()

### Community 67 - "Community 67"
Cohesion: 0.33
Nodes (3): HealthMonitor, Advanced health monitoring for JARVIS backend, Generate a comprehensive health report

### Community 68 - "Community 68"
Cohesion: 0.33
Nodes (3): ContextState, Current context state, Clear current context

### Community 69 - "Community 69"
Cohesion: 0.33
Nodes (3): Parse command text and return (command_key, language, parameters), Match phrase with word boundaries for single-token triggers., Detect if text is Hindi or English

### Community 70 - "Community 70"
Cohesion: 0.6
Nodes (5): configure_logging(), get_logger(), log_event(), JARVIS v4.0 — Structured Logging Replaces the basic logging with structlog + Ope, _setup_opentelemetry()

### Community 72 - "Community 72"
Cohesion: 0.67
Nodes (3): main(), Test importing a single module, test_module()

## Knowledge Gaps
- **483 isolated node(s):** `Startup and shutdown events`, `Monitor event loop latency to detect blocking calls`, `Broadcast system status to all connected clients every 5 seconds`, `Periodically prune old conversations to prevent unbounded table growth.`, `Find the frontend directory in various environments (dev, bundled)` (+478 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ContextManager` connect `Community 15` to `Community 96`, `Community 68`, `Community 53`, `Community 57`, `Community 61`, `Community 95`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `MemoryManager` connect `Community 14` to `Community 53`, `Community 20`, `Community 61`, `Community 76`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `handle_command()` connect `Community 25` to `Community 64`, `Community 61`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 121 inferred relationships involving `str` (e.g. with `response_time_middleware()` and `add_request_id()`) actually correct?**
  _`str` has 121 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `SystemModule` (e.g. with `SystemStatusResponse` and `BatteryInfo`) actually correct?**
  _`SystemModule` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Startup and shutdown events`, `Monitor event loop latency to detect blocking calls`, `Broadcast system status to all connected clients every 5 seconds` to the rest of the system?**
  _483 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._