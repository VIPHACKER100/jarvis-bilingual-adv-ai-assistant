# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to the JARVIS AI Assistant will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
