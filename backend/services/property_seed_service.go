package services

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"strconv"

	propertydata "github.com/user/playground/data/property"
)

type seedFile struct {
	CityID  string       `json:"city_id"`
	AsOf    string       `json:"as_of"`
	Suburbs []seedSuburb `json:"suburbs"`
}

type seedSuburb struct {
	ID                   string       `json:"id"`
	Name                 string       `json:"name"`
	State                string       `json:"state"`
	Postcode             string       `json:"postcode"`
	Lat                  *float64     `json:"lat"`
	Lng                  *float64     `json:"lng"`
	MedianHousePrice     *float64     `json:"median_house_price"`
	MedianUnitPrice      *float64     `json:"median_unit_price"`
	MedianTownhousePrice *float64     `json:"median_townhouse_price"`
	MedianApartmentPrice *float64     `json:"median_apartment_price"`
	BoundaryID           string       `json:"boundary_id"`
	Factors              []seedFactor `json:"factors"`
}

type seedFactor struct {
	FactorGroup string          `json:"factor_group"`
	Source      string          `json:"source"`
	AsOf        string          `json:"as_of"`
	Origin      string          `json:"origin"`
	Metrics     json.RawMessage `json:"metrics"`
}

// derivePropertyTypePrices backfills townhouse and apartment medians for suburbs whose
// seed record only carries the house and unit medians published by the Valuer General.
//
//   - apartment: the unit median (the NSW "unit" category is dominated by apartments)
//   - townhouse: sits between unit and house; the blend leans closer to the unit median
//     where the development pipeline shows heavy townhouse or high-density supply
//
// Explicit values in the seed JSON always win, so real per-type medians can replace these
// as live sales feeds land.
func derivePropertyTypePrices(suburb seedSuburb) (townhouse, apartment *float64) {
	house := suburb.MedianHousePrice
	unit := suburb.MedianUnitPrice

	apartment = suburb.MedianApartmentPrice
	if apartment == nil && unit != nil {
		v := *unit
		apartment = &v
	}

	townhouse = suburb.MedianTownhousePrice
	if townhouse == nil && house != nil && unit != nil && *house > *unit {
		blend := townhouseBlend(suburb)
		v := roundToNearest(*unit+blend*(*house-*unit), 5000)
		townhouse = &v
	}
	if townhouse == nil && house != nil {
		v := roundToNearest(*house*0.78, 5000)
		townhouse = &v
	}
	return townhouse, apartment
}

// townhouseBlend is the share of the unit-to-house price gap a townhouse commands.
func townhouseBlend(suburb seedSuburb) float64 {
	blend := 0.62
	for _, factor := range suburb.Factors {
		if factor.FactorGroup != "pipeline" || len(factor.Metrics) == 0 {
			continue
		}
		var pipeline struct {
			Townhouses        *float64 `json:"townhouses"`
			HighDensityZoning *bool    `json:"high_density_zoning"`
		}
		if err := json.Unmarshal(factor.Metrics, &pipeline); err != nil {
			continue
		}
		if pipeline.Townhouses != nil {
			supply := *pipeline.Townhouses / 40
			if supply > 1 {
				supply = 1
			}
			blend -= 0.12 * supply
		}
		if pipeline.HighDensityZoning != nil && *pipeline.HighDensityZoning {
			blend -= 0.03
		}
	}
	if blend < 0.45 {
		blend = 0.45
	}
	if blend > 0.70 {
		blend = 0.70
	}
	return blend
}

// withTypePrices adds the derived medians to a price factor payload without
// overwriting values the seed already provides. Existing numbers are decoded as
// json.Number so re-marshalling keeps their original notation.
func withTypePrices(payload json.RawMessage, townhouse, apartment *float64) json.RawMessage {
	dec := json.NewDecoder(bytes.NewReader(payload))
	dec.UseNumber()

	var metrics map[string]any
	if err := dec.Decode(&metrics); err != nil || metrics == nil {
		return payload
	}
	if _, ok := metrics["median_townhouse_price"]; !ok && townhouse != nil {
		metrics["median_townhouse_price"] = jsonNumber(*townhouse)
	}
	if _, ok := metrics["median_apartment_price"]; !ok && apartment != nil {
		metrics["median_apartment_price"] = jsonNumber(*apartment)
	}
	merged, err := json.Marshal(metrics)
	if err != nil {
		return payload
	}
	return merged
}

func jsonNumber(v float64) json.Number {
	return json.Number(strconv.FormatFloat(v, 'f', -1, 64))
}

func roundToNearest(v, step float64) float64 {
	if step <= 0 {
		return v
	}
	return math.Round(v/step) * step
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
			median_house_price, median_unit_price,
			median_townhouse_price, median_apartment_price,
			lat, lng, boundary_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			city_id = VALUES(city_id),
			name = VALUES(name),
			state = VALUES(state),
			postcode = VALUES(postcode),
			median_house_price = VALUES(median_house_price),
			median_unit_price = VALUES(median_unit_price),
			median_townhouse_price = VALUES(median_townhouse_price),
			median_apartment_price = VALUES(median_apartment_price),
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

		townhousePrice, apartmentPrice := derivePropertyTypePrices(suburb)

		if _, err := suburbStmt.Exec(
			suburb.ID, file.CityID, suburb.Name, state, postcode,
			suburb.MedianHousePrice, suburb.MedianUnitPrice,
			townhousePrice, apartmentPrice,
			suburb.Lat, suburb.Lng, boundary,
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
			if factor.FactorGroup == "price" {
				payload = withTypePrices(payload, townhousePrice, apartmentPrice)
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
