# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to the JARVIS AI Assistant will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0-alpha.3] - 2026-06-25

### Added

- **10 new React/TypeScript components** (generated from FRD reverse-engineered via backend-frontend-mapper):
  - `FileBrowser.tsx` — Full CRUD file explorer (list, search, create, rename, copy, move, delete)
  - `WindowManager.tsx` — Window & app list with activate/minimize/maximize/restore/close
  - `PersonalitySelector.tsx` — 4 themes (Stark, Midnight, Avenue, Linear) with visual preview
  - `WhatsAppPanel.tsx` — Send messages, AI drafts, contacts, call
  - `DeviceSyncPanel.tsx` — Pairing code, trusted device list, unpair
  - `InputSimulator.tsx` — Mouse move/click/drag/scroll, keyboard type/press/hotkeys
  - `MediaToolsPanel.tsx` — OCR (screen/file), image convert/resize/compress, PDF tools
  - `SystemControls.tsx` — Shutdown/restart/sleep/lock/hibernate/logout with 5s countdown
  - `PerformanceMonitor.tsx` — Real-time CPU/memory/disk/network with sparkline history
  - `CloudSettings.tsx` — API key management (NVIDIA/OpenRouter/Backend) with visibility toggle + test
- **Modified components**: `JarvisModals.tsx`, `QuickAccess.tsx`, `App.tsx` — integrated new panels into existing UI framework
- **Modified services**: `apiClient.ts` — added methods for all 10 new component API integrations
- **Modified hooks**: `useSystemQuery.ts` — added TanStack Query hooks for all new system endpoints
- **147 new frontend tests**: Tests for all 10 new components + useSystemQuery (172 total, 14 test files)
- **`docs/FRONTEND_COMPONENT_CATALOG.md`**: New living catalog document listing all frontend components, props, backend endpoints, and test coverage status

### Fixed

- **`main.tsx` missing `QueryClientProvider`**: Runtime crash fix — application now boots correctly with TanStack Query context provider wrapping the component tree
- **12 TypeScript errors**: Removed unused `React` imports from 9 test files and 1 unused variable (`useConvertImage`) in `useSystemQuery.test.tsx`

### Tests

- **172 frontend tests passing** (was 25) — 14 test files covering all 10 new components + existing services/stores
- **47 backend tests passing** (unchanged)
- **Total: 219/219 tests passing** across the entire project

## [4.0.0-alpha.2] - 2026-06-23

### Bug-fix Merge (commit 6853324d)

10 fixes applied from bug-analysis pass. CODEX review score: 8.5/10 (Good). All 72 tests pass (47 backend + 25 frontend).

### Fixed

- **Alembic migration**: Changed `neural_vectors.embedding` from `sa.Text()` to raw SQL `vector(1024)` — fixes pgvector index creation on existing DBs
- **nginx Permissions-Policy**: Changed `microphone=()` to `microphone=(self)` — fixes browser mic blocking
- **CI Python version**: `PYTHON_VERSION: '3.12'`→`'3.13'`, matrix now includes `'3.13'`, fixed `pip-audit --desc on`→`--desc` flag
- **Ambiguous Hindi command**: Removed `"band karo"` from `close_app` and `close_window` (now maps only to `shutdown` which requires confirmation)
- **pyproject.toml**: Added `requires-python = ">=3.11"`, updated ruff `select` rules
- **Dockerfile**: Added `PYTHONDONTWRITEBYTECODE=1` to combined Dockerfile
- **Dead code**: Removed `hasattr(result, "model_dump")` guard from command_handler.py
- **rapidfuzz imports**: Moved from lazy (inside functions) to top-level in 3 files
- **nginx WebSocket headers**: Added `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` to `/ws` location
- **VERSION**: Project bumped to 4.0.0-alpha.2

### Added

