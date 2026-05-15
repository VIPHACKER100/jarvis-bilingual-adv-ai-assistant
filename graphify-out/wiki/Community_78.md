# Community 78

> 10 nodes · cohesion 0.20

## Key Concepts

- **sync.py** (4 connections) — `backend/routers/sync.py`
- **pair_device()** (4 connections) — `backend/routers/sync.py`
- **DevicePairingResponse** (3 connections) — `backend/models.py`
- **SyncStatusResponse** (3 connections) — `backend/models.py`
- **get_sync_status()** (3 connections) — `backend/routers/sync.py`
- **get_paired_devices()** (2 connections) — `backend/routers/sync.py`
- **Get system status for mobile dashboard** (1 connections) — `backend/routers/sync.py`
- **Pair a new mobile device** (1 connections) — `backend/routers/sync.py`
- **List all paired mobile devices (sanitized)** (1 connections) — `backend/routers/sync.py`
- **unpair_device()** (1 connections) — `backend/routers/sync.py`

## Relationships

- No strong cross-community connections detected

## Source Files

- `backend/models.py`
- `backend/routers/sync.py`

## Audit Trail

- EXTRACTED: 18 (78%)
- INFERRED: 5 (22%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*