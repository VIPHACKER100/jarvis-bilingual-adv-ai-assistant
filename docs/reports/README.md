# JARVIS Project Test Reports

Generated: **2026-05-16** | Project version: **3.9.0** | Platform: **Windows 10**

This folder contains the full audit of features, commands, APIs, and automated tests for the JARVIS bilingual AI assistant.

## Reports

| File | Description |
|------|-------------|
| [PROJECT_TEST_REPORT.md](./PROJECT_TEST_REPORT.md) | Executive summary, test results, feature inventory, health score |
| [COMMAND_TEST_MATRIX.md](./COMMAND_TEST_MATRIX.md) | All 90 voice commands — parse + dispatch status |
| [API_AND_FRONTEND_COVERAGE.md](./API_AND_FRONTEND_COVERAGE.md) | REST/WebSocket routes and frontend test coverage |
| [ISSUES_AND_RECOMMENDATIONS.md](./ISSUES_AND_RECOMMENDATIONS.md) | Bugs, parser collisions, and prioritized fixes |

## Raw data

| File | Description |
|------|-------------|
| [parser_quick.json](./parser_quick.json) | Machine-readable parser audit (90 commands) |

## Re-run audits

```powershell
# Backend pytest
cd backend
python -m pytest tests/ -q

# Parser command matrix
python scripts/quick_parser_audit.py

# Module import smoke test
python test_modules.py

# Frontend tests
cd ..
npm test
```
