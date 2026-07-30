package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"sort"
	"strconv"

	"github.com/user/playground/models"
)

var ErrInvalidWeights = errors.New("weights must be finite and sum to a positive total")

// WeightsWellFormed reports whether each weight is finite and non-negative.
// An all-zero set is well formed: ranking treats it as equal weighting.
func WeightsWellFormed(w models.PreferenceWeights) bool {
	for _, v := range []float64{w.Investment, w.Lifestyle, w.Risk, w.FutureGrowth} {
		if math.IsNaN(v) || math.IsInf(v, 0) || v < 0 {
			return false
		}
	}
	return true
}

// NormalizeWeights scales weights to sum to 100. Returns error if all zero or non-finite.
func NormalizeWeights(w models.PreferenceWeights) (models.PreferenceWeights, error) {
	vals := []float64{w.Investment, w.Lifestyle, w.Risk, w.FutureGrowth}
	sum := 0.0
	for _, v := range vals {
		if math.IsNaN(v) || math.IsInf(v, 0) || v < 0 {
			return models.PreferenceWeights{}, ErrInvalidWeights
		}
		sum += v
	}
	if sum <= 0 {
		return models.PreferenceWeights{}, ErrInvalidWeights
	}
	return models.PreferenceWeights{
		Investment:   round1(w.Investment / sum * 100),
		Lifestyle:    round1(w.Lifestyle / sum * 100),
		Risk:         round1(w.Risk / sum * 100),
		FutureGrowth: round1(w.FutureGrowth / sum * 100),
	}, nil
}

// MapRatingFromScore classifies Good Buy / Neutral / Overpriced from the investment score.
func MapRatingFromScore(score float64) models.MapRating {
	switch {
	case score >= 58:
		return models.MapRatingGoodBuy
	case score < 48:
		return models.MapRatingOverpriced
	default:
		return models.MapRatingNeutral
	}
}

// Rank ranks suburbs for the request using preference-weighted dimension scores.
func (s *PropertyService) Rank(req models.RankRequest) (models.RankResponse, error) {
	city, ok := GetPropertyCity(req.CityID)
	if !ok {
		return models.RankResponse{}, ErrNotFound
	}

	limit := req.Limit
	if limit <= 0 || limit > 100 {
		limit = 100
	}

	resp := models.RankResponse{
		CityID:       city.ID,
		Coverage:     city.Coverage,
		TotalMatched: 0,
		Limit:        limit,
		Items:        []models.RankedSuburb{},
	}
	if city.Coverage != models.CityCoverageFull {
		msg := LimitedCoverageMessage()
		resp.Message = &msg
		return resp, nil
	}

	weights, err := NormalizeWeights(req.Weights)
	if err != nil {
		// Equal fallback when client sends zeros — treat as equal split.
		weights = models.PreferenceWeights{Investment: 25, Lifestyle: 25, Risk: 25, FutureGrowth: 25}
	}

	propertyType := req.PropertyType
	switch propertyType {
	case models.PropertyTypeTownhouse, models.PropertyTypeApartment:
		// keep as requested
	default:
		propertyType = models.PropertyTypeHouse
	}

	suburbs, err := s.listSuburbsInPriceRange(req.CityID, propertyType, req.PriceMin, req.PriceMax)
	if err != nil {
		return resp, err
	}
	resp.TotalMatched = len(suburbs)
	if len(suburbs) == 0 {
		return resp, nil
	}

	metricsBySuburb, err := s.loadMetricsMap(req.CityID)
	if err != nil {
		return resp, err
	}

	items := make([]models.RankedSuburb, 0, len(suburbs))
	for _, suburb := range suburbs {
		dims, breakdown := scoreDimensions(metricsBySuburb[suburb.ID], suburb)
		score := weightedScore(dims, weights)
		items = append(items, models.RankedSuburb{
			SuburbID:             suburb.ID,
			Name:                 suburb.Name,
			MedianPrice:          medianForType(suburb, propertyType),
			MedianHousePrice:     suburb.MedianHousePrice,
			MedianUnitPrice:      suburb.MedianUnitPrice,
			MedianTownhousePrice: suburb.MedianTownhousePrice,
			MedianApartmentPrice: suburb.MedianApartmentPrice,
			Score:                score,
			MapRating:            models.MapRatingNeutral, // set after sort
			DimensionScores:      dims,
			DimensionBreakdown:   breakdown,
		})
	}

	sort.SliceStable(items, func(i, j int) bool {
		if items[i].Score == items[j].Score {
			return items[i].Name < items[j].Name
		}
		return items[i].Score > items[j].Score
	})

	if len(items) > limit {
		items = items[:limit]
	}
	assignRelativeMapRatings(items)
	resp.Items = items
	return resp, nil
}

