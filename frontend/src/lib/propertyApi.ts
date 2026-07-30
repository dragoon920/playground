import { API, jsonHeaders } from './api'
import type {
  CitiesResponse,
  IngestionRun,
  IngestionRunRequest,
  MapResponse,
  PreferenceWeights,
  RankRequest,
  RankResponse,
  SuburbDetailResponse,
} from '../types/property'

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    if (body.error) return body.error
  } catch {
    /* ignore */
  }
  return res.statusText || `Request failed (${res.status})`
}

export async function fetchCities(): Promise<CitiesResponse> {
  const res = await fetch(`${API}/property/cities`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function rankSuburbs(body: RankRequest): Promise<RankResponse> {
  const res = await fetch(`${API}/property/rank`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchSuburbDetail(
  id: string,
  weights?: Partial<PreferenceWeights>,
): Promise<SuburbDetailResponse> {
  const params = new URLSearchParams()
  if (weights?.investment != null) params.set('investment', String(weights.investment))
  if (weights?.lifestyle != null) params.set('lifestyle', String(weights.lifestyle))
  if (weights?.risk != null) params.set('risk', String(weights.risk))
  if (weights?.future_growth != null) params.set('future_growth', String(weights.future_growth))
  if (weights?.affordability != null) {
    params.set('affordability', String(weights.affordability))
  }
  const qs = params.toString()
  const res = await fetch(`${API}/property/suburbs/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchMapFeatures(query: {
  city_id: string
  price_min: number
  price_max: number
  weights?: PreferenceWeights
}): Promise<MapResponse> {
  const params = new URLSearchParams({
    city_id: query.city_id,
    price_min: String(query.price_min),
    price_max: String(query.price_max),
  })
  if (query.weights) {
    params.set('investment', String(query.weights.investment))
    params.set('lifestyle', String(query.weights.lifestyle))
    params.set('risk', String(query.weights.risk))
    params.set('future_growth', String(query.weights.future_growth))
    params.set('affordability', String(query.weights.affordability))
  }
  const res = await fetch(`${API}/property/map?${params}`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function createIngestionRun(
  token: string,
  body: IngestionRunRequest,
): Promise<IngestionRun> {
  const res = await fetch(`${API}/property/ingestion/runs`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchIngestionRun(token: string, id: number): Promise<IngestionRun> {
  const res = await fetch(`${API}/property/ingestion/runs/${id}`, {
    headers: jsonHeaders(token),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
