# Feature Specification: Property Investment Tool

**Feature Branch**: `001-property-investment-tool`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Build a Property Investment Tool page with price-range slider, AU big-city select, and percentage controls for Investment, Lifestyle, Risk, and Future Growth; show Top 100 suburbs with factor panels (Price, Sales Activity, Rental, Affordability, Demographics, Crime, Schools, Transport, Future Infrastructure, Development Pipeline, Flood/Bushfire/Noise, Walkability, Investment Indicators), AI recommendation card, and interactive colour-coded map. Deliver in stages: seed data from the web, build the product on seed data, then focus on live data pulling."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seed Suburb Dataset (Priority: P1)

As a product team, we need a curated seed dataset of Greater Sydney suburbs covering the agreed factor groups so the tool can be demonstrated and developed without waiting on live external feeds.

**Why this priority**: Without suburb metrics, ranking, detail panels, recommendations, and the map cannot deliver value. Seed data unblocks every later story.

**Independent Test**: Load the seed dataset and verify that a representative set of Sydney suburbs each has enough metrics to produce a ranked list, a recommendation card, and at least partial factor panels.

**Acceptance Scenarios**:

1. **Given** no live external feeds are connected, **When** the tool starts, **Then** suburb metrics are available from the seed dataset for Greater Sydney.
2. **Given** the seed dataset, **When** a suburb is inspected, **Then** metrics are grouped into the defined factor categories and missing values are explicitly marked unavailable rather than inventing figures in the product UI.
3. **Given** the seed dataset, **When** provenance is viewed for a factor group, **Then** the declared business source for that group is shown (for example NSW Valuer General for Price, ABS Census for Demographics).

---

### User Story 2 - Filter, Weight, and Top 100 List (Priority: P1)

A property investor opens the Property Investment Tool, chooses a major Australian city, sets a price range, and adjusts percentage weights for Investment, Lifestyle, Risk, and Future Growth. The tool returns a ranked Top 100 suburb list matching those preferences.

**Why this priority**: This is the primary discovery journey and the minimum usable product once seed data exists.

**Independent Test**: With seed data loaded, change city, price range, and weights and confirm the Top 100 list updates and reflects the new constraints and ranking.

**Acceptance Scenarios**:

1. **Given** the tool is open, **When** the user selects a major Australian city, **Then** suburb results are scoped to that city (Greater Sydney fully populated in v1; other cities may show limited or coming-soon coverage).
2. **Given** a selected city, **When** the user sets a price range via the slider, **Then** only suburbs within that range appear in the ranked results.
3. **Given** Investment, Lifestyle, Risk, and Future Growth weights, **When** the weights are adjusted, **Then** they remain percentages that sum to 100% and the Top 100 ranking recalculates accordingly.
4. **Given** valid filters and weights, **When** results are shown, **Then** the user sees up to 100 suburbs ordered by the weighted investment score, including enough summary information to compare them.

---

### User Story 3 - Suburb Detail and AI Recommendation (Priority: P1)

An investor selects a suburb (for example from the Top 100) and sees a homepage-style recommendation: Investment Score out of 100, Pros, Cons, and a plain-language recommendation such as “Excellent long term buy.”

**Why this priority**: The recommendation card is the decision summary users need after discovery and is specified as the homepage centrepiece.

**Independent Test**: Open any suburb that has seed metrics and verify score, pros, cons, and recommendation text are present and consistent with that suburb’s metrics.

**Acceptance Scenarios**:

1. **Given** a ranked suburb, **When** the user opens it, **Then** they see suburb name, Investment Score /100, Pros, Cons, and a short recommendation statement.
2. **Given** suburb metrics that include favourable and unfavourable signals, **When** the recommendation is generated, **Then** Pros and Cons reflect those signals in plain language (for example Metro access, population growth, vacancy, crime, older housing).
3. **Given** incomplete metrics for a suburb, **When** the recommendation is shown, **Then** the card still renders with score and narrative based on available signals, without presenting missing data as facts.

---

### User Story 4 - Factor Detail Panels (Priority: P2)

An investor reviewing a suburb expands or views detailed factor panels covering Price, Sales Activity, Rental, Affordability, Demographics, Crime, Schools, Transport, Future Infrastructure, Development Pipeline, Flood/Bushfire/Noise hazards, Walkability, and Investment Indicators, each with the metrics and source attribution defined for that group.

**Why this priority**: Deep factor visibility builds trust and supports due diligence after the ranking and recommendation MVP.

**Independent Test**: Open a suburb detail view and walk through each factor panel, confirming listed metrics and source labels appear when data exists.

