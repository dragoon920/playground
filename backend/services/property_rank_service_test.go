package services

import (
	"testing"

	"github.com/user/playground/models"
)

func TestNormalizeWeightsIncludesAffordability(t *testing.T) {
	got, err := NormalizeWeights(models.PreferenceWeights{
		Investment:    1,
		Lifestyle:     1,
		Risk:          1,
		FutureGrowth:  1,
		Affordability: 1,
	})
	if err != nil {
		t.Fatalf("NormalizeWeights returned error: %v", err)
	}

	if got.Investment != 20 || got.Lifestyle != 20 || got.Risk != 20 ||
		got.FutureGrowth != 20 || got.Affordability != 20 {
		t.Fatalf("expected five equal 20%% weights, got %+v", got)
	}
}

func TestScoreDimensionsCalculatesAffordability(t *testing.T) {
	factors := map[string]map[string]any{
		"affordability": {
			"median_income":         180_000.0,
			"mortgage_repayment":    3_000.0,
			"mortgage_income_ratio": 0.25,
			"rent_income_ratio":     0.22,
			"avg_family_income":     250_000.0,
			"disposable_income":     120_000.0,
		},
	}

	dims, breakdown := scoreDimensions(factors, models.Suburb{})

	if dims.Affordability <= 50 {
		t.Fatalf("expected strong affordability to score above neutral, got %v", dims.Affordability)
	}
	if len(breakdown.Affordability) != 6 {
		t.Fatalf("expected six affordability contributions, got %d", len(breakdown.Affordability))
	}
	for _, contribution := range breakdown.Affordability {
		if !contribution.Available {
			t.Fatalf("expected %q to be available", contribution.Label)
		}
	}
}

func TestScoreDimensionsUsesNeutralForMissingAffordability(t *testing.T) {
	dims, breakdown := scoreDimensions(map[string]map[string]any{}, models.Suburb{})

	if dims.Affordability != 50 {
		t.Fatalf("expected missing affordability to score 50, got %v", dims.Affordability)
	}
	if len(breakdown.Affordability) != 6 {
		t.Fatalf("expected six affordability contributions, got %d", len(breakdown.Affordability))
	}
	for _, contribution := range breakdown.Affordability {
		if contribution.Available || contribution.Points != 50 {
			t.Fatalf("expected neutral unavailable contribution, got %+v", contribution)
		}
	}
}
