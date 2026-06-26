# JARVIS Frontend Component Catalog — Target Architecture

**Version:** 4.0.0-alpha.4  
**Date:** 2026-06-25  
**Total Components (planned):** 44  
**Test Coverage (planned):** 172+ tests across 14+ files

> This catalog documents the **current frontend implementation** — all components listed below exist in `src/`.
> See [docs/FRD.md](FRD.md) for the full specification including API types, hooks, state management,
> and the prioritized Master Task List.

A living reference for on-boarding developers. Lists every frontend component (planned), its props, the backend endpoints it consumes, and its target test coverage status.

---

## Component Inventory

### Core / Shell

| Component | File | Props | Backend Endpoints | Tests | Status |
|-----------|------|-------|-------------------|-------|--------|
| `App` | `App.tsx` | — | — | — | ✅ Implemented — inline `<Routes>`, `React.lazy()` + `Suspense` code-splitting, `ErrorBoundary` wrapper |
| `ArcReactor` | `ArcReactor.tsx` | — | — | — | 🏗️ Planned (voice API dependent) |
| `MainHUD` | `MainHUD.tsx` | — | — | — | 🏗️ Planned |
| `ErrorBoundary` | `App.tsx` (inline class component) | `children` | — | — | ✅ Implemented — "SYSTEM MALFUNCTION" screen with REBOOT button |

### System & Diagnostics

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `SystemDiagnostics` | `SystemDiagnostics.tsx` | `useSystemStatus` | `GET /system/status` | — | Legacy |
| `PerformanceMonitor` | `PerformanceMonitor.tsx` | `usePerformanceHistory`, `useSystemStatus` | `GET /system/performance/history`, `GET /system/status` | 13 | ✅ Full coverage |
| `SystemControls` | `SystemControls.tsx` | `useShutdownComputer`, `useRestartComputer`, `useSleepComputer` | `POST /system/shutdown`, `POST /system/restart`, `POST /system/sleep` | 18 | ✅ Full coverage |
| `StatusPanels` | `StatusPanels.tsx` | `useSystemStatus` | `GET /system/status` | — | Legacy |
| `SystemMetricsWidget` | `SystemMetricsWidget.tsx` | — | — | — | — |

### Voice & Input

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `CommandInput` | `CommandInput.tsx` | `onSend` | `POST /command` (via bridge) | — | — |
| `CommandPalette` | `CommandPalette.tsx` | — | — | — | — |
| `InputSimulator` | `InputSimulator.tsx` | `useCursorPosition`, `useMoveCursor`, `useMouseClick`, `useTypeText`, `usePressKey`, `useScrollWheel`, `useSendShortcut` | `GET /input/cursor`, `POST /input/move`, `POST /input/click`, `POST /input/type`, `POST /input/press`, `POST /input/scroll`, `POST /input/shortcut` | 20 | ✅ Full coverage |
| `VolumeControl` | `VolumeControl.tsx` | `useVolumeUp`, `useVolumeDown`, `useToggleMute` | `POST /system/volume/up`, `POST /system/volume/down`, `POST /system/mute` | — | — |

### Desktop & Media

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `DesktopControls` | `DesktopControls.tsx` | `useScreenshot` | `GET /desktop/screenshot` | — | Legacy (not tested) |
| `MediaTools` | `MediaTools.tsx` | — | — | — | Superseded by `MediaToolsPanel` |
| `MediaToolsPanel` | `MediaToolsPanel.tsx` | `useOcrImage`, `useOcrPdf`, `useOcrScreen`, `useConvertImage`, `useResizeImage`, `useCompressImage`, `useMergePdfs`, `useSplitPdf`, `usePdfToImages`, `useImagesToPdf` | `POST /media/ocr/image`, `POST /media/ocr/pdf`, `POST /media/ocr/screen`, `POST /image/convert`, `POST /image/resize`, `POST /image/compress`, `POST /pdf/merge`, `POST /pdf/split`, `POST /pdf/to-images`, `POST /pdf/from-images` | 19 | ✅ Full coverage |
| `VisionOverlay` | `VisionOverlay.tsx` | — | — | — | Not tested |

