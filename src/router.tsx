/**
 * Router reference — App.tsx uses inline <Routes> with BrowserRouter.
 *
 * Current routing architecture:
 * - BrowserRouter is set up in main.tsx (wraps entire <App />)
 * - All routes are defined inline in App.tsx inside a single <Routes> block
 * - Parent route "/" renders <AppShell /> which contains <Outlet />
 * - 14 nested child routes (hud, settings, timeline, sync, etc.)
 * - Each page is lazy-loaded via React.lazy() + the lazyPage() helper
 * - Each route wraps its component in <Suspense> with a unique loading message
 * - Catch-all "path=\"*\"" redirects to "/hud"
 * - ErrorBoundary wraps the entire route tree
 *
 * Route paths (defined in App.tsx):
 *   /  → AppShell (layout with Outlet for children)
 *   ├── /hud         → NeuralHUD (index redirect target)
 *   ├── /settings    → SettingsPage
 *   ├── /timeline    → AuditTimeline
 *   ├── /sync        → DeviceSyncHub
 *   ├── /automation  → AutomationDashboard
 *   ├── /files       → FileManager
 *   ├── /windows     → WindowManager
 *   ├── /security    → SecurityDashboard
 *   ├── /whatsapp    → WhatsAppControl
 *   ├── /desktop     → RemoteDesktop
 *   ├── /input       → InputSimulator
 *   ├── /media-tools → MediaTools
 *   ├── /training    → NeuralTraining
 *   ├── /about       → AboutPage
 *   └── * (catch-all) → redirect to /hud
 *
 * This file is preserved for documentation only and is NOT imported.
 */
export {};