- **Health probes**: New `/api/v1/ready` (DB connectivity check) and `/api/v1/live` (always-200) endpoints for Kubernetes readiness/liveness probes
- **Nginx security headers**: Added `Strict-Transport-Security`, `X-XSS-Protection`, `Permissions-Policy`, `Content-Security-Policy`, `server_tokens off`
- **Dependabot config**: `.github/dependabot.yml` for npm + pip ecosystems with weekly schedule and group minor/patch updates
- **CI matrix expansion**: Node 18/20/22 + Python 3.11/3.12/3.13 matrix, dependency caching, Trivy container scan, dependency review
- **Docker healthchecks**: HEALTHCHECK added to all Docker images
- **Non-root user**: All Dockerfiles now run as non-root user for security

### Changed

- **TypeScript 5.8.3→5.9.3**: Major TypeScript upgrade with modern syntax support
- **Vite 6.4.2→6.4.3**: Build tool patch update
- **Vitest 4.1.5→4.1.9**: Test runner patch update
- **npm patch upgrades**: 11 packages updated (framer-motion, lucide-react, react, react-dom, react-router-dom, @types/node, @types/react, @vitejs/plugin-react)
- **Python target 3.13**: pyproject.toml target-version changed to py313, Dockerfile.backend→python:3.13-slim
- **pip patch upgrades**: 14 packages updated (fastapi, uvicorn, python-dotenv, slowapi, Pillow, openai, zeroconf, pywin32, comtypes, screen-brightness-control, rapidfuzz, pytest, pytest-asyncio, httptools)
- **pgvector Docker image**: postgres:16-alpine → pgvector/pgvector:0.7.4-pg16 for native vector search
- **Database fixes**: Alembic schema fixed (embedding: Text + quick_actions table + pgvector index), script.py.mako rewritten as async-compatible, database_async.py deleted
- **Code review cleanup**: 47 __pycache__ files untracked, jaeger pinned to 1.62.0, duplicate rapidfuzz removed, docker-compose.dev.yml got postgres+redis services
- **Docker hardening**: All Dockerfiles use pinned base images, non-root user, HEALTHCHECK
- **Version bumped** from 4.0.0-alpha.1 to 4.0.0-alpha.2

### Fixed

- **Pydantic v2 migration**: `.dict()`→`.model_dump()` across all backend models
- **Bare except→except Exception**: 7 instances fixed across backend
- **Lambda→def**: 2 lambda expressions converted to named functions
- **Unused imports**: 6 unused imports removed
- **CommandInput.tsx bug**: Language enum comparison fixed
- **npm audit**: 0 vulnerabilities across all 248 packages

### Security

- **Security hardening**: Hardened nginx.conf with HSTS, XSS protection, permission restrictions, and strict CSP
- **Probe endpoint exemption**: `/api/v1/ready` and `/api/v1/live` added to auth-exempt prefixes for health check access without API keys
- **Trivy security scan**: Added to CI pipeline for container vulnerability scanning
- **Dependency review**: GitHub Action added for PR dependency change review

## [4.0.0-alpha.1] - 2026-06-22

### Changed

- **PostgreSQL migration**: Removed aiosqlite dependency, deleted SQLite migration files, removed dynamic aiosqlite.Row import from memory.py, rewrote test fixtures to use mocked asyncpg.Pool
- **Structured logging**: Migrated 41 files from `utils.logger` to `utils.logger_structured` (structlog + OpenTelemetry), deleted the logger.py shim
- **LLM Gateway cleanup**: Archived dead llm_legacy.py (832 lines, zero imports), removed modules/llm/ backward-compat shim, updated 8 consumer files to import from llm_wrapper directly
- **API versioning**: Moved agent and audio routers under /api/v1 prefix
- **Version bumped** from 3.9.1 to 4.0.0-alpha.1

### Fixed

