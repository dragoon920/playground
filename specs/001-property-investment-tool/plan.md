# Implementation Plan: Property Investment Tool

**Branch**: `001-property-investment-tool` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-property-investment-tool/spec.md`

## Summary

Build a public Property Investment Tool in the existing Go + React playground: seed Greater Sydney suburb metrics, filter by city/price and preference weights (Investment / Lifestyle / Risk / Future Growth), rank Top 100, show an explainable recommendation card and factor panels, colour suburbs on an interactive map, then add incremental live data ingestion. v1 uses curated seed data and rule-based scoring/recommendations so the full UX ships before live provider integrations.

## Technical Context

**Language/Version**: Go 1.22+ (backend), TypeScript 5.x / React 18 (frontend)

**Primary Dependencies**: Gin (API), MySQL driver, React Router, Tailwind CSS 4, Leaflet + suburb GeoJSON (map)

**Storage**: MySQL 8.4 — suburbs, metrics (JSON factor groups), provenance; seed JSON/SQL loaders for bootstrap

**Testing**: Go `testing` for ranking/recommendation unit tests; manual quickstart validation for UI journeys (no frontend test harness in repo today)

**Target Platform**: Web app via Docker Compose (localhost:5173 frontend, :8080 API)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Ranked Top 100 refresh within 3 seconds of filter/weight change; discovery-to-list under 1 minute for new users

**Constraints**: Public browse without auth; missing metrics show unavailable; Greater Sydney complete in v1; other AU cities limited/coming-soon; AUD prices

**Scale/Scope**: ~100–700 Greater Sydney suburbs in seed; 13 factor groups + recommendation; 5 city options in selector; 3 delivery phases (seed → UI → live pull)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution template is not yet customized. Gates applied from playground conventions and the feature spec:

| Gate | Status |
|------|--------|
| Extend existing Go/React/MySQL stack (no new service) | PASS |
| Public read APIs for property tool (no login required) | PASS |
| Seed-first then live ingestion (phased) | PASS |
| Explainable recommendation (no opaque black-box required for v1) | PASS |
| Keep UI and API contracts stable when swapping seed → live | PASS |

**Post-design re-check**: PASS — contracts stay public REST; seed and live share the same suburb/metric schema; map/list share one rating service.

## Project Structure

### Documentation (this feature)

```text
specs/001-property-investment-tool/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── property-api.md
├── checklists/
│   └── requirements.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── controllers/          # property_controller.go
├── services/             # ranking, recommendation, seed, ingestion
├── models/               # suburb, metrics, rank request/response
├── database/             # Migrate() tables + seed load hook
├── data/                 # seed JSON (optional) or loaded via service
└── routes/               # wire public /api/property/* routes

frontend/
├── src/
│   ├── pages/
│   │   └── PropertyInvestmentPage.tsx
│   ├── components/property/
│   │   ├── CitySelect.tsx
│   │   ├── PriceRangeSlider.tsx
│   │   ├── PreferenceWeights.tsx
│   │   ├── Top100List.tsx
│   │   ├── RecommendationCard.tsx
│   │   ├── FactorPanels.tsx
│   │   └── SuburbMap.tsx
│   ├── types/property.ts
│   └── lib/propertyApi.ts
└── public/geo/           # sydney-suburbs.geojson (simplified)

mysql/
└── init.sql              # optional static seed; prefer Migrate + seed job
```

**Structure Decision**: Extend the existing web app (`backend/` + `frontend/`). Property domain code lives in new controllers/services/models and a `components/property/` UI module behind the existing `/property-investment` route.

## Complexity Tracking

> No constitution violations requiring justification.
