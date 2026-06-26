# JARVIS — Product Requirements Document (PRD)

| Field | Value |
|-------|-------|
| **Product** | JARVIS — Bilingual Advanced AI Assistant |
| **Version** | 4.0.0-alpha.4 |
| **Author** | Aryan Ahirwar (VIPHACKER100) |
| **Last Updated** | 2026-06-26 |
| **Status** | Active Development |

---

## 1. Executive Summary

JARVIS is a bilingual (English + Hinglish/Hindi) AI voice assistant that acts as an **OS orchestrator** for desktop workstations. It combines natural-language voice control, LLM-powered conversation, and deep Windows system integration behind a premium glassmorphic HUD. Users interact via voice, quick-action UI, or mobile sync—JARVIS executes system commands, automates workflows, and proactively suggests next actions based on context.

**Primary value proposition:** Hands-free, natural-language control of the entire workstation in the user's preferred language, with Iron Man–inspired polish and enterprise-grade reliability.

---

## 2. Vision & Mission

### Vision

Become the definitive bilingual desktop AI assistant for power users—combining the personality of J.A.R.V.I.S. with real OS-level control, not just chat.

### Mission

- Reduce friction between intent and action on Windows (and cross-platform where supported).
- Serve English and Hinglish speakers equally—no language penalty.
- Maintain sub-second perceived latency for common commands.
- Keep the user in control with confirmations, security guardrails, and transparent system state.

---

## 3. Target Users

| Persona | Description | Primary Needs |
|---------|-------------|---------------|
| **Power Developer** | Full-stack / AI engineer on Windows 11 | Voice-driven dev workflow, terminal/file control, diagnostics HUD |
| **Security Researcher** | Pentest & recon workflows | Process guardian, network scan, automation macros |
| **Bilingual Professional** | India-based user mixing English + Hinglish | Natural Hinglish STT/TTS, Devanagari support |
| **Mobile Companion User** | Secondary device for telemetry/sync | Mobile dashboard, pairing, remote status |

**Primary stakeholder:** VIPHACKER100 (Aryan Ahirwar) — creator and primary user; product decisions optimize for this workstation-first workflow.

---

## 4. Goals & Success Metrics

### Business / Product Goals

| Goal | Metric | Target (v4.0.0+) |
|------|--------|------------------|
| Command reliability | Commands executing without runtime error | ≥ 99% for routed commands |
| Bilingual parity | Hindi/Hinglish commands with valid responses | 100% key coverage |
| Responsiveness | Backend event-loop lag under load | < 50ms average |
| Dashboard stability | Frontend crash rate from undefined API data | Zero unhandled `.length` / null crashes |
| Type safety | `any` types in API client | 0 |
| Test coverage | CI passing on push/PR | Backend pytest + frontend Vitest green |

### User Experience Goals

- Voice activation to command execution feels instantaneous (< 2s end-to-end for simple commands).
- Dangerous actions (shutdown, delete) always require explicit confirmation.
- Proactive suggestions are helpful, not noisy (user can dismiss/ignore).
- HUD remains fluid during heavy OCR or window scanning.

---

## 5. Problem Statement

Desktop users—especially bilingual developers—switch constantly between keyboard, mouse, and multiple apps. Existing voice assistants (Siri, Cortana, Google Assistant) lack deep OS integration, bilingual Hinglish fluency, and a unified control surface. Generic LLM chatbots cannot shutdown the PC, resize windows, or send WhatsApp messages.

**JARVIS solves:** One voice-first interface that understands Hinglish *and* controls the machine.

---

## 6. Product Scope

### 6.1 In Scope (Current — v4.0.0-alpha.2)

#### Voice & Language

- Web Speech API for STT/TTS (browser-native).
- English, Hinglish, and Devanagari Hindi transcription.
- Adaptive TTS pitch/rate for natural Hinglish output.
- Optional wake word ("jarvis").
- 90+ routed voice commands with bilingual response keys.

#### System Control