### Files

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `FileBrowser` | `FileBrowser.tsx` | `useFileList`, `useFileSearch`, `useCreateFolder`, `useDeleteFile`, `useCopyFile`, `useMoveFile`, `useRenameFile` | `GET /files/list`, `POST /files/search`, `POST /files/create`, `POST /files/delete`, `POST /files/copy`, `POST /files/move`, `POST /files/rename` | 20 | ✅ Full coverage |
| `QuickAccess` | `QuickAccess.tsx` | `useQuickActions` | `GET /context/quick-actions` | — | — |

### Windows & Apps

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `WindowManager` | `WindowManager.tsx` | `useWindows`, `useApps`, `useOpenApp`, `useCloseApp`, `useWindowAction` | `GET /windows/list`, `GET /apps/list`, `POST /apps/open`, `POST /apps/close`, `POST /windows/minimize`, `POST /windows/maximize`, `POST /windows/restore`, `POST /windows/activate` | 20 | ✅ Full coverage |

### Memory & AI

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `MemoryViewer` | `MemoryViewer.tsx` | `useConversations`, `useMemoryFacts`, `useMemoryNodes`, `useMemoryStats` | `GET /memory/conversations`, `GET /memory/facts`, `GET /memory/nodes`, `GET /memory/stats` | — | Legacy (large, 693 lines) |
| `NeuralNetwork` | `NeuralNetwork.tsx` | — | — | — | — |
| `NeuralInterfaceDashboard` | `NeuralInterfaceDashboard.tsx` | — | — | — | — |
| `NeuralTraining` | `NeuralTraining.tsx` | — | — | — | — |

### Automation

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `AutomationDashboard` | `AutomationDashboard.tsx` | `useTasks`, `useMacros`, `useAutomationStatus` | `GET /automation/tasks`, `GET /automation/macros`, `GET /automation/status` | — | Not tested |
| `AutomationEditor` | `AutomationEditor.tsx` | — | — | — | — |

### WhatsApp

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `WhatsAppPanel` | `WhatsAppPanel.tsx` | `useWhatsAppStatus`, `useWhatsAppContacts`, `useSendWhatsAppMessage` | `GET /whatsapp/status`, `GET /whatsapp/contacts`, `POST /whatsapp/send` | 18 | ✅ Full coverage |

### Sync & Device

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `DeviceSyncPanel` | `DeviceSyncPanel.tsx` | `usePairingCode`, `usePairedDevices`, `useUnpairDevice` | `GET /sync/pairing-code`, `GET /sync/devices`, `DELETE /sync/devices/{device_id}` | 18 | ✅ Full coverage |
| `DeviceSyncHub` | `DeviceSyncHub.tsx` | — | — | — | — |

### Personality & Themes

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `PersonalitySelector` | `PersonalitySelector.tsx` | `usePersonalities`, `useSetPersonality` | `GET /system/personalities`, `POST /system/personality/{p_id}` | 12 | ✅ Full coverage |

### Settings & Cloud

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `SettingsModal` | `SettingsModal.tsx` | `useSettings`, `useUpdateSettings` | `GET /settings`, `POST /settings` | — | Legacy |
| `CloudSettings` | `CloudSettings.tsx` | `useApiKeyStatus`, `useUpdateApiKeys`, `useTestApiKey` | `GET /settings/keys`, `POST /settings/keys`, `POST /settings/test-key` | 16 | ✅ Full coverage |

### Modals & Overlays

