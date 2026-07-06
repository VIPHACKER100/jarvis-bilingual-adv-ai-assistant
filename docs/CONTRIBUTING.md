# Contributing to JARVIS

ponytail: trimmed from 397 to ~45 lines — removed performance testing, code review checklist, and deep async async rules (covered by CLAUDE.md conventions)

## Development setup

```bash
git clone https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant.git
cd jarvis-bilingual-adv-ai-assistant
cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..
npm install
```

Copy `.env.example` to `.env` and configure keys.

### Running

```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000
# Frontend (separate terminal)
npm run dev
```

## Coding standards

- **Python 3.13+** — async-first, complete type hints, Ruff linting (`ruff check backend/`)
- **TypeScript** — strict mode, named exports only, no `any` casts
- **Markdown** — ATX headings, fenced code blocks with language tags

## Testing

```bash
pytest tests/ -v                    # Backend (47 tests)
npm test                             # Frontend
npm run check                        # TypeScript + Vite build
```

All tests must pass before merging. New features need tests. Mock external dependencies.

## Commit messages

Follow conventional commits: `<type>(<scope>): <description>`.
Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`.

## Pull request process

1. Create feature branch from `main`
2. Run full test suite + lint before submitting
3. Write clear PR description
4. Squash-merge into `main`

## Related docs

- [API Documentation](API_DOCUMENTATION.md)
- [Setup Guide](SETUP.md)