**Acceptance Scenarios**:

1. **Given** a selected suburb, **When** the user views Price, **Then** they can see median house price, median unit price, price per sqm, and 1/3/5/10-year growth figures when available, with NSW Valuer General (or equivalent declared source) attributed.
2. **Given** a selected suburb, **When** the user views Sales Activity, **Then** they can see number of sales, average days on market, auction clearance, number of listings, and monthly trend when available, with Domain / REA / SQM Research attributed as applicable.
3. **Given** a selected suburb, **When** the user views Rental, **Then** they can see median rent, rental yield, vacancy rate, rent growth, and rent demand when available, with NSW Rental Bond / SQM Research / ABS rental sources attributed as applicable.
4. **Given** a selected suburb, **When** the user views Affordability, **Then** they can see median income, mortgage repayment, mortgage/income ratio, rent/income ratio, average family income, and disposable income when available, with ABS Census attributed.
5. **Given** a selected suburb, **When** the user views Demographics, **Then** they can see population growth, median age, family %, professionals %, university %, owner-occupier %, and investor % when available, with ABS Census attributed.
6. **Given** a selected suburb, **When** the user views Crime, **Then** they can see violent crime, break-ins, car theft, drug offences, domestic violence, and crime trend when available, with NSW BOCSAR attributed.
7. **Given** a selected suburb, **When** the user views Schools, **Then** they can see top schools, NAPLAN, ATAR, catchment, distance, and ranking when available, with NSW Education / MySchool attributed.
8. **Given** a selected suburb, **When** the user views Transport, **Then** they can see distance to CBD, train/metro/bus/motorway/airport access, map context, and walking/driving/peak-hour times when available.
9. **Given** a selected suburb, **When** the user views Future Infrastructure, **Then** they can see planned or announced metro, hospitals, schools, shopping centres, roads, business parks, rezoning, industrial precincts, and employment hubs when available, with NSW Planning Portal / Infrastructure NSW attributed.
10. **Given** a selected suburb, **When** the user views Development Pipeline, **Then** they can see DA approvals, apartment projects, house lots, townhouses, high-density zoning, and future supply when available, with NSW Planning Portal attributed.
11. **Given** a selected suburb, **When** the user views Flood / Bushfire / Noise hazards, **Then** they can see flood, bushfire, aircraft noise, powerlines, mine subsidence, and contaminated land indicators when available, with NSW spatial datasets attributed.
12. **Given** a selected suburb, **When** the user views Walkability, **Then** they can see walk score and nearby restaurants, cafes, gyms, hospitals, parks, beach, shopping, and train access when available.
13. **Given** a selected suburb, **When** the user views Investment Indicators, **Then** they can see rental yield, capital growth, vacancy, cashflow, gross return, population growth, building approvals, stock on market, owner-occupier %, and investor % when available.

---

### User Story 5 - Interactive Suburb Map (Priority: P2)

An investor uses a map where every suburb in scope is coloured Green (Good Buy), Yellow (Neutral), or Red (Overpriced). Clicking a suburb opens the same detail and recommendation experience as the list.

**Why this priority**: Spatial exploration is a major differentiator but depends on ranking and detail already working.

**Independent Test**: With filters applied, confirm map colours match the rating model for visible suburbs and that clicking a suburb opens its detail.

**Acceptance Scenarios**:

1. **Given** active city and price filters, **When** the map is shown, **Then** in-scope suburbs are coloured Green, Yellow, or Red according to Good Buy / Neutral / Overpriced ratings derived from the current weighted score and price context.
2. **Given** a coloured suburb on the map, **When** the user clicks it, **Then** the suburb detail and AI recommendation appear.
3. **Given** the same filters and weights, **When** the user compares the map rating for a suburb with its list ranking context, **Then** the map rating is consistent with that suburb’s score under those preferences.

---

### User Story 6 - Live Data Ingestion (Priority: P3)

After the product works on seed data, operators refresh or replace seed metrics with live or periodically pulled data from the declared sources, while the user-facing screens continue to work the same way and show data freshness where relevant.

**Why this priority**: Live pulling improves accuracy and coverage but is deliberately last so UX and scoring can ship on seed data first.

**Independent Test**: Trigger or simulate a data refresh for at least one factor group and confirm updated values appear in ranking and detail without changing the user journey.

**Acceptance Scenarios**:

1. **Given** seed data is already powering the tool, **When** live data for a factor group becomes available, **Then** suburb metrics update without requiring users to learn a new workflow.
2. **Given** mixed seed and live values, **When** a user views a factor panel, **Then** they can tell that data has a source and, where available, whether it is recent.
3. **Given** a live pull fails for some suburbs or metrics, **When** results are shown, **Then** previously known values or explicit unavailable states are used; ranking still completes for suburbs with enough data.

