# Contract: Property Investment API

**Base path**: `/api/property`  
**Auth**: Read endpoints public. Ingestion endpoints require admin JWT.

## GET /api/property/cities

List selectable cities and coverage.

**Response 200**

```json
{
  "cities": [
    { "id": "sydney", "name": "Sydney", "coverage": "full" },
    { "id": "melbourne", "name": "Melbourne", "coverage": "coming_soon" }
  ]
}
```

## POST /api/property/rank

Rank suburbs for filters and weights.

**Request**

```json
{
  "city_id": "sydney",
  "property_type": "house",
  "price_min": 800000,
  "price_max": 1500000,
  "weights": {
    "investment": 40,
    "lifestyle": 20,
    "risk": 20,
    "future_growth": 20
  },
  "limit": 100
}
```

`property_type` is optional and accepts `house`, `townhouse`, or `apartment` (default `house`).
The price range filters on the median for the chosen type.

**Response 200**

```json
{
  "city_id": "sydney",
  "coverage": "full",
  "message": null,
  "total_matched": 86,
  "limit": 100,
  "items": [
    {
      "suburb_id": "seven-hills",
      "name": "Seven Hills",
      "median_price": 1200000,
      "median_house_price": 1200000,
      "median_unit_price": 720000,
      "median_townhouse_price": 985000,
      "median_apartment_price": 720000,
      "score": 91,
      "map_rating": "good_buy",
      "dimension_scores": {
        "investment": 88,
        "lifestyle": 75,
        "risk": 70,
        "future_growth": 92
      }
    }
  ]
}
```

**Response 200 (limited city)**

```json
{
  "city_id": "melbourne",
  "coverage": "coming_soon",
  "message": "Limited data — Greater Sydney is fully supported in v1.",
  "total_matched": 0,
  "limit": 100,
  "items": []
}
```

**Errors**: 400 if `price_min` > `price_max`, `property_type` is not a known type, or weights invalid after normalization attempt.

## GET /api/property/suburbs/:id

Suburb summary + all factor groups + recommendation for optional weights query.

**Query**: `investment`, `lifestyle`, `risk`, `future_growth` (optional; default equal weights)

**Response 200**

```json
{
  "suburb": {
    "id": "seven-hills",
    "city_id": "sydney",
    "name": "Seven Hills",
    "state": "NSW",
    "median_house_price": 1200000,
    "median_unit_price": 750000,
    "lat": -33.775,
    "lng": 150.936
  },
  "recommendation": {
    "score": 91,
    "pros": ["Metro", "Population growth", "Low vacancy"],
    "cons": ["Some crime", "Older housing"],
    "summary": "Excellent long term buy.",
    "map_rating": "good_buy"
  },
  "factors": [
    {
      "factor_group": "price",
      "source": "NSW Valuer General sales data",
      "as_of": "2025-06-01",
      "origin": "seed",
      "metrics": {
        "median_house_price": 1200000,
        "median_unit_price": 750000,
        "price_per_sqm": 8500,
        "growth_1y": 0.04,
        "cagr_3y": 0.05,
        "cagr_5y": 0.06,
        "cagr_10y": 0.07
      }
    }
  ]
}
```

Missing metric keys are omitted or returned as `null`; UI treats both as unavailable.

**Errors**: 404 if suburb unknown.

## GET /api/property/map

Suburb ratings for map colouring under same filters as rank.

**Query**: `city_id`, `price_min`, `price_max`, weight params

**Response 200**

```json
{
  "city_id": "sydney",
  "features": [
    {
      "suburb_id": "seven-hills",
      "name": "Seven Hills",
      "map_rating": "good_buy",
      "score": 91,
      "in_price_range": true
    }
  ]
}
```

List and map MUST use the same rating rules for identical inputs.

## POST /api/property/ingestion/runs (admin)

Trigger a live pull for one factor group / provider.

**Request**

```json
{
  "factor_group": "demographics",
  "provider": "abs_census"
}
```

**Response 202**

```json
{
  "id": 12,
  "status": "pending",
  "factor_group": "demographics",
  "provider": "abs_census"
}
```

## GET /api/property/ingestion/runs/:id (admin)

Poll run status.

**Response 200**

```json
{
  "id": 12,
  "status": "succeeded",
  "factor_group": "demographics",
  "provider": "abs_census",
  "message": "updated 412 suburbs",
  "started_at": "2026-07-28T04:00:00Z",
  "finished_at": "2026-07-28T04:02:11Z"
}
```

## Consistency rules

1. `map_rating` values: `good_buy` | `neutral` | `overpriced` (UI: green / yellow / red).
2. Weights normalized server-side if sum within tolerance; otherwise 400.
3. `limit` defaults to 100, max 100 for Top 100 contract.
4. Seed and live data share this contract; clients do not change paths when origin flips.
