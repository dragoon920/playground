---
description: "Task list for Property Investment Tool implementation"
---

# Tasks: Property Investment Tool

**Input**: Design documents from `/specs/001-property-investment-tool/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in the feature specification — omit dedicated test tasks; validate via [quickstart.md](./quickstart.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app: `backend/`, `frontend/src/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature module scaffolding in the existing playground

- [x] T001 Create property domain folders `backend/data/property/` and `frontend/src/components/property/`
- [x] T002 [P] Add TypeScript types for cities, suburbs, factors, rank, recommendation in `frontend/src/types/property.ts`
- [x] T003 [P] Add property API client helpers in `frontend/src/lib/propertyApi.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schema, models, routes, and page shell before any user story UI

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Extend MySQL migrate with `suburbs`, `suburb_metrics`, and `property_ingestion_runs` tables in `backend/database/database.go`
- [x] T005 [P] Add Go models for Suburb, SuburbMetric, RankRequest, RankedSuburb, Recommendation, City, IngestionRun in `backend/models/property.go`
- [x] T006 [P] Add city catalog helper (`sydney` full; other metros coming_soon) in `backend/services/property_city_service.go`
- [x] T007 Create `PropertyService` stub (load suburb by id, list by city) in `backend/services/property_service.go`
- [x] T008 Create `PropertyController` stub and wire public `/api/property/*` routes in `backend/controllers/property_controller.go` and `backend/routes/routes.go`
- [x] T009 Expand `frontend/src/pages/PropertyInvestmentPage.tsx` into a layout shell (filters area, list area, detail/map area) using existing styles from `frontend/src/lib/styles.ts`

**Checkpoint**: Foundation ready — `GET /api/property/cities` returns catalog; page shell renders at `/property-investment`

---

## Phase 3: User Story 1 - Seed Suburb Dataset (Priority: P1) 🎯 MVP

**Goal**: Curated Greater Sydney seed metrics load into MySQL and are readable via API without live feeds

**Independent Test**: Rank/detail endpoints return seed suburbs with factor provenance; missing metrics are null/omitted

### Implementation for User Story 1

- [x] T010 [US1] Author seed JSON (≥100 Greater Sydney suburbs, factor payloads + sources) in `backend/data/property/sydney-seed.json`
- [x] T011 [US1] Implement idempotent seed loader upserting suburbs and metrics in `backend/services/property_seed_service.go`
- [x] T012 [US1] Invoke seed loader on startup/migrate from `backend/main.go` or `backend/database/database.go`
- [x] T013 [US1] Implement `GET /api/property/suburbs/:id` returning suburb + factors with `origin`/`source`/`as_of` in `backend/controllers/property_controller.go` and `backend/services/property_service.go`
- [x] T014 [US1] Verify seed via curl against `GET /api/property/cities` and `GET /api/property/suburbs/:id` per `specs/001-property-investment-tool/quickstart.md`

**Checkpoint**: Seed-only suburb detail works with provenance labels

---

## Phase 4: User Story 2 - Filter, Weight, and Top 100 List (Priority: P1)

**Goal**: City, price range, and preference weights produce a ranked Top 100 list

**Independent Test**: Changing filters/weights updates list; non-Sydney cities show coming-soon message

### Implementation for User Story 2

- [x] T015 [US2] Implement weight normalization and dimension scoring + Top 100 rank in `backend/services/property_rank_service.go`
- [x] T016 [US2] Implement `POST /api/property/rank` in `backend/controllers/property_controller.go`
- [x] T017 [P] [US2] Build `CitySelect` in `frontend/src/components/property/CitySelect.tsx`
- [x] T018 [P] [US2] Build `PriceRangeSlider` in `frontend/src/components/property/PriceRangeSlider.tsx`
- [x] T019 [P] [US2] Build `PreferenceWeights` (four controls summing to 100%) in `frontend/src/components/property/PreferenceWeights.tsx`
- [x] T020 [US2] Build `Top100List` and wire filters → `POST /api/property/rank` in `frontend/src/components/property/Top100List.tsx` and `frontend/src/pages/PropertyInvestmentPage.tsx`
- [x] T021 [US2] Show limited/coming-soon messaging when `coverage` is not `full` in `frontend/src/pages/PropertyInvestmentPage.tsx`

**Checkpoint**: Filter → Top 100 journey works on seed data

---

## Phase 5: User Story 3 - Suburb Detail and AI Recommendation (Priority: P1)

**Goal**: Homepage-style recommendation card with score, Pros, Cons, summary

**Independent Test**: Opening a ranked suburb shows score /100, Pros/Cons, and recommendation text

### Implementation for User Story 3

- [ ] T022 [US3] Implement rule-based Pros/Cons/summary generator in `backend/services/property_recommendation_service.go`
- [ ] T023 [US3] Include `recommendation` on `GET /api/property/suburbs/:id` (honour weight query params) in `backend/controllers/property_controller.go`
- [ ] T024 [US3] Build `RecommendationCard` in `frontend/src/components/property/RecommendationCard.tsx`
- [ ] T025 [US3] Wire list selection to load suburb detail + recommendation in `frontend/src/pages/PropertyInvestmentPage.tsx`

**Checkpoint**: Recommendation card matches Seven Hills–style UX on seed suburbs

---

## Phase 6: User Story 4 - Factor Detail Panels (Priority: P2)

**Goal**: All 13 factor panels with metrics and source attribution

**Independent Test**: Suburb detail shows each factor group; unavailable metrics labeled clearly

### Implementation for User Story 4

- [ ] T026 [US4] Build reusable factor panel UI (source, as_of, unavailable states) in `frontend/src/components/property/FactorPanels.tsx`
- [ ] T027 [P] [US4] Map Price, Sales, Rental, Affordability metric fields in `frontend/src/components/property/FactorPanels.tsx`
- [ ] T028 [P] [US4] Map Demographics, Crime, Schools, Transport metric fields in `frontend/src/components/property/FactorPanels.tsx`
- [ ] T029 [P] [US4] Map Future Infrastructure, Development Pipeline, Hazards, Walkability, Investment Indicators in `frontend/src/components/property/FactorPanels.tsx`
- [ ] T030 [US4] Render `FactorPanels` on suburb detail in `frontend/src/pages/PropertyInvestmentPage.tsx`

**Checkpoint**: Full factor diligence view works on seed data

---

## Phase 7: User Story 5 - Interactive Suburb Map (Priority: P2)

**Goal**: Colour suburbs Good Buy / Neutral / Overpriced; click opens detail

**Independent Test**: Map colours match list ratings; click opens same recommendation/detail

### Implementation for User Story 5

- [ ] T031 [US5] Add Leaflet dependency and map styles in `frontend/package.json` / `frontend/src/main.tsx` (or page-level import)
- [ ] T032 [US5] Add simplified Greater Sydney GeoJSON in `frontend/public/geo/sydney-suburbs.geojson`
- [ ] T033 [US5] Implement `GET /api/property/map` using same rating rules as rank in `backend/services/property_rank_service.go` and `backend/controllers/property_controller.go`
- [ ] T034 [US5] Build `SuburbMap` (green/yellow/red, click → suburb id) in `frontend/src/components/property/SuburbMap.tsx`
- [ ] T035 [US5] Sync map filters with list filters and selection state in `frontend/src/pages/PropertyInvestmentPage.tsx`

**Checkpoint**: Map and list ratings agree for identical filters

---

## Phase 8: User Story 6 - Live Data Ingestion (Priority: P3)

**Goal**: Admin-triggered pull updates metrics without changing user journeys

**Independent Test**: Run one ingestion; suburb detail shows `origin: live` and fresher `as_of` where updated

### Implementation for User Story 6

- [ ] T036 [US6] Implement ingestion run persistence and status updates in `backend/services/property_ingestion_service.go`
- [ ] T037 [US6] Add first provider adapter (open ABS/NSW-style demographics or price source) in `backend/services/property_providers/`
- [ ] T038 [US6] Implement admin `POST /api/property/ingestion/runs` and `GET /api/property/ingestion/runs/:id` in `backend/controllers/property_controller.go` and `backend/routes/routes.go`
- [ ] T039 [US6] Upsert live metrics into `suburb_metrics` with `origin=live` without breaking seed fallbacks in `backend/services/property_ingestion_service.go`
- [ ] T040 [US6] Optional admin UI trigger or document curl flow in `specs/001-property-investment-tool/quickstart.md` and verify rank/detail UX unchanged

**Checkpoint**: Live refresh improves data; UX contract unchanged

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Consistency, empty states, and quickstart validation

- [ ] T041 [P] Ensure unavailable metrics never render as fake numbers across `frontend/src/components/property/FactorPanels.tsx`
- [ ] T042 [P] Align list vs map `map_rating` edge cases (out of price range de-emphasised) in `backend/services/property_rank_service.go`
- [ ] T043 Run full validation scenarios in `specs/001-property-investment-tool/quickstart.md` and fix gaps
- [ ] T044 [P] Update root `README.md` with Property Investment Tool route and public API summary

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — seed unblocks ranking/UI
- **US2 (Phase 4)**: Depends on US1 seed data
- **US3 (Phase 5)**: Depends on US1 (detail) and benefits from US2 (selection)
- **US4 (Phase 6)**: Depends on US1 detail payload; UI can parallel US3 after detail API exists
- **US5 (Phase 7)**: Depends on US2 ranking rules; parallelizable with US4 after rank service exists
- **US6 (Phase 8)**: Depends on US1 schema; should follow UI stories so UX is stable
- **Polish (Phase 9)**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — MVP data
- **US2 (P1)**: After US1
- **US3 (P1)**: After US1; integrate with US2 selection
- **US4 (P2)**: After US1 detail API
- **US5 (P2)**: After US2 ranking/map_rating
- **US6 (P3)**: After schema + preferably after US2–US5 UX

### Parallel Opportunities

- T002/T003 in Setup
- T005/T006 in Foundational
- T017/T018/T019 filter controls in US2
- T027/T028/T029 factor field mappings in US4
- US4 UI and US5 map can proceed in parallel after rank + detail APIs exist

---

## Parallel Example: User Story 2

```bash
# Filter controls in parallel:
Task: "Build CitySelect in frontend/src/components/property/CitySelect.tsx"
Task: "Build PriceRangeSlider in frontend/src/components/property/PriceRangeSlider.tsx"
Task: "Build PreferenceWeights in frontend/src/components/property/PreferenceWeights.tsx"
```

---

## Parallel Example: User Story 4

```bash
# Factor field groups in parallel (same file sequentially if conflicting; prefer split helpers):
Task: "Map Price/Sales/Rental/Affordability in FactorPanels.tsx"
Task: "Map Demographics/Crime/Schools/Transport in FactorPanels.tsx"
Task: "Map Infrastructure/Pipeline/Hazards/Walkability/Indicators in FactorPanels.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Complete Setup + Foundational  
2. Complete US1 seed  
3. Complete US2 Top 100 filters  
4. Complete US3 recommendation card  
5. **STOP and VALIDATE** quickstart V1–V3  

### Incremental Delivery

1. US4 factor panels → diligence depth  
2. US5 map → spatial exploration  
3. US6 live ingestion → freshness  
4. Polish + README  

### Suggested MVP scope

Seed + filters/Top 100 + recommendation card (Phases 1–5 / T001–T025)

---

## Notes

- [P] tasks = different files, no incomplete-task dependencies
- [Story] labels map to spec user stories US1–US6
- Commit after each task or logical group
- Stop at checkpoints to validate independently
- Do not invent live facts in the UI for null metrics