---

### Edge Cases

- Fewer than 100 suburbs match the city and price filters → show all matches and indicate the result count is below 100.
- Preference weights that would not sum to 100% → system normalises or constrains controls so the four weights always total 100%.
- Selected city other than Greater Sydney in v1 → show limited coverage or a clear coming-soon / limited-data state rather than empty failure.
- Suburb missing an entire factor group → panel shows unavailable for those metrics; score uses remaining signals.
- Conflicting or stale signals between related metrics (for example yield vs vacancy) → recommendation still produces Pros/Cons from available signals without claiming certainty beyond the data.
- Map click on a suburb outside the current price filter → suburb is not interactive as an in-scope result, or is visually de-emphasised and not treated as a Top 100 candidate.
- Extremely skewed weights (for example 100% Risk) → ranking still returns a Top 100 ordered solely by that dimension’s contribution.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to select a major Australian city from a city control.
- **FR-002**: Users MUST be able to set a property price range using a slider (or equivalent range control).
- **FR-003**: Users MUST be able to set percentage weights for Investment, Lifestyle, Risk, and Future Growth that always total 100%.
- **FR-004**: System MUST return a ranked list of up to 100 suburbs for the active city, price range, and preference weights.
- **FR-005**: System MUST compute a comparable Investment Score (0–100) per suburb using the active preference weights and available suburb metrics.
- **FR-006**: System MUST present an AI-style recommendation for a selected suburb including score, Pros, Cons, and a short recommendation statement.
- **FR-007**: System MUST display Price metrics when available: median house price, median unit price, price per sqm, 1-year growth, 3-year CAGR, 5-year CAGR, 10-year CAGR, with declared source attribution (NSW Valuer General sales data for NSW/Sydney).
- **FR-008**: System MUST display Sales Activity metrics when available: number of sales, average days on market, auction clearance, number of listings, monthly trend, with Domain / REA / SQM Research attributed as applicable.
- **FR-009**: System MUST display Rental metrics when available: median rent, rental yield, vacancy rate, rent growth, rent demand, with NSW Rental Bond / SQM Research / ABS rental datasets attributed as applicable.
- **FR-010**: System MUST display Affordability metrics when available: median income, mortgage repayment, mortgage/income ratio, rent/income ratio, average family income, disposable income, with ABS Census attributed.
- **FR-011**: System MUST display Demographics metrics when available: population growth, median age, family %, professionals %, university %, owner-occupier %, investor %, with ABS Census attributed.
- **FR-012**: System MUST display Crime metrics when available: violent crime, break-ins, car theft, drug offences, domestic violence, crime trend, with NSW BOCSAR attributed.
- **FR-013**: System MUST display Schools metrics when available: top schools, NAPLAN, ATAR, catchment, distance, ranking, with NSW Education / MySchool attributed.
- **FR-014**: System MUST display Transport metrics when available: distance to CBD, train station, metro, bus, motorway, airport, map context, walking time, driving time, peak hour.
- **FR-015**: System MUST display Future Infrastructure items when available: new metro, hospitals, schools, shopping centres, roads, business parks, rezoning, industrial precincts, employment hubs, with NSW Planning Portal / Infrastructure NSW attributed.
- **FR-016**: System MUST display Development Pipeline metrics when available: DA approvals, apartment projects, house lots, townhouses, high-density zoning, future supply, with NSW Planning Portal attributed.
- **FR-017**: System MUST display hazard indicators when available: flood, bushfire, aircraft noise, powerlines, mine subsidence, contaminated land, with NSW spatial datasets attributed.
- **FR-018**: System MUST display Walkability metrics when available: walk score and proximity/access to restaurants, cafe, gym, hospital, park, beach, shopping, train.
- **FR-019**: System MUST display Investment Indicators when available: rental yield, capital growth, vacancy, cashflow, gross return, population growth, building approvals, stock on market, owner-occupier %, investor %.
- **FR-020**: System MUST provide an interactive map that colours in-scope suburbs Green (Good Buy), Yellow (Neutral), or Red (Overpriced).
- **FR-021**: Users MUST be able to open suburb detail (including recommendation and factor panels) by selecting a suburb from the Top 100 list or the map.
- **FR-022**: System MUST support a seed-data phase that powers ranking, recommendation, factor panels, and map without live external feeds.
- **FR-023**: System MUST support a later live-data phase that updates or replaces seed metrics from declared sources without changing the primary user journeys.
- **FR-024**: System MUST show an explicit unavailable state for missing metrics rather than presenting fabricated values as live facts in the product UI.
- **FR-025**: System MUST keep Top 100 list ratings and map colours consistent for the same city, price range, and preference weights.
- **FR-026**: When fewer than 100 suburbs match filters, System MUST show all matching suburbs and communicate that fewer than 100 results were found.
- **FR-027**: For non–Greater Sydney cities in v1, System MUST communicate limited or coming-soon data coverage rather than failing silently.
- **FR-028**: Users MUST be able to use browse, rank, detail, and map flows without signing in.