- CPU, memory, battery, disk, network monitoring.
- Volume, brightness, power (shutdown/restart/sleep with confirmation).
- Real-time WebSocket status broadcasts.
- Performance history ("flight data" analytics).

#### Window & Desktop

- Open/close/list applications and windows.
- Minimize, maximize, snap, move, resize.
- Screenshots, clipboard, media keys.

#### Input Automation

- Mouse move/click/drag/scroll.
- Keyboard typing, hotkeys, human-like delays.

#### File & Media Tools

- File CRUD, search, quick-access folders.
- OCR (images, PDFs, screen capture).
- PDF merge/split/compress; image convert/resize/batch.

#### Communication

- WhatsApp Web/Desktop automation.
- Fuzzy contact resolution (`contacts.json` aliases).
- Smart reply drafting with OCR context.

#### Intelligence Layer

- Multi-provider LLM (OpenRouter, NVIDIA, Ollama, Google Gemini) with failover.
- Semantic neural memory retrieval (`rapidfuzz` + keyword scoring).
- Proactive situational suggestions (`ProactiveManager`).
- Dynamic personality modes (e.g., Stark).

#### Security & Safety

- API key authentication (`BACKEND_API_KEY`).
- Rate limiting (200 req/min default).
- Process Guardian (blacklist / high-resource alerts).
- Network deep scan exposure in Security HUD.
- Dangerous command confirmation flow (30s timeout).

#### Dashboard & HUD

- Glassmorphism Design System V3.
- Arc Reactor voice activation UI.
- System Diagnostics, Vision Overlay (OCR HUD).
- Command Insights, Automation Editor, Memory Viewer.
- Mobile Sync + Mobile Dashboard.
- Quick Responses bar for proactive/command shortcuts.

#### Infrastructure

- FastAPI modular routers (19 router modules).
- PostgreSQL + pgvector for semantic vector search.
- GitHub Actions CI (Python 3.11/3.12/3.13, Node 18/20/22).
- Docker Compose support (PostgreSQL, Redis, Nginx).
- **Autonomous Agentic Loop (v3.9.0)**: ReAct (Reasoning + Acting) loop for multi-step task orchestration.
- **Situational Screen Awareness (v3.9.0)**: Deep visual context via LLM-assisted OCR analysis for proactive suggestions.
- **Safety Gates (v3.9.0)**: Interception of dangerous autonomous commands with manual confirmation override.
- **Semantic Vector Search (v4.0.0)**: Hybrid retrieval using PostgreSQL + pgvector for long-term memory.

### 6.2 Out of Scope (Current Release)

- Native mobile app (sync API exists; app is future).
- Cloud-hosted multi-tenant SaaS.
- macOS/Linux feature parity with Windows (partial support only).
- Offline LLM as default (Ollama supported but optional).
- Consumer app store distribution.

### 6.3 Future Roadmap (Planned)

| Phase | Feature | Priority |
|-------|---------|----------|
| v4.x | Plugin/skill marketplace for custom commands | Medium |
| v4.x | Multi-machine neural sync | Low |
| v4.x | Full macOS/Linux automation parity | Medium |
| v4.x | Mobile companion app (Production Build) | Medium |
| v5.0 | AGI-lite local orchestration (World Model) | Visionary |

---

## 7. Functional Requirements

### FR-01: Voice Command Processing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01.1 | User can activate listening via Arc Reactor click or wake word | P0 |
| FR-01.2 | Spoken input is sent to backend for parsing and execution | P0 |
| FR-01.3 | Response is spoken via TTS in user's selected language | P0 |
| FR-01.4 | Unrecognized input falls back to LLM conversation | P1 |

### FR-02: Bilingual Command Parser

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-02.1 | Hindi/Hinglish phrases map to canonical English command keys | P0 |
| FR-02.2 | Devanagari script variants are recognized | P1 |
| FR-02.3 | Responses return bilingual message keys (en/hi) | P0 |