- **Backend test sweep**: All 47 backend tests now pass (was 33/47 with 14 pre-existing failures). All 25 frontend tests continue to pass — zero failures across the entire suite.
- **`command_handler` tests (6 tests)**: Updated mock targets from `command_handler.system_module` to `handlers.system.system_handler.system_module`. Rewrote `test_all_command_keys_have_routes` to use convention-based handler mapping instead of source-code string scanning.
- **`test_v4.py` tests (8 tests)**: Updated `CostTracker` fixture — `track()` → `record()`, `estimate_cost()` → `total_cost()`, removed `reset()`. Updated `CircuitBreaker` fixture — `max_failures` → `failure_threshold`, `reset_timeout` → `recovery_timeout`, import from `modules.llm_gateway.circuit` instead of `.adapters`.
- **Critical `SQLInjectionMiddleware` body-stream exhaustion bug**: Converted from `BaseHTTPMiddleware` to raw ASGI middleware with a `_ReceiveWrapper` that replays pre-read body to downstream handlers.

## [3.9.1] - 2026-06-16

### Fixed

- Fixed `test_api_system_status` CI failure caused by `asyncio.gather` coroutine leaks. Changed to `return_exceptions=True` so all coroutines complete independently — prevents `CancelledError` from triggering unraisable hook and subsequent `RecursionError` in `tokenize.open`.
- Replaced bare `except:` with `except Exception:` in `system.py` to avoid swallowing `BaseException` subtypes like `CancelledError`.

## [3.9.0] - 2026-05-16

### Added

- **Mobile Ecosystem Finalization**: Secure mobile-to-backend pairing with TTL-based OTPs.
- **Auto-Discovery**: mDNS/ZeroConf integration for automatic server location on local networks.
- **Voice Activation**: High-fidelity wake-word detection ("Hey JARVIS") using `openwakeword`.
- **Live Telemetry**: Real-time CPU/Memory/Neural engine metrics streaming to mobile HUD.
- **Authenticated WebSockets**: Token-based security for all real-time data streams.

### Changed

- Refactored `SystemModule` to use non-blocking hardware polling via background threads.
- Optimized event loop performance by offloading heavy I/O tasks.
- Bumped system version to v3.9.0 across all protocols.

### Fixed

- Fixed Event Loop lag during intensive file system searches.
- Resolved WebSocket connection lifecycle management issues.
- Fixed mDNS port binding conflicts on Windows.

## [3.8.0] - 2026-05-16

### Added

- **Design System V3**: Comprehensive glassmorphism UI overhaul across all components.
- **Dynamic Themes**: 5 new high-fidelity color presets (Cyan, Red, Green, Purple, Gold).
- **Automation Dashboard**: New UI for managing scheduled tasks and custom macros.
- **Memory Viewer**: Standardized "Neural Archive" with Lucide icons and advanced search.
- **Mobile Sync**: QR code pairing and mobile telemetry integration.
- **CI/CD Pipeline**: GitHub Actions for automated Windows-based testing and build verification.
- **Build Script**: `scripts/build.py` for one-click release packaging with PyInstaller.

### Changed

- Migrated all icons from emojis/raw SVGs to `Lucide React`.
- Standardized UI spacing and typography using CSS tokens.
- Improved `SettingsModal` with click-to-close backdrop and tabbed navigation.
- Optimized `index.css` for cross-browser compatibility (`color-mix` fallbacks).

### Fixed

- Fixed duplicate component renders in `StatusPanels`.
- Fixed "HE" → "HG" Hinglish label mismatch in Header.
- Resolved "inline style" linting warnings in `SettingsModal.tsx`.
- Fixed CSS property ordering for `backdrop-filter`.

## [3.7.1] - 2026-04-20

### Added

- Bilingual command normalization for 90+ actions.
- Command routing parity between frontend and backend.

## [3.6.0] - 2026-03-15

### Added

- Semantic memory retrieval using `rapidfuzz`.
- Keyword-based context injection for LLM prompts.

## [3.5.0] - 2026-02-10

### Added

- `ProactiveManager` for background situational analysis.
- Real-time suggestions via WebSocket.

## [3.4.1] - 2025-12-20

### Added

- Async-first backend migration (asyncio).
- Event-loop lag monitoring and performance metrics database.

## [3.0.0] - 2025-10-15

### Added

- Initial v3.0 release with bilingual support and Arc Reactor HUD.

---
*Created by VIPHACKER100*
