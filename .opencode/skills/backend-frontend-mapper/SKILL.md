---
name: backend-frontend-mapper
description: Use when the user asks to map, analyze, reverse-engineer, document, or generate frontend requirements from a backend codebase. Also use when the user says "FRD", "frontend requirements", "backend-to-frontend", "API mapping", or "reverse-engineer backend". Do NOT use for general frontend development or backend development tasks.
---

# Backend-to-Frontend Mapper

This skill loads the **backend-frontend-mapper** subagent, which reverse-engineers backend codebases to produce complete, production-ready Frontend Requirements Documents (FRD).

## How to Use

When the user wants to generate frontend requirements from a backend codebase, load this skill and instruct it to:

1. **Analyze the backend** — endpoints, models, auth, business logic, error patterns
2. **Produce a complete FRD** — pages, components, hooks/services, auth flows, state management, API integration layer, UI/UX rules, master task list, complexity report

## Agent Reference

The full agent definition is at `.opencode/agents/backend-frontend-mapper.md`. Key behaviors:

- Analyzes EVERY backend file — routes, controllers, models, middleware, services, auth, business rules
- Produces a structured FRD with tables, code blocks, and checklists
- Covers: pages, components, functions/hooks/services, auth flows, state management, API layer, UI/UX rules, task list, complexity report
- Flags ambiguous findings as "⚠️ UNCLEAR"
- Output is complete enough for a frontend developer to build from with zero additional context

## When NOT to Use

- Do NOT use for building frontend code directly — use the `frontend-dev` agent for that
- Do NOT use for backend API development — use the `backend-dev` agent for that
- Do NOT use for general code review — use the `CODEX` or `code-reviewer` agents