### FR-03: Dangerous Command Safety

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-03.1 | Shutdown, restart, delete, format require confirmation modal | P0 |
| FR-03.2 | Confirmation expires after configurable timeout (default 30s) | P0 |
| FR-03.3 | User can cancel via voice or UI | P0 |

### FR-04: Real-Time System HUD

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-04.1 | WebSocket pushes CPU/memory/battery every broadcast cycle | P0 |
| FR-04.2 | Event-loop lag triggers visual performance HUD feedback | P1 |
| FR-04.3 | Performance metrics persist to DB for historical charts | P1 |

### FR-05: Proactive Intelligence

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-05.1 | Background loop analyzes active window/context | P1 |
| FR-05.2 | Actionable suggestions appear in Quick Responses bar | P1 |
| FR-05.3 | User can execute or dismiss suggestions | P1 |

### FR-06: Neural Memory

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-06.1 | Conversations and facts persist in PostgreSQL + pgvector | P0 |
| FR-06.2 | Relevant memory nodes inject into LLM context semantically | P1 |
| FR-06.3 | User can view/edit memory via Memory Viewer UI | P2 |

### FR-07: Mobile Sync

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-07.1 | Device pairing via QR/secure token | P1 |
| FR-07.2 | Remote telemetry visible on Mobile Dashboard | P1 |
| FR-07.3 | Commands can be relayed from paired device | P2 |

### FR-08: Automation & Macros

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-08.1 | User can define scheduled tasks and macros | P1 |
| FR-08.2 | Automation dashboard shows run history and status | P1 |

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Async-first backend; blocking I/O offloaded via `asyncio.to_thread` |
| **Availability** | Backend auto-reconnect from frontend; graceful WebSocket recovery |
| **Security** | No hardcoded API keys; `.env` only; SSL verification on external calls |
| **Accessibility** | All interactive UI elements have `title` and `aria-label` |
| **Maintainability** | Modular routers; typed frontend API (`src/types/api.ts`) |
| **Observability** | Structured logging, performance metrics DB, event-loop monitor |
| **Compatibility** | Node 18/20/22+, Python 3.11+ (CI on 3.11/3.12/3.13); Chrome/Edge recommended |
| **Localization** | English + Hindi response catalogs; Hinglish STT |

---

## 9. User Stories

### Epic: Voice System Control

> **As a** developer with hands on keyboard,  
> **I want to** say "volume badhao" and have volume increase,  
> **So that** I never leave my editor.

**Acceptance criteria:**

- Volume changes within 2 seconds of speech end.
- TTS confirms action in Hinglish or English per language setting.

### Epic: Safe Power Management

> **As a** workstation user,  
> **I want** shutdown commands to require confirmation,  
> **So that** accidental voice triggers cannot power off my machine.

**Acceptance criteria:**

- Confirmation modal appears with 30s countdown.
- Cancel via UI or "cancel" voice command aborts action.

### Epic: Proactive Assistance

> **As a** user on a GitHub issue page,  
> **I want** JARVIS to suggest summarizing the issue,  
> **So that** I save time without asking first.

**Acceptance criteria:**

- Suggestion appears in Quick Responses within one proactive cycle.
- Clicking suggestion executes or opens relevant command flow.

### Epic: WhatsApp by Name

> **As a** user,  
> **I want to** say "message Mom on WhatsApp,"  
> **So that** I don't need to remember phone numbers.

**Acceptance criteria:**

- Fuzzy match resolves "Mom" from `contacts.json`.
- WhatsApp opens with correct contact selected.

---

## 10. User Interface Requirements

### Design Language

- **Theme:** Dark mode, Linear Precision aesthetic.
- **Palette:** Deep indigo, cyan/purple/pink multi-hue gradients.
- **Components:** Glass panels (`.glass-panel`), neon text (`.neon-text`), pulse animations (`.animate-pulse-core`).
- **Interactions:** Hover/active micro-transitions on all controls.

### Core Screens / Panels