### Key Entities

- **City**: A major Australian metro area selectable by the user; v1 fully supported city is Greater Sydney / NSW.
- **Suburb**: A named locality within a city; has geography for map display and links to metrics, score, recommendation, and map rating.
- **Price Range**: User-selected minimum and maximum price bounds used to filter suburbs.
- **Preference Weights**: Four percentage weights — Investment, Lifestyle, Risk, Future Growth — that always total 100% and drive ranking.
- **Suburb Metrics**: Factor-grouped measurements for a suburb (Price, Sales Activity, Rental, Affordability, Demographics, Crime, Schools, Transport, Future Infrastructure, Development Pipeline, Hazards, Walkability, Investment Indicators).
- **Investment Score**: A 0–100 score for a suburb under the active preference weights.
- **Recommendation**: Plain-language Pros, Cons, and recommendation statement derived from suburb signals.
- **Map Rating**: Good Buy / Neutral / Overpriced classification used to colour suburbs on the map.
- **Data Provenance**: Declared source and optional freshness for a metric or factor group (seed vs live).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can select city, set price range and preference weights, and see a Top 100 (or fewer matching) ranked list within 1 minute of opening the tool.
- **SC-002**: Changing any preference weight or the price range visibly updates the ranked list within 3 seconds of completing the adjustment under normal conditions.
- **SC-003**: Opening any Top 100 suburb shows Investment Score /100, at least one Pro or Con when signals exist, and a short recommendation statement in a single detail view.
- **SC-004**: For Greater Sydney seed coverage, at least 90% of suburbs that appear in Top 100 results expose Price and Investment Indicators panels with at least one non-unavailable metric each.
- **SC-005**: Map and list agree on Good Buy / Neutral / Overpriced rating for the same suburb under identical filters in 100% of sampled checks.
- **SC-006**: Each factor panel that displays data also shows its declared source label where provenance is defined for that group.
- **SC-007**: The full discovery-to-recommendation journey (filter → Top 100 → suburb recommendation) is demonstrable using seed data alone, with no live feeds required.
- **SC-008**: After a live-data refresh for a factor group, updated values appear in suburb detail for affected suburbs without changing the filter or recommendation navigation pattern.
- **SC-009**: When a selected city has limited v1 coverage, 100% of such sessions show an explicit limited/coming-soon message rather than an unexplained empty list.
- **SC-010**: In usability checks, at least 8 in 10 first-time testers can identify why a recommended suburb scored well by reading Pros/Cons without assistance.

## Assumptions

- Target users are individual property investors and researchers comparing Australian suburbs, starting with Greater Sydney.
- Major city selector includes common AU metros (for example Sydney, Melbourne, Brisbane, Perth, Adelaide); only Greater Sydney has complete v1 data coverage.
- Listed NSW-centric sources apply to Greater Sydney / NSW; other cities may use equivalent local sources in a later release.
- The tool lives in the existing playground application; login is not required for browse/rank/detail/map in v1; saving personal profiles is out of scope for v1.
- Delivery is one feature in three phases: (1) seed dataset, (2) product UI on seed data, (3) live data pulling — encoded as P1/P2/P3 stories above.
- Preference weights are the four named dimensions and must sum to 100%; the product may auto-normalise or lock the controls to enforce this.
- Top 100 means up to 100 suburbs after filters; fewer matches are allowed.
- Map colours Green / Yellow / Red mean Good Buy / Neutral / Overpriced relative to the active weighted score and price context.
- Seed data may be curated or approximated for development and demo; the product UI must still label unavailable metrics honestly and must not present missing live values as authoritative facts.
- “AI Recommendation” means an automated, explainable recommendation card (score, Pros, Cons, summary). Exact model/vendor is an implementation concern deferred to planning.
- Source names in factor requirements are business provenance expectations, not a mandate to integrate every provider on day one; live ingestion (P3) may land providers incrementally.
- Mobile-usable layout is expected; native mobile apps are out of scope.
- Currency and prices are in Australian dollars.
