import { useEffect, useMemo, useState } from 'react'
import CitySelect from '../components/property/CitySelect'
import PreferenceWeightsControls from '../components/property/PreferenceWeights'
import PriceRangeSlider from '../components/property/PriceRangeSlider'
import PropertyTypeSelect from '../components/property/PropertyTypeSelect'
import Top100List from '../components/property/Top100List'
import { fetchCities, rankSuburbs } from '../lib/propertyApi'
import { cardClass } from '../lib/styles'
import type {
  City,
  PreferenceWeights,
  PropertyType,
  RankedSuburb,
  RankResponse,
} from '../types/property'

const DEFAULT_WEIGHTS: PreferenceWeights = {
  investment: 20,
  lifestyle: 20,
  risk: 20,
  future_growth: 20,
  affordability: 20,
}

export default function PropertyInvestmentPage() {
  const [cities, setCities] = useState<City[]>([])
  const [citiesError, setCitiesError] = useState<string | null>(null)
  const [citiesLoading, setCitiesLoading] = useState(true)

  const [cityId, setCityId] = useState('sydney')
  const [propertyType, setPropertyType] = useState<PropertyType>('house')
  const [priceMin, setPriceMin] = useState(600_000)
  const [priceMax, setPriceMax] = useState(1_800_000)
  const [weights, setWeights] = useState<PreferenceWeights>(DEFAULT_WEIGHTS)

  const [rank, setRank] = useState<RankResponse | null>(null)
  const [rankLoading, setRankLoading] = useState(false)
  const [rankError, setRankError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === cityId) ?? null,
    [cities, cityId],
  )
  const coverageFull = selectedCity?.coverage === 'full'
  const coverageMessage =
    selectedCity && selectedCity.coverage !== 'full'
      ? rank?.message ||
        'Limited data — Greater Sydney is fully supported in v1. Choose Sydney for ranked results.'
      : null

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setCitiesLoading(true)
      setCitiesError(null)
      try {
        const res = await fetchCities()
        if (cancelled) return
        setCities(res.cities)
        if (res.cities.length && !res.cities.some((c) => c.id === cityId)) {
          setCityId(res.cities[0].id)
        }
      } catch (err) {
        if (!cancelled) {
          setCitiesError(err instanceof Error ? err.message : 'Failed to load cities')
        }
      } finally {
        if (!cancelled) setCitiesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load cities once
  }, [])

  useEffect(() => {
    if (citiesLoading || citiesError) return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setRankLoading(true)
      setRankError(null)
      try {
        const res = await rankSuburbs({
          city_id: cityId,
          property_type: propertyType,
          price_min: priceMin,
          price_max: priceMax,
          weights,
          limit: 100,
        })
        if (cancelled) return
        setRank(res)
        setSelectedId((prev) => {
          if (prev && res.items.some((i) => i.suburb_id === prev)) return prev
          return res.items[0]?.suburb_id ?? null
        })
      } catch (err) {
        if (!cancelled) {
          setRank(null)
          setRankError(err instanceof Error ? err.message : 'Failed to rank suburbs')
        }
      } finally {
        if (!cancelled) setRankLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [cityId, propertyType, priceMin, priceMax, weights, citiesLoading, citiesError])

  const items: RankedSuburb[] = rank?.items ?? []

  return (
    <>
      <header className="mb-7">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
          Property Investment Tool
        </h1>
        <p className="mt-1.5 text-gray-500">
          Filter suburbs by city, price, and preference weights — then review rankings,
          recommendations, and the map.
        </p>
      </header>

      <div className="space-y-6">
        <section
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          aria-labelledby="property-filters-heading"
        >
          <h2 id="property-filters-heading" className="text-lg font-semibold text-gray-900">
            Filters
          </h2>

          <div className="mt-4 grid gap-x-8 gap-y-6 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  {citiesLoading ? (
                    <p className="text-sm text-gray-500">Loading cities…</p>
                  ) : citiesError ? (
                    <p className="text-sm text-red-600">{citiesError}</p>
                  ) : (
                    <CitySelect cities={cities} value={cityId} onChange={setCityId} />
                  )}
                </div>
                <PropertyTypeSelect
                  value={propertyType}
                  onChange={setPropertyType}
                  disabled={!coverageFull && !!selectedCity}
                />
              </div>

              <PriceRangeSlider
                min={priceMin}
                max={priceMax}
                onChange={({ min, max }) => {
                  setPriceMin(min)
                  setPriceMax(max)
                }}
                disabled={!coverageFull && !!selectedCity}
              />
            </div>

            <PreferenceWeightsControls
              value={weights}
              onChange={setWeights}
              disabled={!coverageFull && !!selectedCity}
            />
          </div>
        </section>

        <section
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          aria-labelledby="property-list-heading"
        >
          <h2 id="property-list-heading" className="text-lg font-semibold text-gray-900">
            Top 100
          </h2>
          <div className="mt-4">
            <Top100List
              items={items}
              propertyType={propertyType}
              loading={rankLoading}
              error={rankError}
              selectedId={selectedId}
              onSelect={setSelectedId}
              coverageMessage={coverageMessage}
            />
          </div>
        </section>

        <section className={`${cardClass} p-6`} aria-labelledby="property-detail-heading">
          <h2 id="property-detail-heading" className="text-lg font-semibold text-gray-900">
            Detail & map
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Recommendation card, factor panels, and interactive suburb map.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              {selectedId
                ? `Selected: ${items.find((i) => i.suburb_id === selectedId)?.name ?? selectedId} — recommendation arrives in the next phase.`
                : 'Select a suburb to see score, pros/cons, and recommendation.'}
            </div>
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Map area — Good Buy / Neutral / Overpriced colouring.
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
