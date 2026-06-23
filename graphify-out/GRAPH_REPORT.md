# Graph Report - src  (2026-06-23)

## Corpus Check
- Corpus is ~36,164 words - fits in a single context window. You may not need a graph.

## Summary
- 417 nodes · 820 edges · 22 communities (16 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Client Service Layer|API Client Service Layer]]
- [[_COMMUNITY_Core App Layout & Components|Core App Layout & Components]]
- [[_COMMUNITY_Arc Reactor & Automation UI|Arc Reactor & Automation UI]]
- [[_COMMUNITY_Header Navigation & Voice Control|Header Navigation & Voice Control]]
- [[_COMMUNITY_API Type Definitions|API Type Definitions]]
- [[_COMMUNITY_API Client Types & Settings|API Client Types & Settings]]
- [[_COMMUNITY_Activity Feed & Device Sync|Activity Feed & Device Sync]]
- [[_COMMUNITY_Error Boundary|Error Boundary]]
- [[_COMMUNITY_Config, Audio WebSocket & Bridge|Config, Audio WebSocket & Bridge]]
- [[_COMMUNITY_Command Input & Agent Streaming|Command Input & Agent Streaming]]
- [[_COMMUNITY_WebSocket Connection Service|WebSocket Connection Service]]
- [[_COMMUNITY_Memory Viewer & Security Dashboard|Memory Viewer & Security Dashboard]]
- [[_COMMUNITY_Audio System Utilities|Audio System Utilities]]
- [[_COMMUNITY_Micro-interactions & HUD Audio|Micro-interactions & HUD Audio]]
- [[_COMMUNITY_Automation Dashboard & Editor|Automation Dashboard & Editor]]
- [[_COMMUNITY_Tooltip UI Component|Tooltip UI Component]]
- [[_COMMUNITY_Quick Responses|Quick Responses]]
- [[_COMMUNITY_Select UI Component|Select UI Component]]
- [[_COMMUNITY_Skeleton Loading Component|Skeleton Loading Component]]
- [[_COMMUNITY_Textarea UI Component|Textarea UI Component]]

