package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	propertydata "github.com/user/playground/data/property"
)

type seedFile struct {
	CityID  string       `json:"city_id"`
	AsOf    string       `json:"as_of"`
	Suburbs []seedSuburb `json:"suburbs"`
}

type seedSuburb struct {
	ID               string       `json:"id"`
	Name             string       `json:"name"`
	State            string       `json:"state"`
	Postcode         string       `json:"postcode"`
	Lat              *float64     `json:"lat"`
	Lng              *float64     `json:"lng"`
	MedianHousePrice *float64     `json:"median_house_price"`
	MedianUnitPrice  *float64     `json:"median_unit_price"`
	BoundaryID       string       `json:"boundary_id"`
	Factors          []seedFactor `json:"factors"`
}

type seedFactor struct {
	FactorGroup string          `json:"factor_group"`
	Source      string          `json:"source"`
	AsOf        string          `json:"as_of"`
	Origin      string          `json:"origin"`
	Metrics     json.RawMessage `json:"metrics"`
}

// SeedPropertyData upserts Greater Sydney suburbs and factor metrics from embedded seed JSON.
// Safe to run on every startup (idempotent).
func SeedPropertyData(db *sql.DB) error {
	var file seedFile
	if err := json.Unmarshal(propertydata.SydneySeedJSON, &file); err != nil {
		return fmt.Errorf("parse sydney seed: %w", err)
	}
	if file.CityID == "" {
		file.CityID = "sydney"
	}
	if len(file.Suburbs) == 0 {
		return fmt.Errorf("sydney seed has no suburbs")
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	suburbStmt, err := tx.Prepare(`
		INSERT INTO suburbs (
			id, city_id, name, state, postcode,
			median_house_price, median_unit_price, lat, lng, boundary_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			city_id = VALUES(city_id),
			name = VALUES(name),
			state = VALUES(state),
			postcode = VALUES(postcode),
			median_house_price = VALUES(median_house_price),
			median_unit_price = VALUES(median_unit_price),
			lat = VALUES(lat),
			lng = VALUES(lng),
			boundary_id = VALUES(boundary_id)
	`)
	if err != nil {
		return err
	}
	defer suburbStmt.Close()

	metricStmt, err := tx.Prepare(`
		INSERT INTO suburb_metrics (
			suburb_id, factor_group, payload, source, as_of, origin
		) VALUES (?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			payload = IF(origin = 'live' AND VALUES(origin) = 'seed', payload, VALUES(payload)),
			source = IF(origin = 'live' AND VALUES(origin) = 'seed', source, VALUES(source)),
			as_of = IF(origin = 'live' AND VALUES(origin) = 'seed', as_of, VALUES(as_of)),
			origin = IF(origin = 'live' AND VALUES(origin) = 'seed', origin, VALUES(origin))
	`)
	if err != nil {
		return err
	}
	defer metricStmt.Close()

	for _, suburb := range file.Suburbs {
		if suburb.ID == "" || suburb.Name == "" {
			continue
		}
		state := suburb.State
		if state == "" {
			state = "NSW"
		}
		originDefault := "seed"

		var postcode any
		if suburb.Postcode != "" {
			postcode = suburb.Postcode
		}
		var boundary any
		if suburb.BoundaryID != "" {
			boundary = suburb.BoundaryID
		}

		if _, err := suburbStmt.Exec(
			suburb.ID, file.CityID, suburb.Name, state, postcode,
			suburb.MedianHousePrice, suburb.MedianUnitPrice, suburb.Lat, suburb.Lng, boundary,
		); err != nil {
			return fmt.Errorf("upsert suburb %s: %w", suburb.ID, err)
		}

		for _, factor := range suburb.Factors {
			if factor.FactorGroup == "" {
				continue
			}
			origin := factor.Origin
			if origin == "" {
				origin = originDefault
			}
			payload := factor.Metrics
			if len(payload) == 0 {
				payload = json.RawMessage(`{}`)
			}
			asOf := factor.AsOf
			if asOf == "" {
				asOf = file.AsOf
			}
			var asOfVal any
			if asOf != "" {
				asOfVal = asOf
			}
			if _, err := metricStmt.Exec(
				suburb.ID, factor.FactorGroup, []byte(payload), factor.Source, asOfVal, origin,
			); err != nil {
				return fmt.Errorf("upsert metric %s/%s: %w", suburb.ID, factor.FactorGroup, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	log.Printf("property seed: upserted %d suburbs for city %s", len(file.Suburbs), file.CityID)
	return nil
}
