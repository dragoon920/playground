export type CityCoverage = 'full' | 'limited' | 'coming_soon'

export type MapRating = 'good_buy' | 'neutral' | 'overpriced'

export type FactorGroup =
  | 'price'
  | 'sales'
  | 'rental'
  | 'affordability'
  | 'demographics'
  | 'crime'
  | 'schools'
  | 'transport'
  | 'infrastructure'
  | 'pipeline'
  | 'hazards'
  | 'walkability'
  | 'investment_indicators'

export type MetricOrigin = 'seed' | 'live'

export type IngestionStatus = 'pending' | 'running' | 'succeeded' | 'failed'

export interface City {
  id: string
  name: string
  coverage: CityCoverage
}

export interface CitiesResponse {
  cities: City[]
}

export interface PreferenceWeights {
  investment: number
  lifestyle: number
  risk: number
  future_growth: number
}

export interface RankRequest {
  city_id: string
  price_min: number
  price_max: number
  weights: PreferenceWeights
  limit?: number
}

export interface DimensionScores {
  investment: number
  lifestyle: number
  risk: number
  future_growth: number
}

export interface ScoreContribution {
  label: string
  value: string
  points: number
  available: boolean
}

export interface DimensionBreakdown {
  investment: ScoreContribution[]
  lifestyle: ScoreContribution[]
  risk: ScoreContribution[]
  future_growth: ScoreContribution[]
}

export interface RankedSuburb {
  suburb_id: string
  name: string
  median_house_price: number | null
  score: number
  map_rating: MapRating
  dimension_scores: DimensionScores
  dimension_breakdown: DimensionBreakdown
}

export interface RankResponse {
  city_id: string
  coverage: CityCoverage
  message: string | null
  total_matched: number
  limit: number
  items: RankedSuburb[]
}

export interface Suburb {
  id: string
  city_id: string
  name: string
  state: string
  postcode?: string | null
  median_house_price: number | null
  median_unit_price: number | null
  lat: number | null
  lng: number | null
}

export interface Recommendation {
  score: number
  pros: string[]
  cons: string[]
  summary: string
  map_rating: MapRating
}

export interface FactorPanel {
  factor_group: FactorGroup
  source: string
  as_of: string | null
  origin: MetricOrigin
  metrics: Record<string, number | string | boolean | null | unknown>
}

export interface SuburbDetailResponse {
  suburb: Suburb
  recommendation: Recommendation | null
  factors: FactorPanel[]
}

export interface MapFeature {
  suburb_id: string
  name: string
  map_rating: MapRating
  score: number
  in_price_range: boolean
}

export interface MapResponse {
  city_id: string
  features: MapFeature[]
}

export interface IngestionRunRequest {
  factor_group: FactorGroup | string
  provider: string
}

export interface IngestionRun {
  id: number
  status: IngestionStatus
  factor_group: string
  provider: string
  message?: string
  started_at?: string | null
  finished_at?: string | null
}
