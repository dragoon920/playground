# Research: Affordability Ranking Weight

## R1 — Dimension semantics

**Decision**: Add Affordability as a fifth positive 0–100 dimension where a higher score means housing costs place less pressure on household income.

**Rationale**: Positive direction matches every existing dimension and makes weighting intuitive.

**Alternatives considered**:
- “Cost pressure” where lower is better — rejected because it reverses the score semantics.
- Fold affordability into Investment — rejected because household capacity and investment return are different user intents.

## R2 — Indicator scoring

**Decision**: Score median income, average family income, and disposable income positively; score mortgage repayment, mortgage/income ratio, and rent/income ratio inversely. Normalize each against explicit Sydney-oriented bands, clamp to 0–100, and average all six contributions. Missing values score neutral 50.

**Rationale**: This reuses the existing explainable scoring model, preserves partial seed coverage, and gives every indicator visible influence.

**Alternatives considered**:
- Derive a single formula from ratios only — rejected because it hides requested indicators.
- Exclude missing indicators from the average — rejected because sparse suburbs would receive non-comparable scores.

## R3 — API compatibility

**Decision**: Add optional `affordability` fields to preference weights, dimension scores, and breakdowns. An omitted request weight decodes to zero. Keep `risk` and `future_growth` transport keys unchanged while displaying Stability and Growth in the UI.

**Rationale**: Existing JSON clients remain valid, while updated clients can opt into the fifth dimension.

**Alternatives considered**:
- Rename all transport keys — rejected as an unnecessary breaking change.
- Make affordability required — rejected because existing clients would fail validation.

## R4 — Default weighting

**Decision**: When all weights are zero, use equal 20% weights across five dimensions. Existing non-zero requests that omit affordability retain their relative four-dimension shares because the omitted fifth value is zero.

**Rationale**: This gives the new dimension an equal default while preserving explicit legacy requests.

**Alternatives considered**:
- Keep the old 25% fallback and set affordability to zero — rejected because the UI now presents five equal peer dimensions.

## R5 — Seed strategy

**Decision**: Reuse the existing `affordability` factor already present in `sydney-seed.json`. No new suburb columns or external pull are required; ranking reads the factor payload loaded into `suburb_metrics`.

**Rationale**: The seed already includes all six requested metrics and provenance. Duplicating those fields would create inconsistent sources of truth.

**Alternatives considered**:
- Add six denormalized columns to `suburbs` — rejected because affordability is not used for SQL filtering.
- Generate new synthetic affordability values — rejected because values already exist.