| Component | File | Props | Backend Endpoints | Tests | Status |
|-----------|------|-------|-------------------|-------|--------|
| `ConfirmationModal` | `ConfirmationModal.tsx` | `message`, `onConfirm`, `onCancel` | `POST /confirm/{confirmation_id}` | — | Not tested |
| `PermissionModal` | `PermissionModal.tsx` | — | — | — | — |
| `JarvisModals` | `JarvisModals.tsx` | — | Hosts all modals | — | Integration point |

### History & Analytics

| Component | File | Props / Hooks | Backend Endpoints | Tests | Status |
|-----------|------|---------------|-------------------|-------|--------|
| `ActivityFeed` | `ActivityFeed.tsx` | — | — | — | — |
| `HistoryLog` | `HistoryLog.tsx` | — | — | — | — |
| `CommandInsights` | `CommandInsights.tsx` | `useCommandInsights` | `GET /system/command-insights` | — | — |
| `AuditTimeline` | `AuditTimeline.tsx` | — | — | — | — |
| `NotificationCenter` | `NotificationCenter.tsx` | — | — | — | — |
| `QuickActions` | `QuickActions.tsx` | — | — | — | — |
| `QuickResponses` | `QuickResponses.tsx` | — | — | — | — |
| `SecurityDashboard` | `SecurityDashboard.tsx` | — | — | — | — |

### UI Primitives

| Component | File | Location | Tests | Status |
|-----------|------|----------|-------|--------|
| Various | `ui/` | `src/components/ui/` | — | Shared primitives |
| `AmbientBackground` | `AmbientBackground.tsx` | — | — | — |

### Layout

| Component | File | Location |
|-----------|------|----------|
| Various | `layout/` | `src/components/layout/` |
| `AdvancedTools` | `AdvancedTools.tsx` | — |

---

## Service Layer

| Service | File | Backend Endpoints | Tests | Status |
|---------|------|-------------------|-------|--------|
| `apiClient` | `src/services/apiClient.ts` | All REST endpoints | 11 | ✅ Full coverage |
| `voiceService` | `src/services/voiceService.ts` | Web Speech API (browser) | 7 | ✅ Full coverage |
| `websocketService` | `src/services/websocketService.ts` | `WS /ws` | — | — |
| `useAudioWS` | `src/hooks/useAudioWS.ts` | `WS /api/v1/audio/ws/audio` | — | ✅ Implemented |
| `useCommand` | `src/hooks/useCommand.ts` | WS + broadcastRouter | — | ✅ Implemented |
| `useAgentStream` | `src/hooks/useAgentStream.ts` | `POST /api/v1/agent/stream` | — | ✅ Implemented |
| `useVoiceCommands` | `src/hooks/useVoiceCommands.ts` | Web Speech API | — | ✅ Implemented |
| `useJarvisBridge` | `src/hooks/useJarvisBridge.ts` | WebSocket commands | — | Not tested |

---

## Hook Library

