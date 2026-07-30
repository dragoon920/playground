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

const suburbColumns = `id, city_id, name, state, postcode,
		       median_house_price, median_unit_price,
		       median_townhouse_price, median_apartment_price,
		       lat, lng, boundary_id, created_at, updated_at`

// rowScanner covers both *sql.Row and *sql.Rows.
type rowScanner interface {
	Scan(dest ...any) error
}

func scanSuburb(row rowScanner) (models.Suburb, error) {
	var suburb models.Suburb
	var postcode, boundaryID sql.NullString
	var housePrice, unitPrice, townhousePrice, apartmentPrice, lat, lng sql.NullFloat64

	if err := row.Scan(
		&suburb.ID, &suburb.CityID, &suburb.Name, &suburb.State, &postcode,
		&housePrice, &unitPrice, &townhousePrice, &apartmentPrice,
		&lat, &lng, &boundaryID, &suburb.CreatedAt, &suburb.UpdatedAt,
	); err != nil {
		return suburb, err
	}

	suburb.Postcode = nullStringPtr(postcode)
	suburb.BoundaryID = nullStringPtr(boundaryID)
	suburb.MedianHousePrice = nullFloatPtr(housePrice)
	suburb.MedianUnitPrice = nullFloatPtr(unitPrice)
	suburb.MedianTownhousePrice = nullFloatPtr(townhousePrice)
	suburb.MedianApartmentPrice = nullFloatPtr(apartmentPrice)
	suburb.Lat = nullFloatPtr(lat)
	suburb.Lng = nullFloatPtr(lng)
	return suburb, nil
}

func (s *PropertyService) GetSuburb(id string) (models.Suburb, error) {
	row := s.db.QueryRow(`SELECT `+suburbColumns+` FROM suburbs WHERE id = ?`, id)
	suburb, err := scanSuburb(row)
	if err == sql.ErrNoRows {
		return suburb, ErrNotFound
	}
	return suburb, err
}

func (s *PropertyService) ListSuburbsByCity(cityID string) ([]models.Suburb, error) {
	rows, err := s.db.Query(
		`SELECT `+suburbColumns+` FROM suburbs WHERE city_id = ? ORDER BY name ASC`, cityID)
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
