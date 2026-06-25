# JARVIS v4.0 — Frontend Requirements Document (FRD)

> **Generated from**: Full backend source analysis (FastAPI, 110+ REST endpoints, 2 WS, 1 SSE)
> **Target Stack**: React 19 + TypeScript + Vite + Zustand + TanStack Query + Framer Motion
> **Design System**: Glassmorphism V3 (JARVIS Design System)
> **Last Updated**: 2026-06-26
>
> **⚠️ LEGACY NOTICE**: The frontend was rebuilt from this blueprint. All `src/` files now exist and implement the
> architecture described herein. This document serves as both the **design reference** and the **living specification**
> for the current implementation. The Master Task List (§14) tracks remaining work; completed tasks are marked ✓.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Page/Route Architecture](#2-pageroute-architecture)
3. [Component Tree](#3-component-tree)
4. [Service Layer](#4-service-layer)
5. [WebSocket Integration](#5-websocket-integration)
6. [State Management](#6-state-management)
7. [Type Definitions](#7-type-definitions)
8. [Hook Specifications](#8-hook-specifications)
9. [Real-Time Data Flow](#9-real-time-data-flow)
10. [Error Handling Strategy](#10-error-handling-strategy)
11. [Auth Flows](#11-auth-flows)
12. [UI/UX Requirements from Backend Logic](#12-uiux-requirements-from-backend-logic)
13. [Feature Priority Matrix](#13-feature-priority-matrix)
14. [Master Task List](#14-master-task-list)
15. [Frontend Complexity Report](#15-frontend-complexity-report)

---

## 1. Architecture Overview

### 1.1 System Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Browser (SPA)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │  Zustand   │  │ TanStack   │  │  WebSocket     │  │
│  │  Store     │◄─▶│ Query      │◄─▶│  Service       │  │
│  └─────┬──────┘  └─────┬──────┘  └───────┬────────┘  │
│        │               │                  │           │
│  ┌─────▼───────────────▼──────────────────▼────────┐  │
│  │              API Client Layer                    │  │
│  │          (apiClient.ts singleton)                │  │
│  └─────────────────────┬───────────────────────────┘  │
└────────────────────────┼──────────────────────────────┘
                         │ HTTP REST + SSE (X-API-Key)
                         ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Backend (:8000)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ REST Routes │  │  WS Routes   │  │ SSE Stream │  │
│  │ /api/v1/*   │  │  /ws         │  │ /agent/stream│ │
│  └─────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 1.2 Connection Architecture

| Connection Type | URL | Protocol | Auth | Purpose |
|---|---|---|---|---|
| REST API | `http://{host}:8000/api/v1/...` | HTTP/1.1 | `X-API-Key` header | All CRUD operations |
| Main WS | `ws://{host}:8000/ws` | WebSocket | `api_key` query param | Commands, status broadcasts, notifications |
| Audio WS | `ws://{host}:8000/api/v1/audio/ws/audio` | WebSocket | `api_key` query param | STT (base64→text), TTS (text→opus), TTS stream |
| SSE Stream | `POST http://{host}:8000/api/v1/agent/stream` | Server-Sent Events | `X-API-Key` header | Streaming LLM responses |

### 1.3 Frontend/Backend Alignment Principles

- **Every backend endpoint has exactly one service function** in `apiClient.ts` *(to be built)*
- **Every Pydantic model** has a corresponding TypeScript interface in `src/types/api.ts` *(to be built)*
- **Every WebSocket message type** is typed in `src/types/bridge.ts` *(to be built)*
- **Every data-fetching endpoint** has a TanStack Query hook in `src/hooks/useSystemQuery.ts` *(to be built)*

---

## 2. Page/Route Architecture

The app uses **React Router v7** with `BrowserRouter` for client-side SPA routing. Routes are defined inline in `src/App.tsx` using a single `<Routes>` block with a parent `/` route rendering inside `AppShell`'s `<Outlet />`. Each page is code-split via `React.lazy()` + `<Suspense>` for optimized chunk loading.

### Lazy Loading Architecture (`src/App.tsx`)

The `lazyPage()` helper resolves named function exports from each page module (pages use `export function ComponentName()` — not `export default`). It skips non-component exports (e.g. `MOCK_*` constants) and throws a descriptive error if no component is found, avoiding silent empty renders.

```typescript
// Created at module scope — never inside render — to prevent React remounting pages
const NeuralHUD = lazyPage(() => import('@/pages/NeuralHUD'));
```

Each route wraps its component in `<Suspense>` with a unique loading message. A catch-all `path="*"` redirects to `/hud`. The `SidebarNav` links map 1:1 with route paths as absolute URLs (`/settings`, `/timeline`, etc.).

An `ErrorBoundary` class component wraps the entire route tree, catching render errors and displaying a "SYSTEM MALFUNCTION" screen with a "REBOOT" button.

### Route Table

| Route | Page Component | Lazy Import | Suspense Fallback |
|-------|---------------|-------------|-------------------|
| `/hud` | `NeuralHUD` | `@/pages/NeuralHUD` | LOADING HUD... |
| `/settings` | `SettingsPage` | `@/pages/SettingsPage` | LOADING CONFIG... |
| `/timeline` | `AuditTimeline` | `@/pages/AuditTimeline` | LOADING TIMELINE... |
| `/sync` | `DeviceSyncHub` | `@/pages/DeviceSyncHub` | LOADING SYNC... |
| `/automation` | `AutomationDashboard` | `@/pages/AutomationDashboard` | LOADING AUTOMATION... |
| `/files` | `FileManager` | `@/pages/FileManager` | LOADING FILES... |
| `/windows` | `WindowManager` | `@/pages/WindowManager` | LOADING WINDOWS... |
| `/security` | `SecurityDashboard` | `@/pages/SecurityDashboard` | LOADING SECURITY... |
| `/whatsapp` | `WhatsAppControl` | `@/pages/WhatsAppControl` | LOADING WHATSAPP... |
| `/desktop` | `RemoteDesktop` | `@/pages/RemoteDesktop` | LOADING DESKTOP... |
| `/input` | `InputSimulator` | `@/pages/InputSimulator` | LOADING INPUT... |
| `/media-tools` | `MediaTools` | `@/pages/MediaTools` | LOADING MEDIA TOOLS... |
| `/training` | `NeuralTraining` | `@/pages/NeuralTraining` | LOADING TRAINING... |
| `/about` | `AboutPage` | `@/pages/AboutPage` | LOADING ABOUT... |
| `*` (catch-all) | — | — | Redirect → `/hud` |

### Entry Point (`src/main.tsx`)

- `BrowserRouter` wraps the entire `<App />` component
- `QueryClientProvider` (TanStack Query v5) wraps `BrowserRouter`
- An outer `<Suspense>` with "INITIALIZING NEURAL CORE..." fallback covers the initial lazy load of the entire app tree

### PAGE-1: Neural HUD (Main Dashboard)
- **Route**: `/` or `/hud`
- **Access**: Public (local) or Auth Required (remote)
- **Purpose**: Central command center — system status, voice commands, real-time metrics
- **Currently implemented as**: `NeuralInterfaceDashboard`
- **API Calls on Load**:
  | Call | Endpoint | Trigger | UI Update |
  |------|----------|---------|-----------|
  | 1 | `GET /system/status` | On mount + every 5s via WS broadcast | System status gauges |
  | 2 | `GET /settings` | On mount | Theme, language, provider |
  | 3 | `GET /context/suggestion` | On mount + every 30s | Proactive suggestion card |
  | 4 | `GET /context/quick-actions` | On mount | Quick action buttons |
  | 5 | `POST /agent/health` | On mount | Agent status badge |
- **UI Sections**:
  - **Arc Reactor** (center animated core) — mode indicator (IDLE/LISTENING/PROCESSING/SPEAKING)
  - **System Metrics Widget** — CPU, memory, disk, battery gauges (5s updates via WS)
  - **Command Input** — text input + voice button at bottom
  - **Command History** — scrollable conversation log (last 50 entries)
  - **Quick Actions** — 4 preset action buttons (configurable via `context/quick-actions`)
  - **Proactive Suggestion** — context-aware suggestion card (auto-dismisses after 8s)
  - **Agent Status Badge** — online/offline + active provider
  - **Connection Status Indicator** — green/red dot in header
- **States**: Loading (skeleton), Success (live data), Empty (first run), Error (backend offline), WS disconnected (reconnecting indicator)

### PAGE-2: Audit Timeline
- **Route**: `/timeline`
- **Access**: Auth Required
- **Purpose**: Chronological view of all system events, commands, and neural logs
- **Currently**: `AuditTimeline`
- **API Calls**:
  | Call | Endpoint | Trigger |
  |------|----------|---------|
  | 1 | `GET /memory/conversations?limit=100` | On mount |
  | 2 | `GET /system/performance/history?limit=60` | On mount |
  | 3 | `GET /system/command-insights?days=30` | Optional |
- **UI Sections**: Timeline list (filterable), performance chart overlay, search/filter bar
- **States**: Loading, Empty (no history), Error, Paginated

### PAGE-3: Device Sync Hub
- **Route**: `/sync`
- **Access**: Auth Required
- **Purpose**: Pair/unpair mobile devices, view sync status
- **Currently**: `DeviceSyncHub`
- **API Calls**:
  | Call | Endpoint | Trigger |
  |------|----------|---------|
  | 1 | `GET /sync/pairing-code` | "Generate Code" button |
  | 2 | `POST /sync/pair` | Submit pairing form |
  | 3 | `GET /sync/devices` | On mount |
  | 4 | `DELETE /sync/devices/{id}` | Unpair button |
  | 5 | `GET /sync/status` | On mount + every 30s |
- **UI Sections**: Pairing code display (QR + text), paired devices list, device detail card
- **States**: Loading, Empty (no devices), Error, Pairing in progress

### PAGE-4: Neural Training
- **Route**: `/training`
- **Access**: Auth Required
- **Purpose**: Voice profile management, neural training interface
- **Currently**: `NeuralTraining`
- **API Calls**:
  | Call | Endpoint | Trigger |
  |------|----------|---------|
  | 1 | `GET /neural/voice/profiles` | On mount |
  | 2 | `PUT /neural/voice/profiles/{id}` | Save profile |
  | 3 | `POST /neural/voice/profiles/{id}/train` | Start training |
  | 4 | `GET /system/personalities` | On mount |
- **UI Sections**: Voice profile editor, training progress bar, personality selector
- **States**: Loading, Training in progress (progress stream), Error

### PAGE-5: File Browser
- **Route**: `/files`
- **Access**: Auth Required
- **Purpose**: Navigate, search, and manage files on the host system
- **Currently**: `FileBrowser`
- **API Calls**:
  | Call | Endpoint | Trigger |
  |------|----------|---------|
  | 1 | `GET /files/list?folder={path}` | Folder navigation |
  | 2 | `POST /files/search` | Search query |
  | 3 | `POST /files/create` | New folder |
  | 4 | `POST /files/delete?confirmed=true` | Delete (with confirmation) |
  | 5 | `POST /files/copy` | Copy |
  | 6 | `POST /files/move` | Move |
  | 7 | `POST /files/rename` | Rename |
  | 8 | `GET /files/info?path={path}` | File details |
- **UI Sections**: Breadcrumb navigation, file grid/list view toggle, context menu (right-click), search bar, path input
- **States**: Loading, Empty folder, Error (permission denied), File deleted toast
- **⚠️ DANGEROUS**: Delete requires `confirmed=true` flag — frontend must show confirmation modal

### PAGE-6: Window Manager
- **Route**: `/windows`
- **Access**: Auth Required
- **Purpose**: View and control open windows and running apps
- **Currently**: `WindowManager`
- **API Calls**:
  | Call | Endpoint | Trigger | UI Update |
  |------|----------|---------|-----------|
  | 1 | `GET /windows/list` | On mount + 10s poll | Window cards |
  | 2 | `GET /apps/list` | On mount + 10s poll | App list |
  | 3 | `POST /apps/open` | Click "Open" | Optimistic add to list |
  | 4 | `POST /apps/close?confirmed=` | Click "Close" with confirm | Remove from list |
  | 5 | `POST /windows/minimize` /maximize /restore /activate | Window action buttons | Optimistic state update |
- **UI Sections**: Window cards (title, process, screenshot preview), app grid, window action toolbar
- **States**: Loading, Empty (no windows), Error

### PAGE-7: Settings (Modal or Page)
- **Route**: `/settings` (modal overlay on HUD, or full page)
- **Access**: Auth Required
- **Purpose**: Configure JARVIS settings, API keys, provider selection
- **Currently**: `SettingsModal`
- **API Calls**:
  | Call | Endpoint | Trigger |
  |------|----------|---------|
  | 1 | `GET /settings` | On open |
  | 2 | `GET /settings/keys` | On open |
  | 3 | `POST /settings` | Save settings |
  | 4 | `POST /settings/keys` | Save API keys |
  | 5 | `POST /settings/test-key` | "Test Key" button |
  | 6 | `POST /system/personality/{id}` | Personality change |
- **UI Sections**: Tabs (General, Provider, API Keys, System), provider selector dropdown, API key inputs with masked visibility toggle, personality selector cards, dangerous commands toggle

### PAGE-8: Automation Dashboard
- **Route**: `/automation`
- **Access**: Auth Required
- **Purpose**: Create, manage, and monitor scheduled tasks and macros
- **Currently**: `AutomationDashboard` + `AutomationEditor`
- **API Calls**:
  | Call | Endpoint | Trigger |
  |------|----------|---------|
  | 1 | `GET /automation/status` | On mount + 10s poll |
  | 2 | `GET /automation/tasks` | On mount |
  | 3 | `POST /automation/task` | Create task |
  | 4 | `POST /automation/task/{id}/toggle` | Toggle enable/disable |
  | 5 | `DELETE /automation/task/{id}` | Delete task |
  | 6 | `GET /automation/macros` | On mount |
  | 7 | `POST /automation/macro` | Create macro |
  | 8 | `POST /automation/macro/{id}/run` | Run macro |
- **UI Sections**: Task list with toggle switches, macro list with run buttons, create/edit forms (slide-out panel or modal), scheduler status indicator

### PAGE-9: Security Dashboard
- **Route**: `/security`
- **Access**: Auth Required
- **Purpose**: Monitor running processes, network connections, quarantine threats
- **Currently**: `SecurityDashboard`
- **API Calls**:
  | Call | Endpoint | Trigger |
  |------|----------|---------|
  | 1 | `GET /system/security/processes` | On mount + 5s poll |
  | 2 | `GET /system/security/connections` | On mount + 5s poll |
  | 3 | `POST /system/security/quarantine?pid=&action=` | Quarantine/Resume/Terminate button |
- **UI Sections**: Process table (sortable by CPU/memory), network connections table, threat level badges, action buttons (quarantine/resume/terminate)
- **⚠️ DANGEROUS**: Terminate requires double confirmation

### PAGE-10: WhatsApp Panel
- **Route**: `/whatsapp`
- **Access**: Auth Required
- **Purpose**: Control WhatsApp Desktop, send messages, make calls
- **Currently**: `WhatsAppPanel`
- **API Calls**:
  | Call | Endpoint | Trigger |
  |------|----------|---------|
  | 1 | `GET /whatsapp/status` | On mount |
  | 2 | `GET /whatsapp/contacts` | On mount |
  | 3 | `POST /whatsapp/send` | Send button |
  | 4 | `POST /whatsapp/call` | Call button |
  | 5 | `POST /whatsapp/draft_reply` | Draft button |
  | 6 | `POST /whatsapp/open` | Open WhatsApp |
- **UI Sections**: Status badge (installed/running), contact list with search, message composer, call button (voice/video), draft reply button

### PAGE-11: Desktop Controls
- **Route**: `/desktop`
- **Access**: Auth Required
- **Purpose**: Screen capture, clipboard, media playback, wallpaper management
- **Currently**: `DesktopControls`
- **API Calls**:
  | Call | Endpoint | Trigger |
  |------|----------|---------|
  | 1 | `GET /desktop/screenshot` | Screenshot button |
  | 2 | `POST /desktop/screenshot/region` | Region select tool |
  | 3 | `GET /desktop/clipboard/text` | Read clipboard |
  | 4 | `POST /desktop/clipboard/text` | Set clipboard |
  | 5 | `DELETE /desktop/clipboard` | Clear clipboard |
  | 6 | `POST /desktop/media/play\|next\|previous\|stop` | Media controls |
  | 7 | `POST /desktop/wallpaper` | Change wallpaper |
  | 8 | `POST /desktop/zoom` | Zoom |
- **UI Sections**: Screenshot preview with region selector, clipboard read/write panel, media playback controls (play/pause/next/prev/stop), wallpaper picker, zoom slider

### PAGE-12: Input Simulator
- **Route**: `/input`
- **Access**: Auth Required
- **Purpose**: Remote mouse and keyboard control
- **Currently**: `InputSimulator`
- **API Calls**:
  | Call | Endpoint | Trigger |
  |------|----------|---------|
  | 1 | `GET /input/cursor` | On mount + 2s poll |
  | 2 | `POST /input/move` | Mouse move (debounced) |
  | 3 | `POST /input/click` | Click button |
  | 4 | `POST /input/double_click` | Double click |
  | 5 | `POST /input/right_click` | Right click |
  | 6 | `POST /input/type` | Type text |
  | 7 | `POST /input/press` | Key press |
  | 8 | `POST /input/scroll` | Scroll wheel |
  | 9 | `POST /input/drag` | Drag operation |
  | 10 | `POST /input/shortcut` | Hotkey combo |
- **UI Sections**: Virtual touchpad (canvas for mouse movement), cursor coordinates display, click buttons, keyboard input field, hotkey composer

### PAGE-13: Media Tools
- **Route**: `/media-tools`
- **Access**: Auth Required
- **Purpose**: OCR, image processing, PDF manipulation
- **Currently**: `MediaToolsPanel`
- **API Calls**:
  | Call | Endpoint | Trigger |
  |------|----------|---------|
  | 1 | `POST /media/ocr/image` | OCR image |
  | 2 | `POST /media/ocr/pdf` | OCR PDF |
  | 3 | `POST /media/ocr/screen` | OCR screen |
  | 4 | `POST /image/convert` | Convert format |
  | 5 | `POST /image/resize` | Resize |
  | 6 | `POST /image/compress` | Compress |
  | 7 | `POST /pdf/merge` | Merge PDFs |
  | 8 | `POST /pdf/split` | Split PDF |
  | 9 | `POST /pdf/to-images` | PDF→Images |
  | 10 | `POST /pdf/from-images` | Images→PDF |
- **UI Sections**: OCR result viewer, image upload + preview, format selector, quality slider, PDF file list with actions

### PAGE-14: About
- **Route**: `/about`
- **Access**: Public (local) or Auth Required (remote)
- **Purpose**: Application version info, credits, license, system overview
- **Currently**: `AboutPage`
- **API Calls**: None (static content)
- **UI Sections**: App version and build info, developer credits, open-source licenses, theme attribution

---

## 3. Component Tree

### 3.1 Layout Components

| Component | Type | Used On | Description |
|---|---|---|---|
| `AmbientBackground` | Layout | All pages | Animated gradient particle background |
| `Header` | Layout | All pages | Top bar with connection status, language toggle, view switcher nav |
| `Footer` | Layout | All pages | Version info, system status bar |
| `AppShell` | Layout | All pages | Responsive shell with sidebar nav, content area |
| `SidebarNav` | Layout | All pages | Collapsible sidebar with page links |

### 3.2 Core UI Components (already exist in `ui/`)

| Component | Props | Description |
|---|---|---|
| `Button` | `variant, size, loading, disabled, title, ariaLabel` | Glassmorphism button with hover/active transitions |
| `Input` | `label, error, helperText, ...inputProps` | Styled text input with validation state |
| `Textarea` | `label, rows, maxLength, ...textareaProps` | Styled textarea |
| `Select` | `options, value, onChange, placeholder` | Styled dropdown |
| `Card` | `title, subtitle, variant, onClick` | Glass panel card |
| `Modal` | `isOpen, onClose, title, size` | Animated modal overlay |
| `Tabs` | `tabs: {id, label, content}[]` | Tab switcher |
| `Badge` | `variant, children` | Status badge (success/warning/error/info) |
| `Skeleton` | `width, height, variant` | Loading skeleton |
| `Tooltip` | `content, children, position` | Hover tooltip |

### 3.3 Feature Components

```
AppShell
├── Header
│   ├── ConnectionIndicator (live WS status dot)
│   ├── LanguageToggle (EN ↔ HI ↔ HINGLISH)
│   ├── ViewSwitcher (nav links to all pages)
│   └── QuickSettingsButton (opens SettingsModal)
├── SidebarNav (collapsible icon + label nav, links map 1:1 with route paths)
├── <Routes> (defined inline in App.tsx, lazy-loaded via React.lazy + Suspense)
│   ├── PAGE-1: NeuralHUD
│   │   ├── ArcReactor (mode indicator animation)
│   │   ├── SystemMetricsWidget (CPU/Memory/Disk/Battery gauges)
│   │   ├── ProactiveSuggestionCard (auto-dismissing)
│   │   ├── QuickActionsGrid (4 configurable action buttons)
│   │   ├── CommandHistoryList (scrollable conversation log)
│   │   ├── CommandInput (text input + voice button)
│   │   └── AgentStatusBadge
│   │
│   ├── PAGE-2: AuditTimeline
│   │   ├── TimelineFilter (date range, type filter)
│   │   ├── TimelineList (virtualized)
│   │   │   └── TimelineEntry (icon, text, timestamp)
│   │   ├── PerformanceChart (line chart CPU/memory over time)
│   │   └── InsightsPanel (command usage stats)
│   │
│   ├── PAGE-3: DeviceSyncHub
│   │   ├── PairingCodeDisplay (large text + QR code)
│   │   ├── DeviceList
│   │   │   └── DeviceCard (name, type, last seen, unpair button)
│   │   └── PairDeviceForm (code input + device name)
│   │
│   ├── PAGE-4: NeuralTraining
│   │   ├── VoiceProfileList
│   │   │   └── VoiceProfileCard (name, lang, pitch/rate sliders)
│   │   ├── TrainingProgressBar (animated)
│   │   └── PersonalitySelector (grid of personality cards)
│   │
│   ├── PAGE-5: FileBrowser
│   │   ├── BreadcrumbNav
│   │   ├── FileToolbar (new folder, search, view toggle)
│   │   ├── FileGridView / FileListView
│   │   │   └── FileItem (icon, name, size, date, context menu)
│   │   ├── FileContextMenu (copy/move/rename/delete)
│   │   ├── FileSearchBar (with debounced search)
│   │   └── FileOperationConfirmModal
│   │
│   ├── PAGE-6: WindowManager
│   │   ├── AppGrid (running apps)
│   │   │   └── AppCard (icon, name, CPU/memory, close button)
│   │   ├── WindowList
│   │   │   └── WindowCard (title, preview, minimize/maximize/restore/activate)
│   │   └── AppLauncher (search + open app)
│   │
│   ├── PAGE-7: SettingsModal
│   │   ├── SettingsTabs (General, Provider, API Keys, System)
│   │   ├── ProviderSelector (radio cards)
│   │   ├── ApiKeyInput (masked, with Test button)
│   │   ├── PersonalitySelector (same as NeuralTraining)
│   │   ├── DangerousCommandsToggle (with warning)
│   │   └── WakeWordConfig (enable toggle + phrase input)
│   │
│   ├── PAGE-8: AutomationDashboard
│   │   ├── SchedulerStatusBadge
│   │   ├── TaskList
│   │   │   └── TaskCard (name, schedule, toggle, delete)
│   │   ├── MacroList
│   │   │   └── MacroCard (name, commands, run button)
│   │   └── AutomationEditor (slide-out panel)
│   │       ├── TaskForm (name, command, schedule type, interval/cron)
│   │       └── MacroForm (name, commands list, trigger phrase)
│   │
│   ├── PAGE-9: SecurityDashboard
│   │   ├── ProcessTable (sortable columns, threat badges)
│   │   ├── NetworkConnectionTable
│   │   ├── QuarantineActionBar (suspend/resume/terminate)
│   │   └── ThreatAlertBanner (critical threats)
│   │
│   ├── PAGE-10: WhatsAppPanel
│   │   ├── WhatsAppStatusBadge
│   │   ├── ContactList (searchable)
│   │   ├── MessageComposer (contact select + message input + send)
│   │   ├── CallControls (voice/video call buttons)
│   │   └── DraftReplyButton
│   │
│   ├── PAGE-11: DesktopControls
│   │   ├── ScreenshotViewer (image preview + region selector)
│   │   ├── ClipboardPanel (read/set/clear)
│   │   ├── MediaPlayerControls (play/pause/next/prev/stop)
│   │   ├── WallpaperPicker (file path input + apply)
│   │   └── ZoomSlider
│   │
│   ├── PAGE-12: InputSimulator
│   │   ├── VirtualTouchpad (canvas for mouse control)
│   │   ├── CursorCoordinates (x, y display)
│   │   ├── MouseButtonPanel (left/right/double/scroll)
│   │   ├── KeyboardInput (type text, press key)
│   │   └── HotkeyComposer (key selection + send)
│   │
│   ├── PAGE-13: MediaTools
│   │   ├── OcrResultViewer (text result + confidence)
│   │   ├── ImageToolPanel (upload, format select, quality slider)
│   │   └── PdfToolPanel (file paths, merge/split buttons)
│   │
│   └── PAGE-14: AboutPage (static — app version, credits, licenses)
│
├── CommandPalette (global Ctrl+K overlay)
├── NotificationCenter (toast stack in top-right)
├── ConfirmationModal (dangerous action confirmations)
├── PermissionModal (permission requests)
├── VisionOverlay (OCR screenshot preview overlay)
└── JarvisModals (aggregate of all modals)
```

---

## 4. Service Layer

### 4.1 API Client Architecture (`src/services/apiClient.ts`)

The frontend needs an `ApiClient` class (to be created from scratch). Here is the **complete service surface**:

```typescript
class ApiClient {
  constructor(baseUrl: string = API_BASE_URL)
  
  // Generic methods
  async get<T>(path: string): Promise<T>
  async post<T>(path: string, body: unknown): Promise<T>
  async put<T>(path: string, body: unknown): Promise<T>
  async delete<T>(path: string): Promise<T>
  async safeRequest<T>(fn: () => Promise<T>): Promise<T | null>
}
```

### 4.2 Complete Service Function Inventory

All functions must be added to `apiClient.ts` with typed signatures. Functions already existing (in the deleted codebase) are marked with ✓ — these serve as an inventory of everything that needs to be rebuilt.

#### Health & Probes
```typescript
✓ healthCheck(): Promise<HealthCheckResponse>
✓ readinessProbe(): Promise<{ status: string }>
✓ livenessProbe(): Promise<{ status: string }>
```

#### Commands
```typescript
✓ executeCommand(command: string, language: 'en'|'hi'|'hinglish'): Promise<CommandResult>
✓ confirmCommand(confirmationId: string, approved: boolean): Promise<BaseResponse>
✓ getPendingConfirmations(): Promise<PendingConfirmationsResponse>
```

#### Agent
```typescript
✓ agentChat(query: string, language?: string, useRag?: boolean): Promise<AgentChatResponse>
✓ agentRagSearch(query: string): Promise<AgentRagResponse>
✓ agentHealth(): Promise<AgentHealthResponse>
// SSE agent stream is handled via useAgentStream hook, not this class
```

#### System
```typescript
✓ getSystemStatus(): Promise<SystemStatus>
✓ getBattery(language?: string): Promise<BatteryResponse>
✓ getTime(language?: string): Promise<TimeResponse>
✓ getDate(language?: string): Promise<DateResponse>
✓ getUptime(language?: string): Promise<UptimeResponse>
✓ getNetworkInfo(language?: string): Promise<NetworkResponse>
✓ getWeather(city: string, language?: string): Promise<WeatherResponse>
✓ webSearch(query: string, language?: string): Promise<WebSearchResponse>
✓ getPerformanceHistory(limit?: number): Promise<PerformanceHistoryResponse>
✓ getPersonalities(): Promise<PersonalitiesListResponse>
✓ setPersonality(personalityId: string): Promise<SetPersonalityResponse>
✓ getCommandInsights(days?: number): Promise<CommandInsightsResponse>
✓ getRunningProcesses(): Promise<ProcessListResponse>
✓ getNetworkScan(): Promise<NetworkScanResponse>
✓ quarantineProcess(pid: number, action: 'suspend'|'resume'|'terminate'): Promise<QuarantineResponse>
✓ shutdownComputer(confirmed?: boolean, language?: string): Promise<BaseResponse>
✓ restartComputer(confirmed?: boolean, language?: string): Promise<BaseResponse>
✓ sleepComputer(confirmed?: boolean, language?: string): Promise<BaseResponse>
✓ volumeUp(amount?: number, language?: string): Promise<VolumeResponse>
✓ volumeDown(amount?: number, language?: string): Promise<VolumeResponse>
✓ toggleMute(language?: string): Promise<BaseResponse>
```

#### Windows & Apps
```typescript
✓ getWindows(): Promise<WindowListResponse>
✓ getApps(): Promise<AppListResponse>
✓ openApp(appName: string): Promise<BaseResponse>
✓ closeApp(appName: string, confirmed?: boolean): Promise<BaseResponse>
✓ minimizeWindow(title?: string): Promise<BaseResponse>
✓ maximizeWindow(title?: string): Promise<BaseResponse>
✓ restoreWindow(title?: string): Promise<BaseResponse>
✓ activateWindow(title: string): Promise<BaseResponse>
```

#### Files
```typescript
✓ listFiles(folder: string, pattern?: string): Promise<FileListResponse>
✓ searchFiles(search: string, folder?: string): Promise<FileListResponse>
✓ openFolder(folder: string): Promise<BaseResponse>
✓ createFolder(name: string, parent: string): Promise<BaseResponse>
✓ deleteFile(path: string, confirmed?: boolean): Promise<BaseResponse>
✓ copyFile(source: string, destination: string): Promise<BaseResponse>
✓ moveFile(source: string, destination: string): Promise<BaseResponse>
✓ renameFile(oldPath: string, newName: string): Promise<BaseResponse>
✓ getFileInfo(path: string): Promise<FileInfoResponse>
```

#### Desktop
```typescript
✓ takeScreenshot(save?: boolean, language?: string): Promise<ScreenshotResponse>
✓ takeRegionScreenshot(x1, y1, x2, y2): Promise<ScreenshotResponse>
✓ readClipboard(): Promise<ClipboardTextResponse>
✓ setClipboard(text: string): Promise<BaseResponse>
✓ clearClipboard(): Promise<BaseResponse>
✓ mediaPlayPause(): Promise<BaseResponse>
✓ mediaNext(): Promise<BaseResponse>
✓ mediaPrevious(): Promise<BaseResponse>
✓ mediaStop(): Promise<BaseResponse>
✓ changeWallpaper(path: string): Promise<BaseResponse>
✓ zoomScreen(level: number): Promise<BaseResponse>
```

#### Input Control
```typescript
✓ getCursorPosition(): Promise<CursorResponse>
✓ moveCursor(x: number, y: number): Promise<BaseResponse>
✓ mouseClick(button: 'left'|'right'|'middle'): Promise<BaseResponse>
✓ doubleClick(): Promise<BaseResponse>
✓ rightClick(): Promise<BaseResponse>
✓ typeText(text: string): Promise<BaseResponse>
✓ pressKey(key: string): Promise<BaseResponse>
✓ scrollWheel(clicks: number): Promise<BaseResponse>
✓ dragMouse(x: number, y: number): Promise<BaseResponse>
✓ sendShortcut(keys: string[]): Promise<BaseResponse>
```

#### Memory
```typescript
✓ getConversations(limit?: number, session_id?: string): Promise<ConversationListResponse>
✓ saveConversation(convData: Partial<ConversationEntry>): Promise<BaseResponse>
✓ getMemoryStats(days?: number): Promise<MemoryStatsResponse>
✓ clearConversationHistory(): Promise<BaseResponse>
✓ getMemoryFacts(category?: string): Promise<FactListResponse>
✓ createMemoryFact(key: string, value: string, category?: string): Promise<BaseResponse>
✓ updateMemoryFact(factId: number, value: string): Promise<BaseResponse>
✓ deleteMemoryFact(factId: number): Promise<BaseResponse>
✓ getMemoryNodes(): Promise<MemoryNodeListResponse>
✓ getMemoryNodeContent(name: string): Promise<MemoryNodeResponse>
✓ updateMemoryNode(name: string, content: string): Promise<BaseResponse>
```

#### Automation
```typescript
✓ getAutomationStatus(): Promise<AutomationStatusResponse>
✓ getTasks(): Promise<TaskListResponse>
✓ createTask(task: Partial<AutomationTask>): Promise<BaseResponse>
✓ toggleTask(taskId: string): Promise<BaseResponse>
✓ deleteTask(taskId: string): Promise<BaseResponse>
✓ getMacros(): Promise<MacroListResponse>
✓ createMacro(macro: Partial<AutomationMacro>): Promise<BaseResponse>
✓ runMacro(macroId: string): Promise<BaseResponse>
// MISSING: toggleMacro
  async toggleMacro(macroId: string): Promise<BaseResponse>
```

#### WhatsApp
```typescript
✓ openWhatsApp(): Promise<BaseResponse>
✓ getWhatsAppStatus(): Promise<BaseResponse>
✓ sendWhatsAppMessage(contact: string, message: string, language?: string): Promise<BaseResponse>
✓ callContact(contact: string, video?: boolean): Promise<BaseResponse>
✓ getWhatsAppContacts(): Promise<WhatsAppContactListResponse>
✓ draftWhatsAppReply(language?: string): Promise<WhatsAppDraftResponse>
```

#### Settings
```typescript
✓ getSettings(): Promise<SettingsResponse>
✓ updateSettings(settings: Partial<JarvisSettings>): Promise<SettingsResponse>
✓ getApiKeyStatus(): Promise<ApiKeyStatusResponse>
✓ updateApiKeys(keys: ApiKeyUpdatePayload): Promise<BaseResponse>
✓ testApiKey(provider: string, apiKey: string): Promise<BaseResponse>
```

#### Notifications
```typescript
✓ broadcastNotification(title: string, message: string, type?: string, duration?: number): Promise<NotificationResponse>
```

#### Sync & Pairing
```typescript
✓ getPairingCode(): Promise<{ success: boolean; code: string; expires_in: number }>
✓ pairDevice(payload: PairDevicePayload): Promise<DevicePairingResponse>
✓ getPairedDevices(): Promise<PairedDevicesResponse>
✓ unpairDevice(deviceId: string): Promise<BaseResponse>
✓ getSyncStatus(): Promise<SyncStatusResponse>
```

#### Context
```typescript
✓ getSuggestion(language?: string): Promise<SuggestionResponse>
✓ getQuickActions(): Promise<QuickActionListResponse>
✓ updateQuickActions(actions: QuickAction[]): Promise<BaseResponse>
```

### 4.3 Media/OCR/Image/PDF Tools (missing from apiClient — must be added)

```typescript
  // --- ADD THESE ---
  async ocrImage(imagePath: string, language?: string): Promise<OCRResultResponse>
  async ocrPdf(pdfPath: string, pageNumber?: number): Promise<OCRResultResponse>
  async ocrScreen(language?: string): Promise<OCRResultResponse>
  
  async convertImage(imagePath: string, targetFormat: string, outputPath?: string): Promise<BaseResponse>
  async resizeImage(imagePath: string, width: number, height: number, outputPath?: string): Promise<BaseResponse>
  async compressImage(imagePath: string, quality?: number, outputPath?: string): Promise<BaseResponse>
  
  async mergePdfs(files: string[], output: string): Promise<BaseResponse>
  async splitPdf(pdfPath: string, pages: number[], output: string): Promise<BaseResponse>
  async pdfToImages(pdfPath: string, outputFolder: string, dpi?: number): Promise<BaseResponse>
  async imagesToPdf(images: string[], output: string): Promise<BaseResponse>
```

---

## 5. WebSocket Integration

### 5.1 Connection Architecture

```
┌──────────────────────┐     ┌──────────────────────┐
│   Main WebSocket     │     │   Audio WebSocket     │
│   ws://host:8000/ws  │     │   ws://host:8000/    │
│                      │     │   api/v1/audio/ws/   │
│                      │     │   audio               │
├──────────────────────┤     ├──────────────────────┤
│ Lifecycle:           │     │ Lifecycle:            │
│ - Auto-connect on    │     │ - Connect on demand   │
│   app mount          │     │ - Disconnect when not │
│ - Exponential backoff│     │   in use               │
│   reconnect          │     │ - No auto-reconnect   │
│ - Ping every 30s     │     │ - Ping supported      │
│ - Max 10 attempts    │     │                       │
├──────────────────────┤     ├──────────────────────┤
│ Message types IN:    │     │ Message types IN:     │
│ - system_status (5s) │     │ - stt_result          │
│ - command_result     │     │ - tts_audio           │
│ - notification       │     │ - tts_chunk           │
│ - confirmation_req   │     │ - tts_end             │
│ - proactive_suggest  │     │ - tts_error           │
│ - wake_detected      │     │ - pong                │
│ - pong               │     │ - error               │
│ - agent_thinking     │     │                       │
│ - agent_resolved     │     │ Message types OUT:    │
│ - neural_log         │     │ - stt (base64 audio)  │
│                      │     │ - tts (text)          │
│ Message types OUT:   │     │ - tts_stream (text)   │
│ - command            │     │ - ping                │
│ - confirmation       │     │                       │
│ - ping               │     │ Uses:                 │
│ - get_status         │     │ - Web Speech API STT  │
│                      │     │ - TTS playback via    │
│ Uses:                │     │   HTMLAudioElement    │
│ - Command execution  │     │                       │
│ - Status monitoring  │     │                       │
│ - Notifications      │     │                       │
└──────────────────────┘     └──────────────────────┘
```

### 5.2 Main WebSocket Service (`src/services/websocketService.ts`)

To be built. Must implement these refinements:

- **Exponential backoff**: Replace fixed 3s interval with `min(1000 * 2^attempt, 30000)` capped at 30s
- **Message routing**: Add typed dispatch to different store slices based on `message.type`
- **Broadcast handling**: The `system_status` broadcast arrives every 5s — update Zustand directly
- **Wake detection handler**: When `wake_detected` received, toggle listening mode + play blip

### 5.3 Audio WebSocket (`src/hooks/useAudioWS.ts`)

To be built. Must implement these production refinements:

- **Reconnection**: Add exponential backoff for audio WS (capped at 3 attempts)
- **Auto-disconnect**: Disconnect after 30s of inactivity to save resources
- **Error recovery**: On connection drop mid-speak, cancel any pending promises

### 5.4 SSE Stream (`src/hooks/useAgentStream.ts`)

To be built. Must implement these refinements:

- **Stream timeout**: If no data received for 30s, abort stream and show "Response timeout"
- **Partial response handling**: Backend sends `partial_done` type on errors — UI must display partial text with "⚠️ Response truncated" badge

### 5.5 Broadcast Message Router

The frontend needs a centralized broadcast handler that routes WebSocket messages:

```typescript
// src/services/broadcastRouter.ts
type BroadcastHandler = (message: WebSocketMessage) => void;

class BroadcastRouter {
  private handlers: Map<string, BroadcastHandler[]> = new Map();
  
  on(type: string, handler: BroadcastHandler): void
  off(type: string, handler: BroadcastHandler): void
  route(message: WebSocketMessage): void
}

// Registered handlers:
// 'system_status'     → useJarvisStore.setSystemStatus()
// 'command_result'    → useJarvisStore.setLastResponse()
// 'notification'      → addNotification() from context
// 'confirmation_request' → useJarvisStore.setPendingConfirmation()
// 'wake_detected'     → playback wake sound, activate listening
// 'proactive_suggestion' → useJarvisStore.setCurrentSuggestion()
```

---

## 6. State Management

### 6.1 Store Architecture (Zustand)

The frontend needs a Zustand state management layer. Formerly a single monolithic `useJarvisStore`; recommend splitting into slices for maintainability:

```typescript
// src/store/index.ts
export { useJarvisStore } from './jarvisStore'; // Keep existing for backward compat
export { useSystemStore } from './slices/systemSlice';
export { useConnectionStore } from './slices/connectionSlice';
export { useUIStore } from './slices/uiSlice';
export { useCommandStore } from './slices/commandSlice';
export { useMemoryStore } from './slices/memorySlice';
export { useAudioStore } from './slices/audioSlice';
export { useSettingsStore } from './slices/settingsSlice';
```

#### Slice 1: Connection Store
```typescript
interface ConnectionState {
  isConnected: boolean;
  connectionStatus: ConnectionStatus; // 'connected' | 'disconnected' | 'connecting'
  reconnectAttempts: number;
  audioWSConnected: boolean;
}
// Persisted: nothing
```

#### Slice 2: System Store
```typescript
interface SystemState {
  systemStatus: SystemStatus | null;
  performanceHistory: PerformancePoint[];
  eventLoopLag: number;
  cpuPercent: number;
  memoryPercent: number;
  batteryPercent: number | null;
  isCharging: boolean | null;
  volume: number;
}
// Persisted: volume
```

#### Slice 3: Command Store
```typescript
interface CommandState {
  history: CommandResult[];       // max 50 entries
  transcript: string;
  lastResponse: CommandResponse | null;
  pendingConfirmation: ConfirmationRequest | null;
  currentSuggestion: string | null;
  mode: AppMode;                  // IDLE | LISTENING | PROCESSING | SPEAKING
}
// Persisted: history (last 50), mode
```

#### Slice 4: Agent Store
```typescript
interface AgentState {
  agentStreaming: boolean;
  agentStreamResponse: string;
  agentProvider: string | null;
  isAgentThinking: boolean;
  agentThought: string | null;
  audioTranscript: string | null;
}
// Persisted: nothing (ephemeral)
```

#### Slice 5: UI Store
```typescript
interface UIState {
  language: Language;
  activeTacticalView: ViewType;  // Deprecated — navigation uses React Router; kept for backward compat
  theme: 'dark' | 'light' | 'cyber';
  showSettings: boolean;
  showMemory: boolean;
  showAutomation: boolean;
  showAdvanced: boolean;
  showPermission: boolean;
  showFileBrowser: boolean;
  showWindowManager: boolean;
  showPersonality: boolean;
  showWhatsApp: boolean;
  showDeviceSync: boolean;
  showInputSimulator: boolean;
  showMediaTools: boolean;
  showSystemControls: boolean;
  showPerformanceMonitor: boolean;
  neuralLogs: NeuralLogEntry[];
}
// Persisted: language, theme
```

#### Slice 6: Settings Store
```typescript
interface SettingsState {
  settings: JarvisSettings | null;
  llmProvider: string;
  wakeWordEnabled: boolean;
  dangerousCommandsEnabled: boolean;
}
// Persisted: nothing (fetched fresh)
```

#### Slice 7: Vision Store
```typescript
interface VisionState {
  visionData: { isOpen: boolean; content: string; metadata?: Record<string, unknown> };
}
// Persisted: nothing
```

### 6.2 Persistence Strategy

```typescript
// Persisted keys in localStorage (via Zustand persist middleware):
// - 'jarvis-storage': { language, volume, history (last 50), theme, mode }
// - Clear on logout: nothing (all ephemeral or fetched from backend)
```

### 6.3 TanStack Query Cache

```typescript
// src/lib/react-query.ts
export const queryKeys = {
  systemMetrics: () => ['system', 'metrics'] as const,
  systemMetricsHistory: (limit: number) => ['system', 'metrics', 'history', limit] as const,
  conversations: (limit: number) => ['memory', 'conversations', limit] as const,
  memoryStats: (days: number) => ['memory', 'stats', days] as const,
  memoryFacts: (category?: string) => ['memory', 'facts', category] as const,
  memoryNodes: () => ['memory', 'nodes'] as const,
  automationStatus: () => ['automation', 'status'] as const,
  tasks: () => ['automation', 'tasks'] as const,
  macros: () => ['automation', 'macros'] as const,
  settings: () => ['settings'] as const,
  apiKeyStatus: () => ['settings', 'keys'] as const,
  whatsappStatus: () => ['whatsapp', 'status'] as const,
  whatsappContacts: () => ['whatsapp', 'contacts'] as const,
  windows: () => ['windows'] as const,
  apps: () => ['apps'] as const,
  files: (folder: string, pattern?: string) => ['files', folder, pattern] as const,
  processes: () => ['security', 'processes'] as const,
  networkConnections: () => ['security', 'connections'] as const,
  pairedDevices: () => ['sync', 'devices'] as const,
  syncStatus: () => ['sync', 'status'] as const,
  suggestion: (language: string) => ['context', 'suggestion', language] as const,
  quickActions: () => ['context', 'quick-actions'] as const,
  health: () => ['health'] as const,
  agentHealth: () => ['agent', 'health'] as const,
  personalities: () => ['personalities'] as const,
  commandInsights: (days: number) => ['commandInsights', days] as const,
};
```

---

## 7. Type Definitions

### 7.1 Complete Backend Models → TypeScript Interface Mapping

All interface files were removed with the frontend deletion. Recreate `src/types/api.ts` and `src/types/bridge.ts` with the following types — here is the **complete inventory** including previously missing ones:

```typescript
// src/types/api.ts — ADD THESE MISSING TYPES

// ---- Audio WS types ----
export interface AudioWSIncoming {
  type: 'stt_result' | 'tts_audio' | 'tts_chunk' | 'tts_end' | 'tts_error' | 'error' | 'pong';
  text?: string;
  audio?: string;  // base64
  format?: 'opus' | 'webm' | 'mp3';
  error?: string;
}

export interface AudioWSOutgoing {
  type: 'stt' | 'tts' | 'tts_stream' | 'ping';
  audio?: string;  // base64
  text?: string;
  voice?: string;
  language?: string;
}

// ---- SSE Event types (align with backend) ----
export type SSEEvent = 
  | { type: 'meta'; provider: string; language: string }
  | { type: 'chunk'; text: string }
  | { type: 'done'; full_text: string }
  | { type: 'partial_done'; full_text: string; truncated: boolean }
  | { type: 'error'; error: string };

// ---- OCR Result ----
export interface OCRResultResponse {
  success: boolean;
  text: string | null;
  confidence: number;
  detected_language: string | null;
  extraction_type: string;
  response: string;
}

// ---- Proactive Suggestion (WS broadcast) ----
export interface ProactiveSuggestionEvent {
  suggestion: string;
  topic: string;
  mood: string;
  timestamp: string;
}

// ---- Wake Detected Event ----
export interface WakeDetectedEvent {
  model: string;
  score: number;
}

// ---- Confirmation Request (WS broadcast) ----
export interface PendingConfirmationInfo {
  confirmation_id: string;
  command_key: string;
  command_text: string;
  language: string;
  response: string;
  timeout: number;
  created_at: string;
}

// ---- Macro step (backend shape) ----
export interface MacroStepBackend {
  command: string;
  delay: number;
  parameters?: Record<string, unknown>;
}
```

---

## 8. Hook Specifications

### 8.1 Hooks Inventory (Target Architecture)

> All hooks listed below were removed with the frontend deletion. Each must be rebuilt from scratch per the specifications in this document.

| Hook | File | Status | Purpose |
|---|---|---|---|
| `useTheme` | `hooks/useTheme.ts` | 🏗️ To be built | Theme management |
| `useJarvisSync` | `hooks/useJarvisSync.ts` | 🏗️ To be built | Sync lastResponse to store/side effects |
| `useKeyboardShortcut` | `hooks/useKeyboardShortcut.ts` | 🏗️ To be built | Global keyboard shortcuts |
| `useVoiceController` | `hooks/useVoiceController.ts` | 🏗️ To be built | Voice service lifecycle |
| `useAudioWS` | `hooks/useAudioWS.ts` | 🏗️ To be built | Audio WebSocket (STT/TTS) |
| `useAgentStream` | `hooks/useAgentStream.ts` | 🏗️ To be built | SSE LLM streaming |
| `useSystemQuery` | `hooks/useSystemQuery.ts` | 🏗️ To be built | All TanStack Query hooks (~80 hooks) |
| `useJarvisBridge` | `hooks/useJarvisBridge.ts` | 🏗️ To be built | WebSocket message routing |

### 8.2 Additional Hooks Required

```typescript
// --- Hook: useWebSocket
// File: src/hooks/useWebSocket.ts
function useWebSocket(): {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  sendCommand: (command: string, language?: string) => void;
  requestStatus: () => void;
  sendConfirmation: (confirmationId: string, approved: boolean) => void;
};
// Wraps websocketService, provides reactive state
// Auto-connects on mount, disconnects on unmount

// --- Hook: useCommand
// File: src/hooks/useCommand.ts
function useCommand(): {
  execute: (command: string, language?: string) => Promise<CommandResult>;
  confirmAction: (confirmationId: string, approved: boolean) => Promise<void>;
  cancelStream: () => void;
  isExecuting: boolean;
  pendingConfirmations: PendingConfirmationInfo[];
  lastResult: CommandResult | null;
  // Combines REST + WS command execution with loading state
  // Tries WS first, falls back to REST
};

// --- Hook: useBroadcastRouter
// File: src/hooks/useBroadcastRouter.ts
function useBroadcastRouter(): void;
// Sets up message handlers on mount, tears down on unmount
// Routes system_status → systemStore
// Routes notification → toast
// Routes confirmation_request → commandStore
// Routes wake_detected → audio activation
// Routes proactive_suggestion → suggestion display

// --- Hook: useSystemMetrics
// File: src/hooks/useSystemMetrics.ts
function useSystemMetrics(): {
  cpu: number;
  memory: number;
  disk: number;
  battery: number | null;
  isCharging: boolean | null;
  eventLoopLag: number;
  volume: number;
  activeWindow: ActiveWindowInfo | null;
  personality: PersonalityInfo | null;
};
// Lightweight selector hook into systemStore
// Components re-render only on changed metrics

// --- Hook: useVoiceCommands
// File: src/hooks/useVoiceCommands.ts
function useVoiceCommands(): {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, lang?: string) => Promise<void>;
  isSpeaking: boolean;
  interimTranscript: string;
  finalTranscript: string;
};
// High-level voice integration hook
// Combines voiceService + useAudioWS with fallback logic

// --- Hook: useStreamingLLM
// File: src/hooks/useStreamingLLM.ts
function useStreamingLLM(): {
  stream: (query: string, options?: AgentStreamOptions) => Promise<void>;
  cancel: () => void;
  reset: () => void;
  isStreaming: boolean;
  response: string;
  provider: string | null;
  error: string | null;
};
// Wraps SSE streaming with agent health pre-check
// Automatically sets agentProvider in store

// --- Hook: useOnlineStatus
// File: src/hooks/useOnlineStatus.ts
function useOnlineStatus(): {
  isOnline: boolean;
  lastOnline: Date | null;
};
// Monitors navigator.onLine + backend health endpoint
// Shows "Backend offline" banner when disconnected
```

---

## 9. Real-Time Data Flow

### 9.1 System Status Flow (5-second broadcast)

```
Backend (every 5s)                   Frontend
┌─────────────────┐                 ┌───────────────────────┐
│ system_module    │                 │ WebSocket Service     │
│ .get_system_     │───WS msg──────▶│ .onmessage →          │
│ status()         │   {type:       │ BroadcastRouter       │
└─────────────────┘   "system_      │ .route(message)       │
                      status",      └───────────┬───────────┘
                      data: {...}}              │
                                                ▼
                                     ┌───────────────────────┐
                                     │ systemStatusChanged   │
                                     │ → systemStore         │
                                     │ → re-render gauges    │
                                     └───────────────────────┘
                                                │
                                     ┌──────────▼───────────┐
                                     │ SystemMetricsWidget  │
                                     │ ArcReactor           │
                                     │ Header (connection)  │
                                     └──────────────────────┘
```

### 9.2 Command Execution Flow

```
User speaks/types     ┌──────────────┐     ┌────────────────┐
    command ─────────▶│ VoiceService │────▶│ CommandInput    │
                      │ (STT)        │     │ (text submit)  │
                      └──────────────┘     └───────┬────────┘
                                                   ▼
                                          ┌────────────────┐
                                          │ useCommand      │
                                          │ .execute()     │
                                          └───────┬────────┘
                                                  │
                          ┌───────────────────────┼───────────────┐
                          ▼                       ▼               ▼
                   ┌─────────────┐       ┌──────────────┐  ┌──────────┐
                   │ WS (primary)│       │ REST (fallb) │  │ SSE      │
                   │ sendCommand │       │ POST /command│  │ /stream  │
                   └──────┬──────┘       └──────┬───────┘  └────┬─────┘
                          │                     │               │
                          ▼                     ▼               ▼
                   ┌──────────────┐     ┌────────────────┐  ┌─────────┐
                   │ WS response  │     │ CommandResult  │  │ Chunks  │
                   │ type:"command│     │ JSON response  │  │ SSE     │
                   │ _result"     │     └───────┬────────┘  │ events  │
                   └──────┬───────┘             │           └────┬────┘
                          │                     │               │
                          └──────────┬──────────┘───────────────┘
                                     ▼
                          ┌──────────────────────┐
                          │ useJarvisSync        │
                          │ → addToHistory()     │
                          │ → setLastResponse()  │
                          │ → setMode(SPEAKING)  │
                          └──────────────────────┘
                                     │
                          ┌──────────▼───────────┐
                          │ voiceService.speak() │
                          │ OR useAudioWS.speak()│
                          └──────────────────────┘
```

### 9.3 Audio Streaming Flow (STT → TTS)

```
Browser Microphone          Audio WS                  Backend
┌──────────────┐           ┌────────────┐          ┌──────────┐
│ getUserMedia │───audio──▶│ WS send    │──base64──▶│ STT      │
│ → base64     │           │ {type:"stt"│          │ transcribe│
└──────────────┘           │ audio:...} │          └────┬─────┘
                           └────────────┘               │
                                                         ▼
                           ┌────────────┐          ┌──────────┐
                           │ WS receive │◀──text────│ Result   │
                           │ {type:"stt │          └──────────┘
                           │ _result",  │
                           │ text:"..."}│
                           └──────┬─────┘
                                  │
                     ┌────────────▼────────────┐
                     │ useAudioWS.onmessage     │
                     │ → setTranscript(text)     │
                     │ → auto-execute command    │
                     └──────────────────────────┘
                                  │ (if response)
                                  ▼
                           ┌────────────┐          ┌──────────┐
                           │ WS send    │──text────▶│ TTS      │
                           │ {type:"tts"│          │ synthesize│
                           │ text:...}  │          └────┬─────┘
                           └────────────┘               │
                                                         ▼
                           ┌────────────┐          ┌──────────┐
                           │ WS receive │◀──opus───│ Audio    │
                           │ {type:"tts │          └──────────┘
                           │ _audio",   │
                           │ audio:b64} │
                           └──────┬─────┘
                                  │
                     ┌────────────▼────────────┐
                     │ playAudioBlob(Blob)      │
                     │ → HTMLAudioElement.play()│
                     └─────────────────────────┘
```

### 9.4 SSE Streaming LLM Flow

```
User types query          POST /agent/stream          Backend
┌──────────────┐         ┌──────────────────┐       ┌──────────┐
│ CommandInput  │──query─▶│ useAgentStream   │──────▶│ llm_     │
│ (text submit) │         │ .stream(query)   │       │ gateway  │
└──────────────┘         └────────┬─────────┘       │ .generate│
                                  │                   │ _stream()│
                                  │                   └────┬─────┘
                                  │                        │
                                  ▼                        ▼
                           ┌──────────────────┐       ┌──────────┐
                           │ ReadableStream   │◀──────│ SSE      │
                           │ .getReader()     │       │ events   │
                           └────────┬─────────┘       └──────────┘
                                    │
                     ┌──────────────┼──────────────┐
                     ▼              ▼              ▼
              {type:"meta"}  {type:"chunk"}  {type:"done"}
              → setProvider  → appendResponse → setStreaming(false)
```

---

## 10. Error Handling Strategy

### 10.1 API Error Response Format

Backend returns consistent error shapes:

```typescript
// Standard error (400, 403, 404, 500)
{
  "success": false,
  "error": "Descriptive error message",
  "detail": "Detailed error info"  // sometimes present
}

// Rate limit (429)
{
  "error": "Rate limit exceeded (200 per minute)",
  "detail": null
}

// Auth failure (403)
{
  "success": false,
  "detail": "Invalid or missing API Key"
}

// HTTP 500 (caught by global handler)
{
  "success": false,
  "error": "An internal server error occurred",
  "request_id": "uuid",
  "timestamp": "ISO8601"
}
```

### 10.2 Error Handling Matrix

| Error Type | HTTP Status | Frontend Action | User Message |
|---|---|---|---|
| Missing API Key | 403 | Show "Configure API Key" in Settings | "⚠️ Backend authentication required. Set your API key in Settings." |
| Invalid API Key | 403 | Redirect to Settings | "🔑 Invalid API key. Please update in Settings." |
| Rate Limited | 429 | Disable button, show countdown | "⏳ Rate limit reached. Try again in X seconds." |
| Validation Error | 422 | Show field-level errors | "❌ [field]: [validation message]" |
| Backend Offline | 0 (network) | Show offline banner, disable features | "🔴 Backend offline. Retrying..." |
| Command Not Found | 400 | Show error in chat | "🤖 Command not recognized." |
| Confirmation Required | 200 (+requires_confirmation) | Show ConfirmationModal | "⚠️ Dangerous action. Confirm?" |
| WS Disconnected | N/A | Show reconnecting badge | "🔄 Reconnecting..." |
| Stream Timeout | N/A | Abort stream, show partial | "⏱️ Response timed out. Showing partial result." |
| Internal Server Error | 500 | Log request_id, show generic | "💥 Something went wrong. Error ID: [request_id]" |
| Not Found (file, device) | 404 | Show red toast | "❌ [resource] not found." |

### 10.3 Retry Strategy

| Scenario | Retry Logic | Max Attempts |
|---|---|---|
| Backend health check | Linear, every 5s | Infinite (until connected) |
| WS connection | Exponential backoff: `min(1s × 2^n, 30s)` | 10 |
| API call (GET) | TanStack Query default: 3 retries | 3 |
| API call (POST/mutation) | No auto-retry (show error) | 0 |
| SSE stream | Manual retry via "Retry" button | User-initiated |

### 10.4 Error Boundary

The error boundary is a class component defined inline in `src/App.tsx`. It catches React render errors across the entire route tree and displays a **"SYSTEM MALFUNCTION"** screen with the error message and a "REBOOT" button.

```typescript
// src/App.tsx — Inline ErrorBoundary class component
// Catches:
// - React render errors → show "SYSTEM MALFUNCTION" fallback UI with error message + "REBOOT" button
// - Lazy load failures → caught by Suspense, not ErrorBoundary (Suspense shows Loader)
// - API client crashes → handled by individual page error states, not this boundary
```

---

## 11. Auth Flows

### 11.1 Auth Strategy

- **Backend**: X-API-Key header for REST, `api_key` query param for WS
- **Localhost exemption**: If client is `127.0.0.1`, `localhost`, or `::1`, API key is bypassed
- **Device Auth**: Paired devices pass `device_id` + `token` as WS query params
- **No session cookies**, no OAuth, no JWT — simple key-based auth

### 11.2 API Key Configuration Flow

```
1. App mounts → GET /api/v1/health → 403?
   └─ Yes → Show "Backend locked" banner with link to Settings
           → User pastes API key from .env or admin
           → Save to VITE_JARVIS_API_KEY (cannot be changed via UI safely)
           → Reload app

2. For remote users:
   → Ensure VITE_JARVIS_API_KEY is set in .env
   → Build sends it as import.meta.env.VITE_JARVIS_API_KEY
   → apiClient automatically includes it in X-API-Key header
```

### 11.3 Device Pairing Flow

```
1. User opens DeviceSyncHub → clicks "Generate Code"
   → POST /sync/pairing-code → 6-char code displayed + QR
   → Code expires in 300 seconds

2. On mobile device:
   → User enters code + device name
   → POST /sync/pair with { pairing_code, device_name, device_type }
   → Backend returns { device_id, access_token }

3. Mobile device stores access_token
   → Future WS connections pass ?device_id=...&token=...
   → Future telemetry POST /sync/telemetry with device_id + access_token
```

### 11.4 Session Persistence

- No login/logout in traditional sense
- API key is baked into the build via `VITE_JARVIS_API_KEY`
- For runtime changes, user must reload the app after updating the `.env` file
- The `test-key` endpoint allows validating a key without saving

---

## 12. UI/UX Requirements from Backend Logic

### 12.1 Client-Side Validation Rules

| Field | Backend Rule | Frontend Validation | Error Message |
|---|---|---|---|
| `command` | Required, 1-500 chars, trimmed | Required, min 1 char, max 500, trim on blur | "Command must be 1-500 characters" |
| `query` (agent) | Required, 1-2000 chars | Required, min 1, max 2000 | "Query must be 1-2000 characters" |
| `language` | Pattern: `^(en\|hi\|hinglish)$` | Select dropdown only (pre-validated) | N/A |
| `confirmation_timeout` | Optional, int | Number input, 5-120 range | "Timeout must be 5-120 seconds" |
| `quality` (image) | Default 85, int | Slider 1-100 | N/A |
| `dpi` (PDF) | Default 200, int | Number input, 72-600 | "DPI must be 72-600" |
| `pairing_code` | Required | Required, 6 chars alphanumeric | "Enter a valid 6-character code" |
| `device_name` | Required | Required, 1-100 chars | "Device name is required" |
| `volume/amount` | Optional, int 0-100 | Number input or slider 0-100 | "Volume must be 0-100" |
| `limit` (paginated) | ge=1, le=1440 | Clamp 1-1440 in URL params | N/A (silently clamp) |
| `audio base64` | Max 10MB | Client-side size check before send | "Audio too large (max 10MB)" |
| `text` (TTS) | Max 2000 chars | Textarea max 2000, character counter | "Text must be under 2000 characters" |

### 12.2 Conditional UI Rules

| Condition | UI Behavior |
|---|---|
| `command_result.requires_confirmation === true` | Show `ConfirmationModal` with timeout countdown (30s default) |
| `system_status.battery.is_charging === false && percent < 20` | Show amber battery badge + "Low battery" notification |
| `system_status.event_loop_lag > 100` | Show yellow "Lag detected" indicator in header |
| `connectionStatus === 'disconnected'` | Disable command input, show offline banner, hide voice button |
| `connectionStatus === 'connecting'` | Show pulsing "Connecting..." badge |
| `settings.wake_word_enabled === true` | Show microphone icon in header with pulse animation |
| `settings.enable_dangerous_commands === false` | Hide/disable shutdown, restart, delete, terminate buttons |
| `agentStreaming === true` | Show streaming cursor animation in response area |
| `pendingConfirmation !== null` | Lock command input until confirmed or timeout |
| `appMode === LISTENING` | Arc Reactor pulses blue, microphone glows |
| `appMode === PROCESSING` | Arc Reactor spins yellow |
| `appMode === SPEAKING` | Arc Reactor pulses green |
| `whatsapp_status.desktop_installed === false` | Show "WhatsApp Desktop not installed" message |
| `automation_status.scheduler_running === false` | Show amber "Scheduler offline" badge |
| `paired_devices_count === 0` | Show "No devices paired. Generate code to pair." |
| `performanceHistory.length === 0` | Show "No performance data yet" |
| `user has never set personality` | Highlight personality selection as onboarding step |

### 12.3 Dangerous Action Confirmation Protocol

When an action requires `confirmed=true` or shows `requires_confirmation`:

```
1. User clicks dangerous action (shutdown/delete/terminate)
2. If backend returns { requires_confirmation: true, confirmation_id: "abc" }:
   → Show ConfirmationModal with action description + 30s countdown
   → POST /confirm/{confirmation_id} with { approved: true/false }
   → On timeout (30s), auto-cancel
3. If confirmed flag needed:
   → Show ConfirmModal: "Are you sure?"
   → On confirm, POST with ?confirmed=true
```

### 12.4 File Upload Constraints

No traditional file upload endpoints exist — all file operations use **file paths on the server filesystem**. The frontend provides path text inputs, not file pickers. This is a desktop automation system, not a web file upload service.

### 12.5 Responsive Behavior

| Breakpoint | Layout |
|---|---|
| `≥1280px` (desktop) | Full sidebar nav + content, multi-column layouts |
| `768-1279px` (tablet) | Collapsed sidebar icons, single column |
| `<768px` (mobile) | Bottom nav bar, HUD as primary view, modals full-screen |

### 12.6 Micro-Interactions (Design System V3)

From `index.css` — all interactive elements must have:
- `hover`: scale(1.02) + glow effect
- `active`: scale(0.98)
- `focus-visible`: neon outline ring
- `transition`: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)
- `title` and `aria-label` on all buttons

---

## 13. Feature Priority Matrix

| Priority | Feature | Backend Dep | Frontend Dep | Est. Effort |
|---|---|---|---|---|
| **P0** | Neural HUD (main dashboard with system status) | `GET /system/status`, WS broadcasts | WebSocket service, systemStore | 3 days |
| **P0** | Command execution (text + voice) | `POST /command`, WS command | useCommand, voiceService | 3 days |
| **P0** | WebSocket connection + reconnection | `/ws` endpoint | websocketService, broadcastRouter | 2 days |
| **P0** | Settings page (provider, keys, personality) | `GET/POST /settings`, `/settings/keys` | SettingsModal, useSettings | 2 days |
| **P1** | Audio WS (STT + TTS) | `/api/v1/audio/ws/audio` | useAudioWS, playAudioBlob | 3 days |
| **P1** | SSE Streaming LLM | `POST /agent/stream` | useAgentStream | 2 days |
| **P1** | Command history + memory viewer | `GET /memory/conversations`, `/memory/facts` | AuditTimeline, useConversations | 2 days |
| **P1** | Automation dashboard (tasks + macros) | `GET/POST /automation/*` | AutomationDashboard, useTasks | 3 days |
| **P1** | Security dashboard (processes, connections) | `GET /system/security/*` | SecurityDashboard, useProcesses | 2 days |
| **P2** | File browser | `GET/POST /files/*` | FileBrowser, useFileList | 3 days |
| **P2** | Window manager | `GET/POST /windows/*, /apps/*` | WindowManager, useWindows | 2 days |
| **P2** | WhatsApp panel | `GET/POST /whatsapp/*` | WhatsAppPanel | 2 days |
| **P2** | Desktop controls (screenshot, clipboard, media) | `GET/POST /desktop/*` | DesktopControls | 2 days |
| **P2** | Input simulator (mouse, keyboard) | `GET/POST /input/*` | InputSimulator | 2 days |
| **P2** | Media tools (OCR, image, PDF) | `POST /media/*, /image/*, /pdf/*` | MediaToolsPanel | 3 days |
| **P2** | Device sync hub (pairing) | `GET/POST /sync/*` | DeviceSyncHub | 2 days |
| **P3** | Neural training (voice profiles) | `GET/PUT /neural/voice/profiles` | NeuralTraining | 2 days |
| **P3** | Performance charts + command insights | `GET /system/performance/history`, `/command-insights` | PerformanceMonitor | 2 days |
| **P3** | Proactive suggestions | `GET /context/suggestion`, WS broadcast | ProactiveSuggestionCard | 1 day |
| **P3** | Wait word detection visualization | WS `wake_detected` broadcast | ArcReactor pulse | 1 day |

---

## 14. Master Task List

> This is the development sprint plan. All tasks marked with file paths under `src/` must be **created from scratch** — no existing code remains. Estimated hours assume a single developer building from the specifications in this document.

### 🔴 P0 — Critical (Build First)

| # | Task | Type | Hours | Dependencies | Files |
|---|---|---|---|---|---|
| P0.1 | **Extend apiClient with all missing endpoints** (media/ocr/image/pdf tools) | API Layer | 4h | None | `src/services/apiClient.ts` |
| P0.2 | **Implement WebSocket broadcast router** | Service | 4h | None | `src/services/broadcastRouter.ts` |
| P0.3 | **Create systemStore slice** (extract from jarvisStore) | State | 3h | None | `src/store/slices/systemSlice.ts` |
| P0.4 | **Create commandStore slice** (extract from jarvisStore) | State | 3h | None | `src/store/slices/commandSlice.ts` |
| P0.5 | **Build NeuralHUD page** with all widgets | Page | 16h | P0.1, P0.2, P0.3 | `src/pages/NeuralHUD.tsx` |
| P0.6 | **Build CommandInput component** with voice button | Component | 6h | P0.1, P0.5 | `src/components/CommandInput.tsx` |
| P0.7 | **Build Settings page/modal** | Page | 8h | P0.1 | `src/pages/SettingsPage.tsx` |
| P0.8 | **WebSocket auto-reconnect with exponential backoff** | Service | 3h | P0.2 | `src/services/websocketService.ts` |
| P0.9 | **Error boundary + offline banner** | Component | 3h | P0.2 | `src/components/ErrorBoundary.tsx` |

### 🟡 P1 — High Priority

| # | Task | Type | Hours | Dependencies | Files |
|---|---|---|---|---|---|
| P1.1 | **UseAudioWS production hardening** (reconnect, timeout) | Hook | 4h | P0.2 | `src/hooks/useAudioWS.ts` |
| P1.2 | **Build ConfirmationModal** for dangerous actions | Component | 3h | None | `src/components/ConfirmationModal.tsx` |
| P1.3 | **Build AuditTimeline page** | Page | 8h | P0.1 | `src/pages/AuditTimeline.tsx` |
| P1.4 | **Build AutomationDashboard + AutomationEditor** | Pages | 12h | P0.1 | `src/pages/AutomationDashboard.tsx` |
| P1.5 | **Build SecurityDashboard** | Page | 8h | P0.1 | `src/pages/SecurityDashboard.tsx` |
| P1.6 | **Implement language toggle (EN/HI/HINGLISH)** | Feature | 3h | Context | `src/components/LanguageToggle.tsx` |
| P1.7 | **Add all missing type definitions** (SSE events, audio WS) | Types | 2h | None | `src/types/api.ts`, `src/types/bridge.ts` |
| P1.8 | **Implement queryKeys + TanStack Query hooks** | State | 4h | P0.1 | `src/lib/react-query.ts` |

### 🟢 P2 — Standard

| # | Task | Type | Hours | Dependencies | Files |
|---|---|---|---|---|---|
| P2.1 | **Build FileBrowser page** | Page | 12h | P0.1 | `src/pages/FileBrowser.tsx` |
| P2.2 | **Build WindowManager page** | Page | 8h | P0.1 | `src/pages/WindowManager.tsx` |
| P2.3 | **Build WhatsAppPanel** | Page | 8h | P0.1 | `src/pages/WhatsAppPanel.tsx` |
| P2.4 | **Build DesktopControls page** | Page | 8h | P0.1 | `src/pages/DesktopControls.tsx` |
| P2.5 | **Build InputSimulator page** | Page | 10h | P0.1 | `src/pages/InputSimulator.tsx` |
| P2.6 | **Build MediaToolsPanel page** | Page | 10h | P0.1 | `src/pages/MediaToolsPanel.tsx` |
| P2.7 | **Build DeviceSyncHub page** | Page | 6h | P0.1 | `src/pages/DeviceSyncHub.tsx` |
| P2.8 | **✓ Migrate to React Router v7 + lazy loading** | Architecture | 6h | All pages | `src/App.tsx`, `src/router.tsx` |

### ⚪ P3 — Nice to Have / Polish

| # | Task | Type | Hours | Dependencies | Files |
|---|---|---|---|---|---|
| P3.1 | **Build NeuralTraining page** | Page | 8h | P0.1 | `src/pages/NeuralTraining.tsx` |
| P3.2 | **Performance charts (recharts)** | Component | 6h | P0.1 | `src/components/PerformanceChart.tsx` |
| P3.3 | **Proactive suggestion card with animation** | Component | 3h | P0.2 | `src/components/ProactiveSuggestionCard.tsx` |
| P3.4 | **Wake word visualization** (Arc Reactor pulse) | Component | 4h | P0.2 | `src/components/ArcReactor.tsx` |
| P3.5 | **Keyboard shortcut cheat sheet (Ctrl+K)** | Component | 3h | P0.5 | `src/components/CommandPalette.tsx` |
| P3.6 | **Drag-and-drop file operations** | Feature | 6h | P2.1 | `src/components/FileBrowser.tsx` |
| P3.7 | **Dark mode / theme persistence** | Feature | 3h | P0.7 | `src/hooks/useTheme.ts` |

### Task Dependency Graph

```
P0.1 (API Layer) ─┬─ P0.2 (Broadcast Router) ── P0.8, P1.1, P1.6
                   ├─ P0.3 (systemStore) ──────── P0.5 (NeuralHUD)
                   ├─ P0.4 (commandStore) ──────── P0.6 (CommandInput)
                   ├─ P0.7 (Settings) ──────────── P3.7 (Theme)
                   ├─ P1.7 (Types) ─────────────── All Pages
                   └─ P1.8 (Query Hooks) ────────── P1.3, P1.4, P1.5, All P2
```

---

## 15. Frontend Complexity Report

### 15.1 Counts

| Area | Count |
|---|---|
| **Total Pages** | 14 (1 main dashboard + 12 feature pages + 1 about page) |
| **Total Components** | ~85 (26 layout/core + ~59 feature-specific) |
| **Total API Calls** | ~110 (all REST endpoints) |
| **Auth Flows** | 2 (API key config + device pairing) |
| **Forms** | 12 (settings, task create, macro create, API keys, device pair, WhatsApp send, etc.) |
| **Protected Routes** | 12 (all except neural HUD) |
| **Global State Slices** | 7 (connection, system, command, agent, UI, settings, vision) |
| **WebSocket Channels** | 2 (main + audio) |
| **SSE Streams** | 1 (agent streaming) |
| **Real-Time Broadcasts** | 5 (system_status, notification, wake_detected, proactive_suggestion, neural_log) |

### 15.2 Estimated Build Time

| Scenario | Time |
|---|---|
| Solo developer (full-time) | 8-10 weeks |
| Team of 2 (full-stack + frontend specialist) | 5-6 weeks |
| Team of 3 (sprints with parallelization) | 4-5 weeks |

### 15.3 Recommended Tech Stack

| Technology | Purpose | Rationale |
|---|---|---|
| **React 19 + TypeScript** | UI framework | Existing |
| **Vite** | Build tool | Existing |
| **Zustand** | State management | Existing, lightweight, TypeScript-native |
| **TanStack Query v5** | Server state + caching | Existing (70+ hooks auto-generated) |
| **React Router v7** | SPA routing | Standard, lazy loading, navigation, `<Outlet>` nested routes |
| **Framer Motion** | Animations | Existing, used for page transitions |
| **Recharts** | Charts (performance, insights) | Lightweight, React-native |
| **Vitest + Testing Library** | Testing | Existing configuration |
| **Web Speech API** | STT + TTS (browser-native) | Existing, no external dependency |
| **qrcode.react** | QR code for pairing codes | Recommended |

### 15.4 Top 5 Frontend Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **1. WebSocket broadcast flooding** — 5s system status updates + 1s event loop lag can cause re-render storms | UI jank, battery drain on mobile | Use `React.memo` on gauges, selector hooks with shallow equality, throttle non-critical updates |
| **2. Audio WS memory leaks** — TTS chunks accumulate in memory | Tab crash on long sessions | Limit streamChunksRef to 100 chunks, clear on disconnect |
| **3. Simultaneous WS + SSE + REST calls** — Race conditions on state (e.g., WebSocket `command_result` arrives before REST `POST /command` resolves) | Duplicate history entries, stale state | Use a command queue with deduplication by `session_id` + `timestamp` |
| **4. SSE stream interruption** — Backend may send partial data mid-stream | Incomplete response, confusing UI | Always display `partial_done` content with truncated badge; provide retry button |
| **5. Dangerous action without confirmation** — User could trigger shutdown/delete without modal | Accidental system damage | Always check `requires_confirmation` boolean; never auto-send `confirmed=true` |

---

## Appendix A: File Organization (Target)

> The following directory layout does not exist yet. It is the **target structure** for the frontend rebuild.

```
src/
├── App.tsx                    # Root component with router
├── main.tsx                   # Entry point
├── config.ts                  # URLs, ports, feature flags
├── constants.ts               # App constants
├── router.tsx                 # Stub — routing is inline in App.tsx (preserved for reference)
├── setupTests.ts              # Test setup
├── types/
│   ├── index.ts               # Re-exports + SpeechRecognition types
│   ├── api.ts                 # All API response types (~1000 lines)
│   ├── bridge.ts              # WS message types, connection types
│   └── theme.ts               # Theme types
├── store/
│   ├── jarvisStore.ts         # Combined store (expose for backward compat)
│   └── slices/
│       ├── connectionSlice.ts
│       ├── systemSlice.ts
│       ├── commandSlice.ts
│       ├── agentSlice.ts
│       ├── uiSlice.ts
│       ├── settingsSlice.ts
│       └── visionSlice.ts
├── services/
│   ├── apiClient.ts           # REST API client (~1100 lines)
│   ├── websocketService.ts    # Main WS service (~210 lines)
│   ├── broadcastRouter.ts     # WS message routing
│   ├── voiceService.ts        # Web Speech API wrapper (~250 lines)
│   ├── commandProcessor.ts    # Command parsing
│   └── securityService.ts     # Security dashboard helpers
├── hooks/
│   ├── useTheme.ts
│   ├── useSystemQuery.ts      # 80 TanStack Query hooks (~700 lines)
│   ├── useAudioWS.ts          # Audio WS hook (~200 lines)
│   ├── useAgentStream.ts      # SSE streaming hook (~112 lines)
│   ├── useJarvisSync.ts       # Command sync effects
│   ├── useJarvisBridge.ts     # WS bridge integration
│   ├── useVoiceController.ts  # Voice lifecycle
│   ├── useKeyboardShortcut.ts
│   ├── useWebSocket.ts        # Reactive WS hook
│   ├── useCommand.ts          # Command execution hook
│   ├── useBroadcastRouter.ts  # WS event routing
│   ├── useSystemMetrics.ts    # Light selectors
│   ├── useVoiceCommands.ts    # High-level voice
│   └── useStreamingLLM.ts     # Agent stream wrapper
├── lib/
│   └── react-query.ts         # Query key factory
├── context/
│   └── NotificationContext.tsx # Toast notification system
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── AppShell.tsx       # Sidebar + content
│   │   └── SidebarNav.tsx     # Navigation
│   ├── ui/                    # Design system primitives
│   │   ├── Button.tsx, Input.tsx, Select.tsx, Tabs.tsx
│   │   ├── Modal.tsx, Card.tsx, Badge.tsx
│   │   ├── Skeleton.tsx, Tooltip.tsx, Textarea.tsx
│   ├── ... (all feature components)
│   ├── ConfirmationModal.tsx
│   ├── ErrorBoundary.tsx
│   ├── CommandInput.tsx
│   └── NotificationCenter.tsx
├── pages/                     # Page-level components
│   ├── NeuralHUD.tsx
│   ├── AuditTimeline.tsx
│   ├── DeviceSyncHub.tsx
│   ├── NeuralTraining.tsx
│   ├── FileBrowser.tsx
│   ├── WindowManager.tsx
│   ├── SettingsPage.tsx
│   ├── AutomationDashboard.tsx
│   ├── SecurityDashboard.tsx
│   ├── WhatsAppPanel.tsx
│   ├── DesktopControls.tsx
│   ├── InputSimulator.tsx
│   └── MediaToolsPanel.tsx
├── styles/
│   ├── index.css              # Glassmorphism V3 design system
│   └── tokens.ts              # Design tokens
└── utils/
    ├── audioUtils.ts
    ├── microInteractions.ts
    ├── theme.ts
    └── voiceLang.ts
```

---

## Appendix B: Key Backend Behaviors Frontend Must Handle

### B.1 Rate Limiting
- **Global**: 200 requests/min → Frontend must throttle aggressive polling
- **Stream**: 15 requests/min → Frontend must disable "Retry" button for 4s after failed stream

### B.2 Background Jobs (No Frontend Feedback)
- Conversation pruning (every 5 min) — no impact
- Performance metric save (every 5s) — no impact
- mDNS broadcast — no impact
- Wake word engine — `wake_detected` WS broadcast

### B.3 Degraded Mode
- If database is unavailable, backend still works (degraded mode)
- `GET /memory/*` will fail — frontend must show "Memory unavailable" vs crashing
- `GET /settings`, `POST /settings` may fail — use default settings from `constants.ts`

### B.4 Cross-Origin Considerations
- Backend CORS allows: `localhost:5173`, `localhost:3000`, `FRONTEND_URL` env var
- In production, frontend must be served from one of these origins
- For network-accessible JARVIS, set `FRONTEND_URL` env var on backend

---

*End of Frontend Requirements Document — Ready for Development*
