import { useEffect, useState } from 'react'
import { fetchCities } from '../lib/propertyApi'
import { cardClass } from '../lib/styles'
import type { City } from '../types/property'

export default function PropertyInvestmentPage() {
  const [cities, setCities] = useState<City[]>([])
  const [citiesError, setCitiesError] = useState<string | null>(null)
  const [citiesLoading, setCitiesLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setCitiesLoading(true)
      setCitiesError(null)
      try {
        const res = await fetchCities()
        if (!cancelled) setCities(res.cities)
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
  }, [])

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

      <div className="grid gap-6 xl:grid-cols-12">
        <section className={`${cardClass} p-6 xl:col-span-4`} aria-labelledby="property-filters-heading">
          <h2 id="property-filters-heading" className="text-lg font-semibold text-gray-900">
            Filters
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            City, price range, and Investment / Lifestyle / Risk / Future Growth weights.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">City</p>
              {citiesLoading ? (
                <p className="text-sm text-gray-500">Loading cities…</p>
              ) : citiesError ? (
                <p className="text-sm text-red-600">{citiesError}</p>
              ) : (
                <ul className="space-y-1 text-sm text-gray-600">
                  {cities.map((city) => (
                    <li key={city.id} className="flex items-center justify-between gap-2">
                      <span>{city.name}</span>
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        {city.coverage.replace('_', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              Price range and preference weight controls arrive in the next phase.
            </div>
          </div>
        </section>

        <section className={`${cardClass} p-6 xl:col-span-4`} aria-labelledby="property-list-heading">
          <h2 id="property-list-heading" className="text-lg font-semibold text-gray-900">
            Top 100
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Ranked suburbs for the active filters and weights.
          </p>
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
            Ranked list placeholder — seed data and ranking come next.
          </div>
        </section>

        <section className={`${cardClass} p-6 xl:col-span-4`} aria-labelledby="property-detail-heading">
          <h2 id="property-detail-heading" className="text-lg font-semibold text-gray-900">
            Detail & map
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Recommendation card, factor panels, and interactive suburb map.
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Select a suburb to see score, pros/cons, and recommendation.
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
