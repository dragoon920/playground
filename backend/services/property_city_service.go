package services

import "github.com/user/playground/models"

// ListPropertyCities returns the v1 city catalog.
// Greater Sydney is fully supported; other metros are coming soon.
func ListPropertyCities() []models.City {
	return []models.City{
		{ID: "sydney", Name: "Sydney", Coverage: models.CityCoverageFull},
		{ID: "melbourne", Name: "Melbourne", Coverage: models.CityCoverageComingSoon},
		{ID: "brisbane", Name: "Brisbane", Coverage: models.CityCoverageComingSoon},
		{ID: "perth", Name: "Perth", Coverage: models.CityCoverageComingSoon},
		{ID: "adelaide", Name: "Adelaide", Coverage: models.CityCoverageComingSoon},
	}
}

// GetPropertyCity returns a city from the catalog, or false if unknown.
func GetPropertyCity(id string) (models.City, bool) {
	for _, city := range ListPropertyCities() {
		if city.ID == id {
			return city, true
		}
	}
	return models.City{}, false
}

// LimitedCoverageMessage is shown when a city is not fully supported in v1.
func LimitedCoverageMessage() string {
	return "Limited data — Greater Sydney is fully supported in v1."
}
