# Feature Specification: Affordability Ranking Weight

**Feature Branch**: `main`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "Add Affordability as a ranking preference using median income, mortgage repayment, mortgage/income ratio, rent/income ratio, average family income, and disposable income; update the design, UI, API, and seed data."

## User Scenarios & Testing

### User Story 1 - Rank by Affordability (Priority: P1)

As a property investor, I can give Affordability a share of my ranking preferences so suburbs that place less pressure on household income rank more highly.

**Why this priority**: Affordability is the core requested capability and directly changes the ranked results.

**Independent Test**: Set Affordability to 100% and all other preferences to 0%, then confirm suburbs are ordered by their affordability score and the request still returns matching suburbs.

**Acceptance Scenarios**:

1. **Given** suburbs with affordability data, **When** Affordability is weighted more heavily, **Then** suburbs with stronger affordability indicators receive more influence in the overall ranking.
2. **Given** Affordability is set to 100%, **When** rankings are calculated, **Then** the overall score is determined solely by the affordability dimension.
3. **Given** all preference weights are zero, **When** rankings are calculated, **Then** all five dimensions receive equal 20% weighting.

---

### User Story 2 - Understand Affordability Scores (Priority: P2)

As a user reviewing ranked suburbs, I can see the Affordability score and inspect the indicators behind it so I understand why the suburb received that score.

**Why this priority**: A new ranking dimension must remain explainable and avoid presenting an opaque score.

**Independent Test**: Hover or focus the Affordability score for a ranked suburb and verify all available affordability contributions, values, and points are shown.

**Acceptance Scenarios**:

1. **Given** a ranked suburb, **When** the ranking list is displayed, **Then** an Affordability dimension score from 0 to 100 appears alongside Investment, Lifestyle, Stability, and Growth.
2. **Given** affordability metrics are available, **When** the user opens the score explanation, **Then** median income, mortgage repayment, mortgage/income ratio, rent/income ratio, average family income, and disposable income are shown with their scoring contributions.
3. **Given** an affordability metric is unavailable, **When** the explanation is viewed, **Then** it is identified as unavailable and contributes a neutral score rather than excluding the suburb.

---

### User Story 3 - Preserve Affordability Seed Provenance (Priority: P3)

As a product operator, I can seed affordability values with source and freshness information so the dimension works offline and users can distinguish curated seed data from future live data.

**Why this priority**: Seed-only operation is required until provider ingestion is implemented.

**Independent Test**: Start the product without live feeds and verify each seeded suburb can expose an affordability factor with source, date, origin, and the supported metrics.

**Acceptance Scenarios**:

1. **Given** the curated Sydney seed, **When** it is loaded, **Then** affordability metrics are available to ranking and detail responses.
2. **Given** a seeded affordability factor, **When** its provenance is inspected, **Then** it identifies its declared source, snapshot date, and seed origin.
3. **Given** future live affordability data exists, **When** seed loading runs again, **Then** seed data does not overwrite the live factor.

### Edge Cases

- Negative, non-finite, or otherwise malformed preference weights are rejected.
- Missing affordability metrics score neutrally and remain visible as unavailable.
- Ratios may be represented as decimal fractions or percentages in source data; seed values use decimal fractions consistently.
- Larger mortgage repayment and income-burden ratios reduce affordability, while larger incomes and disposable income increase it.
- The existing `risk` and `future_growth` transport keys remain compatible even though their user-facing labels are Stability and Growth.

## Requirements

### Functional Requirements

- **FR-001**: Users MUST be able to assign a non-negative Affordability preference weight alongside Investment, Lifestyle, Stability, and Growth.
- **FR-002**: The five preference weights MUST be normalized to shares totalling 100%.
- **FR-003**: When all five weights are zero, the system MUST apply an equal 20% share to each dimension.
- **FR-004**: The system MUST calculate an Affordability score from median income, mortgage repayment, mortgage/income ratio, rent/income ratio, average family income, and disposable income.
- **FR-005**: Higher income and disposable-income values MUST improve Affordability, while higher repayment and income-burden values MUST reduce it.
- **FR-006**: Missing Affordability indicators MUST receive neutral contribution points and MUST NOT exclude a suburb from ranking.
- **FR-007**: Ranking responses MUST expose the Affordability dimension score and its explainable contribution breakdown.
- **FR-008**: The ranking interface MUST display Affordability as a selectable preference and as a scored dimension in results.
- **FR-009**: The curated Sydney seed MUST include affordability factor data with source, snapshot date, and seed origin for supported suburbs.
- **FR-010**: Existing clients that omit the Affordability weight MUST continue to receive valid rankings.
- **FR-011**: Existing transport keys for Stability and Growth MUST remain unchanged for backward compatibility.
- **FR-012**: Seed loading MUST preserve any corresponding affordability factor already marked as live data.

### Key Entities

- **Preference Weights**: User-selected relative importance for Investment, Lifestyle, Stability, Growth, and Affordability.
- **Dimension Scores**: Normalized 0–100 scores for each ranking dimension, including Affordability.
- **Affordability Factor**: A suburb-level set of income and housing-cost indicators with source, snapshot date, and origin.
- **Score Contribution**: One affordability indicator's display label, formatted value, points, and availability state.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can set Affordability to any share from 0% to 100%, and the displayed five shares always total 100%.
- **SC-002**: Setting Affordability to 100% orders every returned suburb solely from its Affordability dimension, with ties resolved consistently.
- **SC-003**: Every ranked suburb exposes an Affordability score and six explainable indicator entries, with missing entries clearly marked unavailable.
- **SC-004**: At least 90% of Sydney seed suburbs contain at least one available affordability indicator.
- **SC-005**: Existing ranking requests without an Affordability field continue to complete successfully.
- **SC-006**: Users can identify in under 10 seconds whether a higher Affordability score represents a better or worse outcome.

## Assumptions

- Affordability is a fifth independent ranking dimension rather than a replacement for Investment.
- A high Affordability score is always better.
- The existing affordability values in the Sydney seed are curated snapshot values and are not fetched live.
- The existing API field names `risk` and `future_growth` remain unchanged; only their UI labels are Stability and Growth.
- No new external data provider or automated ingestion job is included in this feature.
