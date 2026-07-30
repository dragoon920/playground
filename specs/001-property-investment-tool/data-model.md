# Data Model: Property Investment Tool

**Date**: 2026-07-28  
**Feature**: `001-property-investment-tool`

## Entities

### City

| Field | Type | Notes |
|-------|------|-------|
| id | string | e.g. `sydney`, `melbourne` |
| name | string | Display name |
| coverage | enum | `full` \| `limited` \| `coming_soon` |

Static catalog in code or small table; v1: Sydney=`full`, others=`coming_soon`.

### Suburb

| Field | Type | Notes |
|-------|------|-------|
| id | string/UUID | Stable id |
| city_id | string | FK to city |
| name | string | e.g. Seven Hills |
| state | string | NSW |
| postcode | string | optional |
| median_house_price | decimal/null | Filter + Price panel |
| median_unit_price | decimal/null | |
| median_townhouse_price | decimal/null | Filter when property_type=townhouse; derived from house/unit medians when seed has no explicit value |
| median_apartment_price | decimal/null | Filter when property_type=apartment; defaults to the unit median |
| lat / lng | float/null | Map centroid fallback |
| boundary_id | string/null | GeoJSON feature id |
| created_at / updated_at | timestamp | |

**Validation**: `city_id` required; `name` unique per city.

### SuburbMetric (factor group row)

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| suburb_id | string | FK |
| factor_group | enum | see below |
| payload | JSON | Group-specific metrics; null keys = unavailable |
| source | string | Provenance label |
| as_of | date/null | Freshness |
| origin | enum | `seed` \| `live` |
| updated_at | timestamp | |

**factor_group values**: `price`, `sales`, `rental`, `affordability`, `demographics`, `crime`, `schools`, `transport`, `infrastructure`, `pipeline`, `hazards`, `walkability`, `investment_indicators`

**Validation**: Unique `(suburb_id, factor_group)`; payload schema soft-validated per group.

### PreferenceWeights (request DTO, not persisted in v1)

| Field | Type | Notes |
|-------|------|-------|
| investment | number | 0–100 |
| lifestyle | number | 0–100 |
| risk | number | 0–100 |
| future_growth | number | 0–100 |
| affordability | number | 0–100 |

**Validation**: Values are non-negative and normalized to 100; all-zero input uses equal 20% shares.

### PriceRange (request DTO)

| Field | Type | Notes |
|-------|------|-------|
| min | number | AUD ≥ 0 |
| max | number | AUD ≥ min |

### RankedSuburb (response DTO)

| Field | Type | Notes |
|-------|------|-------|
| suburb | Suburb summary | id, name, prices |
| score | number | 0–100 |
| map_rating | enum | `good_buy` \| `neutral` \| `overpriced` |
| dimension_scores | object | per weight dimension |

### Recommendation (response DTO)

| Field | Type | Notes |
|-------|------|-------|
| suburb_id | string | |
| score | number | 0–100 |
| pros | string[] | |
| cons | string[] | |
| summary | string | e.g. Excellent long term buy |
| map_rating | enum | same as list |

### IngestionRun (phase 3)

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | |
| factor_group | string | |
| provider | string | |
| status | enum | `pending` \| `running` \| `succeeded` \| `failed` |
| started_at / finished_at | timestamp | |
| message | string | error or stats |

## Relationships

```text
City 1──* Suburb 1──* SuburbMetric
Suburb 1──1 Recommendation (computed)
Suburb 1──1 RankedSuburb row (computed per request)
IngestionRun updates SuburbMetric rows
```

## Payload sketches (null = unavailable)

**price**: median_house_price, median_unit_price, median_townhouse_price, median_apartment_price, price_per_sqm, growth_1y, cagr_3y, cagr_5y, cagr_10y  

**sales**: sales_count, avg_days_on_market, auction_clearance, listings_count, monthly_trend  

**rental**: median_rent, rental_yield, vacancy_rate, rent_growth, rent_demand  

**affordability**: median_income, mortgage_repayment, mortgage_income_ratio, rent_income_ratio, avg_family_income, disposable_income  

**demographics**: population_growth, median_age, family_pct, professionals_pct, university_pct, owner_occupier_pct, investor_pct  

**crime**: violent, break_ins, car_theft, drug_offences, domestic_violence, crime_trend  

**schools**: top_schools[], naplan, atar, catchment, distance_km, ranking  

**transport**: distance_to_cbd_km, train, metro, bus, motorway, airport, walk_min, drive_min, peak_min  

**infrastructure**: items[] { type, name, status }  

**pipeline**: da_approvals, apartment_projects, house_lots, townhouses, high_density_zoning, future_supply  

**hazards**: flood, bushfire, aircraft_noise, powerlines, mine_subsidence, contaminated_land  

**walkability**: walk_score, restaurants, cafe, gym, hospital, park, beach, shopping, train  

**investment_indicators**: rental_yield, capital_growth, vacancy, cashflow, gross_return, population_growth, building_approvals, stock_on_market, owner_occupier_pct, investor_pct  

## State transitions

- SuburbMetric `origin`: seed → live (overwrite on successful ingestion)
- IngestionRun: pending → running → succeeded | failed
- Map rating: computed per request from score + price context (not stored)