// assignRelativeMapRatings colours the ranked set: top ~33% good_buy, bottom ~33% overpriced.
func assignRelativeMapRatings(items []models.RankedSuburb) {
	n := len(items)
	if n == 0 {
		return
	}
	for i := range items {
		pct := float64(i) / float64(n)
		switch {
		case pct < 0.33:
			items[i].MapRating = models.MapRatingGoodBuy
		case pct >= 0.67:
			items[i].MapRating = models.MapRatingOverpriced
		default:
			items[i].MapRating = models.MapRatingNeutral
		}
	}
}

// priceColumnFor maps a property type to the median column used for filtering.
func priceColumnFor(propertyType models.PropertyType) string {
	switch propertyType {
	case models.PropertyTypeApartment:
		return "median_apartment_price"
	case models.PropertyTypeTownhouse:
		return "median_townhouse_price"
	default:
		return "median_house_price"
	}
}

func (s *PropertyService) listSuburbsInPriceRange(
	cityID string,
	propertyType models.PropertyType,
	min, max float64,
) ([]models.Suburb, error) {
	priceCol := priceColumnFor(propertyType)
	query := fmt.Sprintf(`
		SELECT `+suburbColumns+`
		FROM suburbs
		WHERE city_id = ?
		  AND %s IS NOT NULL
		  AND %s >= ?
		  AND %s <= ?
		ORDER BY name ASC`, priceCol, priceCol, priceCol)

	rows, err := s.db.Query(query, cityID, min, max)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	suburbs := make([]models.Suburb, 0)
	for rows.Next() {
		suburb, err := scanSuburb(rows)
		if err != nil {
			return nil, err
		}
		suburbs = append(suburbs, suburb)
	}
	return suburbs, rows.Err()
}

// medianForType returns the median price of the requested property type.
func medianForType(suburb models.Suburb, propertyType models.PropertyType) *float64 {
	switch propertyType {
	case models.PropertyTypeApartment:
		return suburb.MedianApartmentPrice
	case models.PropertyTypeTownhouse:
		return suburb.MedianTownhousePrice
	default:
		return suburb.MedianHousePrice
	}
}

