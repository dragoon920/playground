# Implementation Plan: Affordability Ranking Weight

**Branch**: `main` | **Date**: 2026-07-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-affordability-weight/spec.md`

## Summary

Extend the existing property ranking pipeline with Affordability as a fifth preference and explainable score dimension. Reuse the affordability factor already present in the Sydney seed, score its six requested indicators in the Go ranking service, extend the JSON contract and TypeScript types, and update preference controls and ranked cards to show five dimensions.

## Technical Context

**Language/Version**: Go 1.22; TypeScript 5.6; React 18

**Primary Dependencies**: Gin 1.10, MySQL driver 1.8, React, Vite, Tailwind CSS

**Storage**: MySQL 8.4 using existing `suburb_metrics` JSON factor rows; embedded JSON seed

**Testing**: Go unit tests; TypeScript compile and Vite production build; API quickstart checks

**Target Platform**: Docker-hosted web application on Windows/Linux development hosts

**Project Type**: Web application with Go API and React frontend

**Performance Goals**: Ranking latency remains effectively unchanged for the 228-suburb Sydney seed

**Constraints**: Preserve existing API clients; no new external provider; high score must consistently mean better

**Scale/Scope**: Five preference dimensions, six affordability indicators, 228 Sydney seed suburbs

## Constitution Check

The constitution file contains unresolved template placeholders and therefore defines no enforceable project gates. This plan follows the repository's established architecture, keeps the API backward compatible, uses explainable deterministic scoring, and requires end-to-end verification.

**Post-design re-check**: PASS. No new dependency, table, endpoint, or provider is introduced. Existing factor storage and rank contracts are extended minimally.

## Project Structure

### Documentation (this feature)

```text
specs/002-affordability-weight/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── property-rank-api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
backend/
├── models/property.go
├── services/property_rank_service.go
└── data/property/sydney-seed.json

frontend/src/
├── types/property.ts
├── components/property/PreferenceWeights.tsx
├── components/property/Top100List.tsx
└── pages/PropertyInvestmentPage.tsx
```

**Structure Decision**: Extend the existing backend model/ranking service and frontend property components. The affordability seed factor already exists, so no storage migration or seed generator is needed.
