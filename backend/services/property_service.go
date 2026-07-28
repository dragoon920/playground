package services

import (
	"database/sql"
	"encoding/json"

	"github.com/user/playground/models"
)

type PropertyService struct {
	db *sql.DB
}

func NewPropertyService(db *sql.DB) *PropertyService {
	return &PropertyService{db: db}
}

func (s *PropertyService) ListCities() models.CitiesResponse {
	return models.CitiesResponse{Cities: ListPropertyCities()}
}

func (s *PropertyService) GetSuburb(id string) (models.Suburb, error) {
	var suburb models.Suburb
	var postcode, boundaryID sql.NullString
	var housePrice, unitPrice, lat, lng sql.NullFloat64

	err := s.db.QueryRow(`
		SELECT id, city_id, name, state, postcode,
		       median_house_price, median_unit_price, lat, lng, boundary_id,
		       created_at, updated_at
		FROM suburbs WHERE id = ?`, id).Scan(
		&suburb.ID, &suburb.CityID, &suburb.Name, &suburb.State, &postcode,
		&housePrice, &unitPrice, &lat, &lng, &boundaryID,
		&suburb.CreatedAt, &suburb.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return suburb, ErrNotFound
	}
	if err != nil {
		return suburb, err
	}

	suburb.Postcode = nullStringPtr(postcode)
	suburb.BoundaryID = nullStringPtr(boundaryID)
	suburb.MedianHousePrice = nullFloatPtr(housePrice)
	suburb.MedianUnitPrice = nullFloatPtr(unitPrice)
	suburb.Lat = nullFloatPtr(lat)
	suburb.Lng = nullFloatPtr(lng)
	return suburb, nil
}

func (s *PropertyService) ListSuburbsByCity(cityID string) ([]models.Suburb, error) {
	rows, err := s.db.Query(`
		SELECT id, city_id, name, state, postcode,
		       median_house_price, median_unit_price, lat, lng, boundary_id,
		       created_at, updated_at
		FROM suburbs WHERE city_id = ? ORDER BY name ASC`, cityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	suburbs := make([]models.Suburb, 0)
	for rows.Next() {
		var suburb models.Suburb
		var postcode, boundaryID sql.NullString
		var housePrice, unitPrice, lat, lng sql.NullFloat64
		if err := rows.Scan(
			&suburb.ID, &suburb.CityID, &suburb.Name, &suburb.State, &postcode,
			&housePrice, &unitPrice, &lat, &lng, &boundaryID,
			&suburb.CreatedAt, &suburb.UpdatedAt,
		); err != nil {
			return nil, err
		}
		suburb.Postcode = nullStringPtr(postcode)
		suburb.BoundaryID = nullStringPtr(boundaryID)
		suburb.MedianHousePrice = nullFloatPtr(housePrice)
		suburb.MedianUnitPrice = nullFloatPtr(unitPrice)
		suburb.Lat = nullFloatPtr(lat)
		suburb.Lng = nullFloatPtr(lng)
		suburbs = append(suburbs, suburb)
	}
	return suburbs, rows.Err()
}

func (s *PropertyService) ListMetrics(suburbID string) ([]models.FactorPanel, error) {
	rows, err := s.db.Query(`
		SELECT factor_group, payload, source, as_of, origin
		FROM suburb_metrics WHERE suburb_id = ? ORDER BY factor_group ASC`, suburbID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	factors := make([]models.FactorPanel, 0)
	for rows.Next() {
		var panel models.FactorPanel
		var asOf sql.NullTime
		var payload []byte
		if err := rows.Scan(&panel.FactorGroup, &payload, &panel.Source, &asOf, &panel.Origin); err != nil {
			return nil, err
		}
		if len(payload) == 0 {
			panel.Metrics = json.RawMessage(`{}`)
		} else {
			panel.Metrics = json.RawMessage(payload)
		}
		if asOf.Valid {
			v := asOf.Time.Format("2006-01-02")
			panel.AsOf = &v
		}
		factors = append(factors, panel)
	}
	return factors, rows.Err()
}

func (s *PropertyService) GetSuburbDetail(id string) (models.SuburbDetailResponse, error) {
	suburb, err := s.GetSuburb(id)
	if err != nil {
		return models.SuburbDetailResponse{}, err
	}
	factors, err := s.ListMetrics(id)
	if err != nil {
		return models.SuburbDetailResponse{}, err
	}
	return models.SuburbDetailResponse{
		Suburb:         suburb,
		Recommendation: nil,
		Factors:        factors,
	}, nil
}

// RankStub returns suburbs from seed filtered by city and price.
// Weighted scoring lands in US2; here scores are neutral placeholders so seed data is visible.
func (s *PropertyService) RankStub(req models.RankRequest) (models.RankResponse, error) {
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

	rows, err := s.db.Query(`
		SELECT id, name, median_house_price
		FROM suburbs
		WHERE city_id = ?
		  AND (median_house_price IS NULL OR (median_house_price >= ? AND median_house_price <= ?))
		ORDER BY name ASC`, req.CityID, req.PriceMin, req.PriceMax)
	if err != nil {
		return resp, err
	}
	defer rows.Close()

	items := make([]models.RankedSuburb, 0)
	for rows.Next() {
		var item models.RankedSuburb
		var price sql.NullFloat64
		if err := rows.Scan(&item.SuburbID, &item.Name, &price); err != nil {
			return resp, err
		}
		item.MedianHousePrice = nullFloatPtr(price)
		item.Score = 50
		item.MapRating = models.MapRatingNeutral
		item.DimensionScores = models.DimensionScores{
			Investment: 50, Lifestyle: 50, Risk: 50, FutureGrowth: 50,
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return resp, err
	}

	resp.TotalMatched = len(items)
	if len(items) > limit {
		items = items[:limit]
	}
	resp.Items = items
	return resp, nil
}

// MapStub returns empty map features; full map ratings land in US5.
func (s *PropertyService) MapStub(cityID string) (models.MapResponse, error) {
	if _, ok := GetPropertyCity(cityID); !ok {
		return models.MapResponse{}, ErrNotFound
	}
	return models.MapResponse{
		CityID:   cityID,
		Features: []models.MapFeature{},
	}, nil
}

func nullStringPtr(v sql.NullString) *string {
	if !v.Valid {
		return nil
	}
	s := v.String
	return &s
}

func nullFloatPtr(v sql.NullFloat64) *float64 {
	if !v.Valid {
		return nil
	}
	f := v.Float64
	return &f
}
