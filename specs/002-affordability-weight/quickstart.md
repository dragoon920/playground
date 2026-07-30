# Quickstart: Validate Affordability Ranking

## Prerequisites

- MySQL and the application services are running.
- The API has been rebuilt after the feature changes so the embedded seed and backend code are current.

## 1. Verify equal five-way defaults

Submit a Sydney rank request with all five weights set to zero.

Expected:

- Request succeeds.
- Results include `dimension_scores.affordability`.
- The effective fallback treats every dimension as 20%.

## 2. Verify 100% Affordability

Submit a rank request with Affordability at 100 and all other weights at zero.

Expected:

- Overall scores and ordering are determined only by Affordability.
- Ordering follows Affordability from highest to lowest, with consistent tie-breaking.
- The breakdown contains six entries.

## 3. Verify legacy compatibility

Repeat the request without the `affordability` field.

Expected:

- Request succeeds.
- Existing four weights retain their relative influence.
- Affordability appears in the response but contributes zero request weight.

## 4. Verify the UI

Open the Property Investment Tool.

Expected:

- Preference controls show Investment, Lifestyle, Stability, Growth, and Affordability.
- Their displayed shares total 100%.
- Ranked result cards show all five dimension bars.
- Hovering or focusing Affordability shows six indicator contributions and clearly marks unavailable values.

## 5. Verify seed provenance

Open a Sydney suburb detail response and locate the `affordability` factor.

Expected:

- The factor exposes the requested metrics.
- It includes a source label, snapshot date, and `origin: "seed"`.