## God Nodes (most connected - your core abstractions)
1. `ApiClient` - 66 edges
2. `useJarvisStore` - 45 edges
3. `useJarvisBridge()` - 21 edges
4. `WebSocketService` - 17 edges
5. `useNotifications()` - 15 edges
6. `VoiceService` - 12 edges
7. `Language` - 12 edges
8. `AudioSystem` - 11 edges
9. `AppMode` - 10 edges
10. `App()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `DeviceSyncHub()` --calls--> `useJarvisBridge()`  [EXTRACTED]
  components/DeviceSyncHub.tsx → hooks/useJarvisBridge.ts
- `NeuralTraining()` --calls--> `useJarvisBridge()`  [EXTRACTED]
  components/NeuralTraining.tsx → hooks/useJarvisBridge.ts
- `ActivityFeed()` --calls--> `useJarvisStore`  [EXTRACTED]
  components/ActivityFeed.tsx → store/jarvisStore.ts
- `ArcReactor()` --calls--> `useJarvisStore`  [EXTRACTED]
  components/ArcReactor.tsx → store/jarvisStore.ts
- `AutomationDashboard()` --calls--> `useNotifications()`  [EXTRACTED]
  components/AutomationDashboard.tsx → context/NotificationContext.tsx

## Communities (22 total, 6 thin omitted)

### Community 0 - "API Client Service Layer"
Cohesion: 0.06
Nodes (3): ApiClient, mockFetch, mockStatus

### Community 1 - "Core App Layout & Components"
Cohesion: 0.1
Nodes (33): AdvancedTools(), AmbientBackground(), AuditTimeline(), CommandPalette(), DesktopControls(), DesktopControlsProps, JarvisModals(), MainHUD() (+25 more)

### Community 2 - "Arc Reactor & Automation UI"
Cohesion: 0.07
Nodes (27): ArcReactor(), ArcReactorProps, equalizerBars, AutomationDashboard(), ConfirmationModal(), ConfirmationModalProps, MainHUDProps, PermissionModal() (+19 more)

### Community 3 - "Header Navigation & Voice Control"
Cohesion: 0.08
Nodes (20): SpeechRecognitionWindow, VoiceService, state, event, MockSpeechRecognition, MockSpeechRecognitionInstance, MockUtterance, onEnd (+12 more)

### Community 4 - "API Type Definitions"
Cohesion: 0.06
Nodes (32): ActiveWindowInfo, AgentChatRequest, AgentChatResponse, AgentHealthResponse, AgentRagResponse, AgentRagResult, AgentStreamChunk, AgentStreamDone (+24 more)

### Community 5 - "API Client Types & Settings"
Cohesion: 0.07
Nodes (29): ApiKeyUpdatePayload, ApiKeyUpdateResponse, BroadcastNotificationResponse, ConversationListResponse, ConversationSaveResponse, FactCreateResponse, FactDeleteResponse, FactListResponse (+21 more)

### Community 6 - "Activity Feed & Device Sync"
Cohesion: 0.1
Nodes (18): ActivityFeed(), DeviceSyncHub(), NeuralTraining(), SystemMetricsWidget(), VolumeControl(), VolumeControlProps, PairedDevice, VoiceProfile (+10 more)

### Community 7 - "Error Boundary"
Cohesion: 0.12
Nodes (11): ErrorBoundary, Props, State, typeConfig, Notification, NotificationContext, NotificationContextType, NotificationProvider() (+3 more)

### Community 8 - "Config, Audio WebSocket & Bridge"
Cohesion: 0.16
Nodes (13): AudioWSState, MessageHandler, StatusHandler, FEATURES, JarvisState, VisionData, NeuralLogEntry, CommandRequest (+5 more)

### Community 9 - "Command Input & Agent Streaming"
Cohesion: 0.14
Nodes (14): CommandInput(), AgentStreamOptions, AgentStreamState, useAgentStream(), CREATOR_INFO, detectLanguage(), ENGLISH_KEYWORDS, HINDI_KEYWORDS (+6 more)

### Community 11 - "Memory Viewer & Security Dashboard"
Cohesion: 0.2
Nodes (9): MemoryViewer(), MemoryViewerProps, ViewMode, NetworkConnection, SecurityDashboard(), ConversationEntry, MemoryFact, MemoryNodeInfo (+1 more)

### Community 14 - "Automation Dashboard & Editor"
Cohesion: 0.31
Nodes (7): AutomationDashboardProps, AutomationEditor(), AutomationEditorProps, AutomationMacro, AutomationStatusResponse, AutomationTask, MacroStep

### Community 15 - "Tooltip UI Component"
Cohesion: 0.4
Nodes (3): initialStyles, positionStyles, TooltipProps

### Community 16 - "Quick Responses"
Cohesion: 0.5
Nodes (3): ICON_MAP, QuickResponses(), QuickAction

## Knowledge Gaps
- **112 isolated node(s):** `JarvisModals`, `AuditTimeline`, `DeviceSyncHub`, `NeuralTraining`, `FEATURES` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiClient` connect `API Client Service Layer` to `Core App Layout & Components`, `Arc Reactor & Automation UI`, `API Client Types & Settings`, `Config, Audio WebSocket & Bridge`, `Memory Viewer & Security Dashboard`, `Automation Dashboard & Editor`, `Quick Responses`?**
  _High betweenness centrality (0.236) - this node is a cross-community bridge._
- **Why does `WebSocketService` connect `WebSocket Connection Service` to `Config, Audio WebSocket & Bridge`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `useJarvisStore` connect `Core App Layout & Components` to `Arc Reactor & Automation UI`, `Header Navigation & Voice Control`, `Activity Feed & Device Sync`, `Config, Audio WebSocket & Bridge`, `Command Input & Agent Streaming`, `Quick Responses`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `JarvisModals`, `AuditTimeline`, `DeviceSyncHub` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Client Service Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Core App Layout & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Arc Reactor & Automation UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._