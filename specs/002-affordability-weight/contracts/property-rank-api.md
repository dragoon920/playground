# Property Rank API Contract — Affordability Extension

## POST `/api/property/rank`

### Request

`weights.affordability` is optional for backward compatibility and defaults to zero when omitted.

```json
{
  "city_id": "sydney",
  "property_type": "apartment",
  "price_min": 500000,
  "price_max": 2000000,
  "weights": {
    "investment": 20,
    "lifestyle": 20,
    "risk": 20,
    "future_growth": 20,
    "affordability": 20
  },
  "limit": 100
}
```

Validation:

- Every weight must be finite and non-negative.
- At least one positive weight is preferred; all-zero input is accepted and receives equal 20% weighting.

### Response extension

Each ranked item adds affordability to both score and breakdown objects:

```json
{
  "dimension_scores": {
    "investment": 63.2,
    "lifestyle": 71.5,
    "risk": 68.4,
    "future_growth": 59.7,
    "affordability": 74.1
  },
  "dimension_breakdown": {
    "affordability": [
      {
        "label": "Median income",
        "value": "$118,000/year",
        "points": 65.3,
        "available": true
      }
    ]
  }
}
```

The affordability breakdown contains six entries in this order:

1. Median income
2. Mortgage repayment
3. Mortgage / income ratio
4. Rent / income ratio
5. Average family income
6. Disposable income

Existing response fields remain unchanged.

## Compatibility

- Existing requests without `weights.affordability` remain valid.
- `risk` continues to represent the Stability dimension.
- `future_growth` continues to represent the Growth dimension.