func (s *PropertyService) loadMetricsMap(cityID string) (map[string]map[string]map[string]any, error) {
	rows, err := s.db.Query(`
		SELECT m.suburb_id, m.factor_group, m.payload
		FROM suburb_metrics m
		INNER JOIN suburbs s ON s.id = m.suburb_id
		WHERE s.city_id = ?`, cityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make(map[string]map[string]map[string]any)
	for rows.Next() {
		var suburbID, group string
		var payload []byte
		if err := rows.Scan(&suburbID, &group, &payload); err != nil {
			return nil, err
		}
		var metrics map[string]any
		if err := json.Unmarshal(payload, &metrics); err != nil {
			metrics = map[string]any{}
		}
		if out[suburbID] == nil {
			out[suburbID] = make(map[string]map[string]any)
		}
		out[suburbID][group] = metrics
	}
	return out, rows.Err()
}

func scoreDimensions(factors map[string]map[string]any, suburb models.Suburb) (models.DimensionScores, models.DimensionBreakdown) {
	invSignals := []models.ScoreContribution{
		contribNumber(factors, "investment_indicators", "rental_yield", "Rental yield", 2.0, 6.0, false, "%", 1),
		contribNumber(factors, "investment_indicators", "capital_growth", "Capital growth", 0, 12, false, "%", 1),
		contribNumber(factors, "investment_indicators", "gross_return", "Gross return", 2, 10, false, "%", 1),
		contribNumber(factors, "rental", "rental_yield", "Rental yield (rentals)", 2.0, 6.0, false, "%", 1),
		contribNumber(factors, "rental", "vacancy_rate", "Vacancy rate", 0.5, 4.0, true, "%", 1),
		contribNumber(factors, "price", "growth_1y", "1-year price growth", -2, 12, false, "%", 1),
	}
	if suburb.MedianHousePrice != nil {
		priceScore := clamp((2_500_000-*suburb.MedianHousePrice)/2_500_000*100, 20, 95)
		invSignals = append(invSignals, models.ScoreContribution{
			Label:     "Price vs Sydney band",
			Value:     formatMoney(*suburb.MedianHousePrice),
			Points:    round1(priceScore),
			Available: true,
		})
	} else {
		invSignals = append(invSignals, models.ScoreContribution{
			Label:     "Price vs Sydney band",
			Value:     "Unavailable",
			Points:    50,
			Available: false,
		})
	}

	lifeSignals := []models.ScoreContribution{
		contribNumber(factors, "walkability", "walk_score", "Walk score", 20, 95, false, "", 0),
		contribBool(factors, "transport", "train", "Near train"),
		contribBool(factors, "transport", "metro", "Near metro"),
		contribNumber(factors, "transport", "distance_to_cbd_km", "Distance to CBD", 5, 55, true, " km", 1),
		contribNumber(factors, "transport", "drive_min", "Drive to CBD", 15, 75, true, " min", 0),
	}
	if schoolRank := numMetric(factors, "schools", "ranking"); schoolRank != nil {
		pts := clamp(100-(*schoolRank-1)*0.8, 20, 100)
		lifeSignals = append(lifeSignals, models.ScoreContribution{
			Label:     "School ranking",
			Value:     formatNumber(*schoolRank, 0),
			Points:    round1(pts),
			Available: true,
		})
	} else {
		lifeSignals = append(lifeSignals, models.ScoreContribution{
			Label:     "School ranking",
			Value:     "Unavailable",
			Points:    50,
			Available: false,
		})
	}

	riskSignals := []models.ScoreContribution{
		contribNumber(factors, "crime", "violent", "Violent crime", 0, 80, true, "", 0),
		contribNumber(factors, "crime", "break_ins", "Break-ins", 0, 120, true, "", 0),
		contribHazard(factors),
		contribNumber(factors, "demographics", "owner_occupier_pct", "Owner-occupier %", 40, 85, false, "%", 0),
		contribNumber(factors, "pipeline", "future_supply", "Future supply", 0, 5000, true, "", 0),
	}

	growthSignals := []models.ScoreContribution{
		contribNumber(factors, "demographics", "population_growth", "Population growth", -1, 5, false, "%", 1),
		contribNumber(factors, "price", "cagr_5y", "5-year CAGR", 0, 12, false, "%", 1),
		contribNumber(factors, "price", "cagr_10y", "10-year CAGR", 0, 12, false, "%", 1),
		contribInfra(factors),
		contribNumber(factors, "investment_indicators", "building_approvals", "Building approvals", 0, 200, false, "", 0),
	}

	dims := models.DimensionScores{
		Investment:   round1(avgContributionPoints(invSignals)),
		Lifestyle:    round1(avgContributionPoints(lifeSignals)),
		Risk:         round1(avgContributionPoints(riskSignals)),
		FutureGrowth: round1(avgContributionPoints(growthSignals)),
	}
	breakdown := models.DimensionBreakdown{
		Investment:   invSignals,
		Lifestyle:    lifeSignals,
		Risk:         riskSignals,
		FutureGrowth: growthSignals,
	}
	return dims, breakdown
}

func avgContributionPoints(signals []models.ScoreContribution) float64 {
	if len(signals) == 0 {
		return 50
	}
	sum := 0.0
	for _, s := range signals {
		sum += s.Points
	}
	return sum / float64(len(signals))
}

func contribNumber(
	factors map[string]map[string]any,
	group, key, label string,
	lo, hi float64,
	invert bool,
	suffix string,
	decimals int,
) models.ScoreContribution {
	raw := numMetric(factors, group, key)
	pts := metricScore(factors, group, key, lo, hi, false)
	if invert {
		pts = invertScore(pts)
	}
	if raw == nil {
		return models.ScoreContribution{
			Label:     label,
			Value:     "Unavailable — scored neutral (50)",
			Points:    round1(pts),
			Available: false,
		}
	}
	return models.ScoreContribution{
		Label:     label,
		Value:     formatNumber(*raw, decimals) + suffix,
		Points:    round1(pts),
		Available: true,
	}
}

func contribBool(factors map[string]map[string]any, group, key, label string) models.ScoreContribution {
	pts := metricScore(factors, group, key, 0, 1, true)
	if b, ok := boolMetric(factors, group, key); ok {
		val := "No"
		if b {
			val = "Yes"
		}
		return models.ScoreContribution{
			Label:     label,
			Value:     val,
			Points:    round1(pts),
			Available: true,
		}
	}
	return models.ScoreContribution{
		Label:     label,
		Value:     "Unavailable — scored neutral (50)",
		Points:    round1(pts),
		Available: false,
	}
}

func contribHazard(factors map[string]map[string]any) models.ScoreContribution {
	pts := hazardSafeScore(factors)
	hazards := []string{"flood", "bushfire", "aircraft_noise", "powerlines", "mine_subsidence", "contaminated_land"}
	hits := 0
	known := 0
	for _, h := range hazards {
		if b, ok := boolMetric(factors, "hazards", h); ok {
			known++
			if b {
				hits++
			}
			continue
		}
		if s := strMetric(factors, "hazards", h); s != "" {
			known++
			low := s == "none" || s == "low" || s == "false" || s == "no"
			if !low {
				hits++
			}
		}
	}
	if known == 0 {
		return models.ScoreContribution{
			Label:     "Hazard safety",
			Value:     "Unavailable — scored neutral (50)",
			Points:    round1(pts),
			Available: false,
		}
	}
	return models.ScoreContribution{
		Label:     "Hazard safety",
		Value:     formatNumber(float64(hits), 0) + " of " + formatNumber(float64(known), 0) + " flagged",
		Points:    round1(pts),
		Available: true,
	}
}

func contribInfra(factors map[string]map[string]any) models.ScoreContribution {
	pts := infraItemScore(factors)
	m, ok := factors["infrastructure"]
	if !ok {
		return models.ScoreContribution{
			Label:     "Infrastructure projects",
			Value:     "Unavailable — scored neutral (50)",
			Points:    round1(pts),
			Available: false,
		}
	}
	raw, ok := m["items"]
	if !ok {
		return models.ScoreContribution{
			Label:     "Infrastructure projects",
			Value:     "Unavailable — scored neutral (50)",
			Points:    round1(pts),
			Available: false,
		}
	}
	arr, ok := raw.([]any)
	if !ok {
		return models.ScoreContribution{
			Label:     "Infrastructure projects",
			Value:     "Unavailable — scored neutral (50)",
			Points:    round1(pts),
			Available: false,
		}
	}
	return models.ScoreContribution{
		Label:     "Infrastructure projects",
		Value:     formatNumber(float64(len(arr)), 0) + " listed",
		Points:    round1(pts),
		Available: true,
	}
}

func formatNumber(v float64, decimals int) string {
	if decimals <= 0 {
		return strconv.FormatInt(int64(math.Round(v)), 10)
	}
	return strconv.FormatFloat(v, 'f', decimals, 64)
}

func formatMoney(v float64) string {
	return "$" + strconv.FormatInt(int64(math.Round(v)), 10)
}

func weightedScore(dims models.DimensionScores, w models.PreferenceWeights) float64 {
	total := w.Investment + w.Lifestyle + w.Risk + w.FutureGrowth
	if total <= 0 {
		return round1((dims.Investment + dims.Lifestyle + dims.Risk + dims.FutureGrowth) / 4)
	}
	raw := (dims.Investment*w.Investment +
		dims.Lifestyle*w.Lifestyle +
		dims.Risk*w.Risk +
		dims.FutureGrowth*w.FutureGrowth) / total
	// Stretch away from the middle so seed rankings show clearer Good Buy / Overpriced bands.
	stretched := 50 + (raw-50)*1.8
	return round1(clamp(stretched, 0, 100))
}

func metricScore(factors map[string]map[string]any, group, key string, lo, hi float64, boolLike bool) float64 {
	v := numMetric(factors, group, key)
	if v == nil {
		if boolLike {
			if b, ok := boolMetric(factors, group, key); ok {
				if b {
					return 85
				}
				return 35
			}
		}
		return 50 // neutral when missing
	}
	if hi == lo {
		return 50
	}
	return clamp((*v-lo)/(hi-lo)*100, 0, 100)
}

func invertScore(score float64) float64 {
	return 100 - score
}

func hazardSafeScore(factors map[string]map[string]any) float64 {
	hazards := []string{"flood", "bushfire", "aircraft_noise", "powerlines", "mine_subsidence", "contaminated_land"}
	hits := 0
	known := 0
	for _, h := range hazards {
		if b, ok := boolMetric(factors, "hazards", h); ok {
			known++
			if b {
				hits++
			}
			continue
		}
		if s := strMetric(factors, "hazards", h); s != "" {
			known++
			low := s == "none" || s == "low" || s == "false" || s == "no"
			if !low {
				hits++
			}
		}
	}
	if known == 0 {
		return 50
	}
	return clamp(100-float64(hits)/float64(known)*100, 0, 100)
}

func infraItemScore(factors map[string]map[string]any) float64 {
	m, ok := factors["infrastructure"]
	if !ok {
		return 50
	}
	raw, ok := m["items"]
	if !ok {
		return 50
	}
	arr, ok := raw.([]any)
	if !ok {
		return 50
	}
	return clamp(float64(len(arr))*18, 30, 95)
}

func numMetric(factors map[string]map[string]any, group, key string) *float64 {
	m, ok := factors[group]
	if !ok {
		return nil
	}
	raw, ok := m[key]
	if !ok || raw == nil {
		return nil
	}
	switch v := raw.(type) {
	case float64:
		return &v
	case bool:
		f := 0.0
		if v {
			f = 1
		}
		return &f
	case string:
		return nil
	default:
		// json numbers decode as float64; ignore others
		return nil
	}
}

func boolMetric(factors map[string]map[string]any, group, key string) (bool, bool) {
	m, ok := factors[group]
	if !ok {
		return false, false
	}
	raw, ok := m[key]
	if !ok || raw == nil {
		return false, false
	}
	switch v := raw.(type) {
	case bool:
		return v, true
	case float64:
		return v != 0, true
	case string:
		return v == "true" || v == "yes" || v == "high" || v == "medium", true
	default:
		return false, false
	}
}

func strMetric(factors map[string]map[string]any, group, key string) string {
	m, ok := factors[group]
	if !ok {
		return ""
	}
	raw, ok := m[key]
	if !ok || raw == nil {
		return ""
	}
	s, _ := raw.(string)
	return s
}

func clamp(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func round1(v float64) float64 {
	return math.Round(v*10) / 10
}