| Hook | File | Backend Endpoints | Used By |
|------|------|-------------------|---------|
| `useSystemStatus` | `useSystemQuery.ts` | `GET /system/status` | `SystemDiagnostics`, `PerformanceMonitor` |
| `usePerformanceHistory` | `useSystemQuery.ts` | `GET /system/performance/history` | `PerformanceMonitor` |
| `usePersonalities` | `useSystemQuery.ts` | `GET /system/personalities` | `PersonalitySelector` |
| `useSetPersonality` | `useSystemQuery.ts` | `POST /system/personality/{p_id}` | `PersonalitySelector` |
| `useCommandInsights` | `useSystemQuery.ts` | `GET /system/command-insights` | `CommandInsights` |
| `useBattery` | `useSystemQuery.ts` | `GET /system/battery` | Various |
| `useShutdownComputer` | `useSystemQuery.ts` | `POST /system/shutdown` | `SystemControls` |
| `useRestartComputer` | `useSystemQuery.ts` | `POST /system/restart` | `SystemControls` |
| `useSleepComputer` | `useSystemQuery.ts` | `POST /system/sleep` | `SystemControls` |
| `useWindows` | `useSystemQuery.ts` | `GET /windows/list` | `WindowManager` |
| `useApps` | `useSystemQuery.ts` | `GET /apps/list` | `WindowManager` |
| `useOpenApp` | `useSystemQuery.ts` | `POST /apps/open` | `WindowManager` |
| `useCloseApp` | `useSystemQuery.ts` | `POST /apps/close` | `WindowManager` |
| `useWindowAction` | `useSystemQuery.ts` | `POST /windows/minimize`, `/maximize`, `/restore`, `/activate` | `WindowManager` |
| `useFileList` | `useSystemQuery.ts` | `GET /files/list` | `FileBrowser` |
| `useFileSearch` | `useSystemQuery.ts` | `POST /files/search` | `FileBrowser` |
| `useCreateFolder` | `useSystemQuery.ts` | `POST /files/create` | `FileBrowser` |
| `useDeleteFile` | `useSystemQuery.ts` | `POST /files/delete` | `FileBrowser` |
| `useCopyFile` | `useSystemQuery.ts` | `POST /files/copy` | `FileBrowser` |
| `useMoveFile` | `useSystemQuery.ts` | `POST /files/move` | `FileBrowser` |
| `useRenameFile` | `useSystemQuery.ts` | `POST /files/rename` | `FileBrowser` |
| `useCursorPosition` | `useSystemQuery.ts` | `GET /input/cursor` | `InputSimulator` |
| `useMoveCursor` | `useSystemQuery.ts` | `POST /input/move` | `InputSimulator` |
| `useMouseClick` | `useSystemQuery.ts` | `POST /input/click` | `InputSimulator` |
| `useTypeText` | `useSystemQuery.ts` | `POST /input/type` | `InputSimulator` |
| `usePressKey` | `useSystemQuery.ts` | `POST /input/press` | `InputSimulator` |
| `useScrollWheel` | `useSystemQuery.ts` | `POST /input/scroll` | `InputSimulator` |
| `useSendShortcut` | `useSystemQuery.ts` | `POST /input/shortcut` | `InputSimulator` |
| `useOcrImage` | `useSystemQuery.ts` | `POST /media/ocr/image` | `MediaToolsPanel` |
| `useOcrPdf` | `useSystemQuery.ts` | `POST /media/ocr/pdf` | `MediaToolsPanel` |
| `useOcrScreen` | `useSystemQuery.ts` | `POST /media/ocr/screen` | `MediaToolsPanel` |
| `useConvertImage` | `useSystemQuery.ts` | `POST /image/convert` | `MediaToolsPanel` |
| `useResizeImage` | `useSystemQuery.ts` | `POST /image/resize` | `MediaToolsPanel` |
| `useCompressImage` | `useSystemQuery.ts` | `POST /image/compress` | `MediaToolsPanel` |
| `useMergePdfs` | `useSystemQuery.ts` | `POST /pdf/merge` | `MediaToolsPanel` |
| `useSplitPdf` | `useSystemQuery.ts` | `POST /pdf/split` | `MediaToolsPanel` |
| `usePdfToImages` | `useSystemQuery.ts` | `POST /pdf/to-images` | `MediaToolsPanel` |
| `useImagesToPdf` | `useSystemQuery.ts` | `POST /pdf/from-images` | `MediaToolsPanel` |
| `useWhatsAppStatus` | `useSystemQuery.ts` | `GET /whatsapp/status` | `WhatsAppPanel` |
| `useWhatsAppContacts` | `useSystemQuery.ts` | `GET /whatsapp/contacts` | `WhatsAppPanel` |
| `useSendWhatsAppMessage` | `useSystemQuery.ts` | `POST /whatsapp/send` | `WhatsAppPanel` |
| `usePairingCode` | `useSystemQuery.ts` | `GET /sync/pairing-code` | `DeviceSyncPanel` |
| `usePairedDevices` | `useSystemQuery.ts` | `GET /sync/devices` | `DeviceSyncPanel` |
| `useUnpairDevice` | `useSystemQuery.ts` | `DELETE /sync/devices/{device_id}` | `DeviceSyncPanel` |
| `useApiKeyStatus` | `useSystemQuery.ts` | `GET /settings/keys` | `CloudSettings` |
| `useUpdateApiKeys` | `useSystemQuery.ts` | `POST /settings/keys` | `CloudSettings` |
| `useTestApiKey` | `useSystemQuery.ts` | `POST /settings/test-key` | `CloudSettings` |
| `useSettings` | `useSystemQuery.ts` | `GET /settings` | `SettingsModal` |
| `useUpdateSettings` | `useSystemQuery.ts` | `POST /settings` | `SettingsModal` |
| `useAudioWS` | `useAudioWS.ts` | `WS /api/v1/audio/ws/audio` | Audio STT/TTS lifecycle |
| `useAgentStream` | `useAgentStream.ts` | `POST /api/v1/agent/stream` | SSE LLM response streaming |
| `useVoiceCommands` | `useVoiceCommands.ts` | Web Speech API | Browser speech recognition lifecycle |
| `useCommand` | `useCommand.ts` | WS + broadcastRouter | Command execution + confirmation flow |

