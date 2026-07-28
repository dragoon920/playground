# Research: Property Investment Tool

**Date**: 2026-07-28  
**Feature**: `001-property-investment-tool`

## R1 — Scoring and “AI” recommendation

**Decision**: Use deterministic, explainable scoring for v1. Compute dimension scores (Investment, Lifestyle, Risk, Future Growth) from normalized suburb metrics, combine with user weights into Investment Score 0–100, then generate Pros/Cons/summary from thresholded signals (rule templates). Optional LLM polish is deferred.

**Rationale**: Spec requires Pros/Cons users can trust; seed data must work offline; playground has no LLM dependency today.

**Alternatives considered**:
- LLM-only narrative — rejected for v1 (cost, opacity, needs API keys)
- Pure ML ranking — rejected (no labeled training set yet)

## R2 — Map stack

**Decision**: Leaflet in the React app with a simplified Greater Sydney suburb GeoJSON asset. Colour by Good Buy / Neutral / Overpriced from the same rating function used by the list.

**Rationale**: No API key for basic tiles/GeoJSON; fits seed-first demo; click → suburb detail is straightforward.

**Alternatives considered**:
- Mapbox/Google Maps — richer but keys and cost
- Server-rendered map images — poor interactivity

## R3 — Seed data strategy

**Decision**: Curate a JSON seed file of ≥100 Greater Sydney suburbs with partial-to-full factor metrics and provenance labels. Load into MySQL on startup/migrate (idempotent upsert). Mark null metrics as unavailable in API responses. Public open datasets (ABS summaries, BOCSAR aggregates, planning portals) inform curated values; exact scrape automation is US6.

**Rationale**: Unblocks UI and ranking immediately; matches FR-022/SC-007.

**Alternatives considered**:
- Frontend-only mock JSON — rejected (duplication; ranking belongs on API for map/list consistency)
- Live APIs first — rejected (spec phase order)

## R4 — Weight controls summing to 100%

**Decision**: Four linked sliders; adjusting one redistributes remainder across others (or locks last free weight). API also normalizes weights if sum ≠ 100.

**Rationale**: Prevents invalid states; matches edge-case requirement.

**Alternatives considered**: Free-form four numbers with submit-time error — worse UX.

## R5 — Storage shape for 13 factor groups

**Decision**: `suburbs` table for identity/geo/price summary; `suburb_metrics` table with `factor_group` + JSON `payload` + `source` + `as_of` + `origin` (`seed`|`live`). Ranking reads denormalized summary columns on `suburbs` for speed and pulls full JSON on detail.

**Rationale**: Flexible for sparse factors; easy live overwrite per group; avoids 100+ rigid columns on day one.

**Alternatives considered**:
- One wide table — brittle as metrics evolve
- Document DB — outside current MySQL stack

## R6 — Live ingestion (phase 3)

**Decision**: Admin-triggered (and later scheduled) ingestion jobs per provider/factor group writing into the same metric rows with `origin=live` and freshness timestamps. Start with one open NSW/ABS-style source; commercial Domain/REA keys optional behind env config.

**Rationale**: Spec allows incremental providers; UX contract unchanged.

**Alternatives considered**: Fully automated multi-provider sync on day one — too large for first live milestone.

## R7 — Multi-city selector

**Decision**: API returns city catalog with `coverage: full | limited | coming_soon`. Only `sydney` is `full` in v1; selecting others returns empty/limited list plus message.

**Rationale**: Matches FR-027/SC-009 without blocking city UX.

## R8 — Auth

**Decision**: All property read endpoints public. Ingestion trigger endpoints admin-only (reuse existing JWT admin middleware).

**Rationale**: Spec FR-028; aligns with existing `/api/items` public pattern and admin jobs.
