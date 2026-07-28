# Quickstart: Property Investment Tool

**Feature**: `001-property-investment-tool`  
**Date**: 2026-07-28

## Prerequisites

- Docker Desktop (or local Go 1.22+, Node 20+, MySQL 8.4)
- Repo root: playground

## Setup

```bash
docker compose up --build
```

- Frontend: http://localhost:5173/property-investment  
- API health: http://localhost:8080/api/health  

Confirm seed loaded (after US1):

```bash
curl -s http://localhost:8080/api/property/cities
curl -s -X POST http://localhost:8080/api/property/rank \
  -H "Content-Type: application/json" \
  -d "{\"city_id\":\"sydney\",\"price_min\":500000,\"price_max\":2000000,\"weights\":{\"investment\":40,\"lifestyle\":20,\"risk\":20,\"future_growth\":20},\"limit\":100}"
```

Expect Sydney `coverage: full` and a non-empty `items` array (up to 100).

## Validation scenarios

### V1 — Seed dataset (US1)

1. Rank Sydney with a wide price band.  
2. Pick any `suburb_id` from results: `GET /api/property/suburbs/:id`.  
3. Confirm at least one factor has `origin: "seed"` and a `source` label.  
4. Confirm omitted/null metrics are shown as unavailable in the UI.

### V2 — Filters and Top 100 (US2)

1. Open `/property-investment`.  
2. Select Sydney, set a narrow price range, adjust weights (must stay at 100%).  
3. Confirm list updates within ~3 seconds and shows ≤100 rows.  
4. Select Melbourne (or other city): see limited/coming-soon message, not a silent empty failure.

### V3 — Recommendation (US3)

1. Click a Top 100 suburb (e.g. Seven Hills if present).  
2. Confirm score /100, Pros, Cons, and summary recommendation.  
3. Change weights and reopen: score may change; Pros/Cons remain explainable.

### V4 — Factor panels (US4)

1. On suburb detail, walk Price → Investment Indicators.  
2. Each populated panel shows metrics and source attribution.

### V5 — Map (US5)

1. Confirm map colours green/yellow/red for in-range suburbs.  
2. Click a suburb: same detail/recommendation as list.  
3. Spot-check one suburb: list `map_rating` equals map colour.

### V6 — Live ingestion (US6)

1. Login as admin (`admin@playground.local` / `admin123`).  
2. `POST /api/property/ingestion/runs` for one factor group.  
3. Poll until `succeeded`; reopen suburb detail and confirm `origin: live` and updated `as_of` where applicable.  
4. Confirm rank/detail UX paths unchanged.

## Contract reference

See [contracts/property-api.md](./contracts/property-api.md) and [data-model.md](./data-model.md).

## Done when

- Seed-only demo covers filter → Top 100 → recommendation without live feeds.  
- Map and list ratings agree for identical filters.  
- Coming-soon cities show an explicit message.
