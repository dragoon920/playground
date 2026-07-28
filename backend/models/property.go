package models

import (
	"encoding/json"
	"time"
)

type CityCoverage string

const (
	CityCoverageFull       CityCoverage = "full"
	CityCoverageLimited    CityCoverage = "limited"
	CityCoverageComingSoon CityCoverage = "coming_soon"
)

type MapRating string

const (
	MapRatingGoodBuy     MapRating = "good_buy"
	MapRatingNeutral     MapRating = "neutral"
	MapRatingOverpriced  MapRating = "overpriced"
)

type MetricOrigin string

const (
	MetricOriginSeed MetricOrigin = "seed"
	MetricOriginLive MetricOrigin = "live"
)

type IngestionStatus string

const (
	IngestionPending   IngestionStatus = "pending"
	IngestionRunning   IngestionStatus = "running"
	IngestionSucceeded IngestionStatus = "succeeded"
	IngestionFailed    IngestionStatus = "failed"
)

type City struct {
	ID       string       `json:"id"`
	Name     string       `json:"name"`
	Coverage CityCoverage `json:"coverage"`
}

type CitiesResponse struct {
	Cities []City `json:"cities"`
}

type Suburb struct {
	ID               string    `json:"id"`
	CityID           string    `json:"city_id"`
	Name             string    `json:"name"`
	State            string    `json:"state"`
	Postcode         *string   `json:"postcode,omitempty"`
	MedianHousePrice *float64  `json:"median_house_price"`
	MedianUnitPrice  *float64  `json:"median_unit_price"`
	Lat              *float64  `json:"lat"`
	Lng              *float64  `json:"lng"`
	BoundaryID       *string   `json:"boundary_id,omitempty"`
	CreatedAt        time.Time `json:"created_at,omitempty"`
	UpdatedAt        time.Time `json:"updated_at,omitempty"`
}

type SuburbMetric struct {
	ID          int64           `json:"id"`
	SuburbID    string          `json:"suburb_id"`
	FactorGroup string          `json:"factor_group"`
	Payload     json.RawMessage `json:"metrics"`
	Source      string          `json:"source"`
	AsOf        *string         `json:"as_of"`
	Origin      MetricOrigin    `json:"origin"`
	UpdatedAt   time.Time       `json:"updated_at,omitempty"`
}

type PreferenceWeights struct {
	Investment   float64 `json:"investment"`
	Lifestyle    float64 `json:"lifestyle"`
	Risk         float64 `json:"risk"`
	FutureGrowth float64 `json:"future_growth"`
}

type RankRequest struct {
	CityID   string            `json:"city_id" binding:"required"`
	PriceMin float64           `json:"price_min"`
	PriceMax float64           `json:"price_max"`
	Weights  PreferenceWeights `json:"weights"`
	Limit    int               `json:"limit"`
}

type DimensionScores struct {
	Investment   float64 `json:"investment"`
	Lifestyle    float64 `json:"lifestyle"`
	Risk         float64 `json:"risk"`
	FutureGrowth float64 `json:"future_growth"`
}

type RankedSuburb struct {
	SuburbID         string          `json:"suburb_id"`
	Name             string          `json:"name"`
	MedianHousePrice *float64        `json:"median_house_price"`
	Score            float64         `json:"score"`
	MapRating        MapRating       `json:"map_rating"`
	DimensionScores  DimensionScores `json:"dimension_scores"`
}

type RankResponse struct {
	CityID       string         `json:"city_id"`
	Coverage     CityCoverage   `json:"coverage"`
	Message      *string        `json:"message"`
	TotalMatched int            `json:"total_matched"`
	Limit        int            `json:"limit"`
	Items        []RankedSuburb `json:"items"`
}

type Recommendation struct {
	Score     float64   `json:"score"`
	Pros      []string  `json:"pros"`
	Cons      []string  `json:"cons"`
	Summary   string    `json:"summary"`
	MapRating MapRating `json:"map_rating"`
}

type FactorPanel struct {
	FactorGroup string          `json:"factor_group"`
	Source      string          `json:"source"`
	AsOf        *string         `json:"as_of"`
	Origin      MetricOrigin    `json:"origin"`
	Metrics     json.RawMessage `json:"metrics"`
}

type SuburbDetailResponse struct {
	Suburb         Suburb          `json:"suburb"`
	Recommendation *Recommendation `json:"recommendation"`
	Factors        []FactorPanel   `json:"factors"`
}

type MapFeature struct {
	SuburbID     string    `json:"suburb_id"`
	Name         string    `json:"name"`
	MapRating    MapRating `json:"map_rating"`
	Score        float64   `json:"score"`
	InPriceRange bool      `json:"in_price_range"`
}

type MapResponse struct {
	CityID   string       `json:"city_id"`
	Features []MapFeature `json:"features"`
}

type IngestionRunRequest struct {
	FactorGroup string `json:"factor_group" binding:"required"`
	Provider    string `json:"provider" binding:"required"`
}

type IngestionRun struct {
	ID          int64           `json:"id"`
	FactorGroup string          `json:"factor_group"`
	Provider    string          `json:"provider"`
	Status      IngestionStatus `json:"status"`
	Message     string          `json:"message,omitempty"`
	StartedAt   *time.Time      `json:"started_at,omitempty"`
	FinishedAt  *time.Time      `json:"finished_at,omitempty"`
}
