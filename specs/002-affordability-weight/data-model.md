# Data Model: Affordability Ranking Weight

## PreferenceWeights

Five non-negative numeric values representing relative ranking importance.

| Field | Meaning | Validation |
|---|---|---|
| investment | Return and cashflow preference | Finite, ≥ 0 |
| lifestyle | Liveability preference | Finite, ≥ 0 |
| risk | Stability preference (legacy transport name) | Finite, ≥ 0 |
| future_growth | Growth preference (legacy transport name) | Finite, ≥ 0 |
| affordability | Household affordability preference | Finite, ≥ 0 |

Normalization scales non-zero values to a total of 100. An all-zero set becomes five equal shares of 20.

## DimensionScores

| Field | Range | Direction |
|---|---:|---|
| investment | 0–100 | Higher is better |
| lifestyle | 0–100 | Higher is better |
| risk | 0–100 | Higher Stability is better |
| future_growth | 0–100 | Higher Growth is better |
| affordability | 0–100 | Higher Affordability is better |

## Affordability Factor

Stored as the existing `affordability` factor payload for each suburb.

| Metric | Unit | Score direction |
|---|---|---|
| median_income | AUD/year | Higher improves score |
| mortgage_repayment | AUD/month | Higher reduces score |
| mortgage_income_ratio | Decimal fraction | Higher reduces score |
| rent_income_ratio | Decimal fraction | Higher reduces score |
| avg_family_income | AUD/year | Higher improves score |
| disposable_income | AUD/year | Higher improves score |

The factor retains `source`, `as_of`, and `origin` provenance fields. Missing metrics remain absent or null and receive a neutral score contribution.

## DimensionBreakdown

Adds an `affordability` collection containing exactly six score contributions. Each contribution has:

- label
- formatted value
- points from 0 to 100
- availability flag

## Relationships

- One ranking request has one set of preference weights.
- One ranked suburb has one set of dimension scores and one breakdown.
- One suburb has at most one current `affordability` factor row.
- Seed and live affordability factors share the same payload shape; live origin is preserved during seed upsert.
