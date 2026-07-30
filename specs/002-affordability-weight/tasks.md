# Tasks: Affordability Ranking Weight

**Input**: Design documents from `/specs/002-affordability-weight/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [x] T001 Document feature requirements and acceptance criteria in `specs/002-affordability-weight/spec.md`
- [x] T002 [P] Document scoring decisions in `specs/002-affordability-weight/research.md`
- [x] T003 [P] Document data and API changes in `specs/002-affordability-weight/data-model.md` and `specs/002-affordability-weight/contracts/property-rank-api.md`

---

## Phase 2: Foundational

- [x] T004 Extend shared preference, score, and breakdown models in `backend/models/property.go` and `frontend/src/types/property.ts`
- [x] T005 Confirm the embedded seed already supplies all six affordability metrics and provenance in `backend/data/property/sydney-seed.json`

---

## Phase 3: User Story 1 - Rank by Affordability (P1) 🎯 MVP

**Goal**: Let Affordability influence ranking as a fifth preference.

**Independent Test**: Set only Affordability to 100 and verify overall scores equal Affordability scores.

- [x] T006 [US1] Extend weight validation, normalization, fallback, and weighted scoring in `backend/services/property_rank_service.go`
- [x] T007 [US1] Calculate the six-indicator Affordability dimension in `backend/services/property_rank_service.go`
- [x] T008 [US1] Add Affordability to initial page preferences and API request state in `frontend/src/pages/PropertyInvestmentPage.tsx`

---

## Phase 4: User Story 2 - Understand Affordability Scores (P2)

**Goal**: Display and explain the Affordability score.

**Independent Test**: Inspect a result's Affordability tooltip and verify six contribution rows.

- [x] T009 [US2] Add Affordability control, legend, color, equal-share behavior, and help text in `frontend/src/components/property/PreferenceWeights.tsx`
- [x] T010 [US2] Add the Affordability result bar and breakdown tooltip in `frontend/src/components/property/Top100List.tsx`
- [x] T011 [US2] Forward Affordability in optional detail/map weight query serialization in `frontend/src/lib/propertyApi.ts`

---

## Phase 5: User Story 3 - Preserve Seed Provenance (P3)

**Goal**: Reuse curated affordability seed data without compromising future live data.

**Independent Test**: Confirm a suburb detail contains affordability metrics with source/date/origin and rank consumes the same payload.

- [x] T012 [US3] Verify seed loading and live-origin preservation for affordability in `backend/services/property_seed_service.go`
- [x] T013 [US3] Update the original property API/data design references for the fifth dimension in `specs/001-property-investment-tool/contracts/property-api.md` and `specs/001-property-investment-tool/data-model.md`

---

## Phase 6: Verification

- [x] T014 Run Go formatting and backend tests/build for files under `backend/`
- [x] T015 [P] Run frontend TypeScript/Vite production build under `frontend/`
- [x] T016 Run the scenarios in `specs/002-affordability-weight/quickstart.md`
- [x] T017 Mark completed tasks in `specs/002-affordability-weight/tasks.md`

## Dependencies

- T004–T005 depend on T001–T003.
- US1 depends on T004–T005.
- US2 depends on the shared models from T004 and can proceed alongside US1.
- US3 can proceed after T005.
- Verification depends on all selected user stories.

## Parallel Opportunities

- T002 and T003 are independent documentation artifacts.
- T009/T010 frontend presentation can proceed in parallel with backend T006/T007 after shared contracts are defined.
- T015 can run in parallel with backend verification once implementation is complete.

## Implementation Strategy

Deliver US1 first to establish end-to-end scoring, then US2 for explainability, then verify seed provenance and compatibility. Do not rename existing `risk` or `future_growth` transport fields.