| Panel | Purpose |
|-------|---------|
| Main HUD | Central command surface, Arc Reactor, status |
| Status Panels | Live CPU/memory/battery/network |
| Advanced Tools | OCR, PDF, image utilities |
| Security Dashboard | Process guardian, network scan |
| Performance History | Historical resource charts |
| Automation Dashboard | Macros and scheduled tasks |
| Settings Modal | Language, personality, API config |
| Mobile Dashboard | Cross-device telemetry |

---

## 11. Integrations & Dependencies

| Integration | Purpose | Required |
|-------------|---------|----------|
| OpenRouter / NVIDIA / Ollama | LLM inference | At least one |
| Web Speech API | STT/TTS | Yes (browser) |
| Tesseract OCR | Text extraction | Optional (feature-dependent) |
| WhatsApp Web/Desktop | Messaging automation | Optional |
| Redis | Caching layer | Optional (`REDIS_ENABLED`) |
| PostgreSQL + pgvector | Persistence + vector search | Yes |

---

## 12. Assumptions & Constraints

### Assumptions

- User runs backend locally on the same machine as the browser HUD.
- Microphone permission is granted in the browser.
- Windows 11 is the primary target OS for full automation features.
- User provides valid LLM API keys in `.env`.

### Constraints

- Browser security sandbox limits some system APIs (backend handles OS calls).
- Web Speech API quality varies by browser/locale.
- GUI automation requires focused desktop session on Windows.

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM provider outage | Degraded conversation | Multi-provider failover |
| Voice misrecognition | Wrong command executed | Confirmation for dangerous ops; command logging |
| Event-loop blocking | UI lag, WS timeout | Async migration + `asyncio.to_thread` |
| API schema drift | Dashboard crashes | Typed interfaces + defensive optional chaining |
| WhatsApp DOM changes | Automation breaks | Modular `whatsapp.py`; fallback to manual open |

---

## 14. Release Criteria (v4.0.0-alpha.4)

- [ ] All backend tests pass (pytest, currently 47).
- [ ] Frontend rebuilt from scratch per [FRD.md](FRD.md) — all pages, components, hooks, services, and types.
- [ ] Frontend test suite re-established (Vitest, target: 25+ tests).
- [ ] CI pipeline green (backend tests, frontend build, type check) across Python 3.11/3.12/3.13 + Node 18/20/22.
- [ ] Dashboard components handle empty/undefined API payloads with defensive optional chaining.
- [ ] API key authentication enabled on all agent endpoints with constant-time comparison (`hmac.compare_digest`).
- [ ] PostgreSQL + pgvector running with Alembic migrations applied.
- [ ] LLM Gateway multi-provider failover working (OpenRouter, NVIDIA, Ollama, Google Gemini).
- [ ] All endpoints use `/api/v1/` prefix.
- [ ] WebSocket authenticated via `api_key` query parameter.
- [ ] Structured logging (structlog) in production JSON format.
- [ ] Version `4.0.0-alpha.4` consistent in `environment.py`, `CHANGELOG.md`, README.

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **HUD** | Heads-Up Display — the main JARVIS React UI |
| **Neural Bridge** | WebSocket + REST connection between frontend and backend |
| **Hinglish** | Hindi-English code-mixed speech common in India |
| **Proactive Manager** | Background service suggesting context-aware actions |
| **Process Guardian** | Security module monitoring suspicious/high-resource processes |
| **God Node** | High-connectivity module in Graphify knowledge graph (e.g., `ApiClient`) |

---

## 16. References

- [README.md](README.md) — Project overview
- [docs/COMMANDS.md](docs/COMMANDS.md) — Voice command reference
- [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) — REST/WebSocket API
- [docs/SETUP.md](docs/SETUP.md) — Installation guide
- [TDS.md](TDS.md) — Technical Design Specification
- [memory/decisions.md](memory/decisions.md) — Architecture decision log

---

*This document is the single source of truth for **what** JARVIS builds and **why**. Implementation details live in [TDS.md](TDS.md).*