---

## Store Layer

| Store | File | Purpose | Tests | Status |
|-------|------|---------|-------|--------|
| `useJarvisStore` | `src/store/jarvisStore.ts` | Global state (mode, language, history, connection) | 6 | ✅ Full coverage |

---

## Test Coverage Summary

| File | Test Count | Type | Status |
|------|-----------|------|--------|
| `apiClient.test.ts` | 11 | Service | ✅ |
| `voiceService.test.ts` | 7 | Service | ✅ |
| `jarvisStore.test.ts` | 6 | Store | ✅ |
| `CloudSettings.test.tsx` | 16 | Component | ✅ |
| `DeviceSyncPanel.test.tsx` | 18 | Component | ✅ |
| `FileBrowser.test.tsx` | 20 | Component | ✅ |
| `InputSimulator.test.tsx` | 20 | Component | ✅ |
| `MediaToolsPanel.test.tsx` | 19 | Component | ✅ |
| `PerformanceMonitor.test.tsx` | 13 | Component | ✅ |
| `PersonalitySelector.test.tsx` | 12 | Component | ✅ |
| `SystemControls.test.tsx` | 18 | Component | ✅ |
| `useSystemQuery.test.tsx` | 12 | Hook | ✅ |
| `WhatsAppPanel.test.tsx` | 18 | Component | ✅ |
| `WindowManager.test.tsx` | 20 | Component | ✅ |
| **Total** | **172** | | ✅ |

### Uncovered components (not yet tested)

These components and hooks lack automated tests:

- `ArcReactor` (browser voice API dependent)
- `MainHUD`
- `useJarvisBridge` (WebSocket dependent)
- `useAudioWS` (WebSocket dependent)
- `useAgentStream` (fetch dependent)
- `useVoiceCommands` (browser SpeechRecognition API dependent)
- `useCommand` (WebSocket + broadcastRouter dependent)
- `DesktopControls`
- `ConfirmationModal`
- `VisionOverlay`
- `AutomationDashboard`
- `CommandInsights`
- `SecurityDashboard`
- `MemoryViewer`
- `NeuralNetwork`
- `ActivityFeed`

---

## Adding a New Component

1. Create the component in `src/components/`
2. Add API methods to `src/services/apiClient.ts`
3. Add TanStack Query hooks in `src/hooks/useSystemQuery.ts`
4. Create test file in `src/__tests__/` following existing patterns
5. Wire into `JarvisModals.tsx` and `QuickAccess.tsx` if needed
6. Update this catalog

---

*Maintained by JARVIS Documentation Agent — update after every component addition or test expansion.*
