import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  DimensionBreakdown,
  DimensionScores,
  MapRating,
  PropertyType,
  RankedSuburb,
  ScoreContribution,
} from '../../types/property'

const AUD = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

const TIP_WIDTH = 288

const TYPE_LABELS: Record<PropertyType, string> = {
  house: 'house',
  townhouse: 'townhouse',
  apartment: 'apartment',
}

const DIMENSIONS: {
  key: keyof DimensionScores
  label: string
  bar: string
}[] = [
  { key: 'investment', label: 'Investment', bar: 'bg-teal-700' },
  { key: 'lifestyle', label: 'Lifestyle', bar: 'bg-sky-600' },
  { key: 'risk', label: 'Stability', bar: 'bg-amber-500' },
  { key: 'future_growth', label: 'Growth', bar: 'bg-violet-600' },
  { key: 'affordability', label: 'Affordability', bar: 'bg-rose-600' },
]

function ratingLabel(rating: MapRating): string {
  switch (rating) {
    case 'good_buy':
      return 'Good Buy'
    case 'overpriced':
      return 'Overpriced'
    default:
      return 'Neutral'
  }
}

function ratingClass(rating: MapRating): string {
  switch (rating) {
    case 'good_buy':
      return 'bg-emerald-100 text-emerald-800'
    case 'overpriced':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-amber-100 text-amber-800'
  }
}

function scoreToneClass(score: number): string {
  if (score >= 55) return 'text-emerald-700'
  if (score >= 48) return 'text-amber-700'
  return 'text-gray-600'
}

function breakdownFor(
  breakdown: DimensionBreakdown | undefined,
  key: keyof DimensionScores,
): ScoreContribution[] {
  if (!breakdown) return []
  return breakdown[key] ?? []
}

type TipState = {
  suburbName: string
  label: string
  score: number
  contributions: ScoreContribution[]
  left: number
  /** Distance from the viewport top when placed below the bar. */
  top: number | null
  /** Distance from the viewport bottom when placed above the bar. */
  bottom: number | null
}

/**
 * Rendered into document.body so the scrollable list cannot clip it.
 */
function FactorTooltip({ tip }: { tip: TipState }) {
  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left shadow-xl"
      style={{
        left: tip.left,
        width: TIP_WIDTH,
        ...(tip.bottom != null ? { bottom: tip.bottom } : { top: tip.top ?? 0 }),
      }}
    >
      <p className="text-xs font-semibold text-gray-900">
        {tip.suburbName} — {tip.label} {Math.round(tip.score)}/100
      </p>
      <p className="mt-0.5 text-[0.65rem] leading-snug text-gray-500">
        Average of these inputs (missing values score as neutral 50):
      </p>
      <ul className="mt-2 space-y-1.5">
        {tip.contributions.length === 0 ? (
          <li className="text-xs text-gray-500">No breakdown available.</li>
        ) : (
          tip.contributions.map((c) => (
            <li
              key={c.label}
              className="flex items-start justify-between gap-3 text-xs leading-snug"
            >
              <span className="min-w-0">
                <span className="font-medium text-gray-800">{c.label}</span>
                <span className={`mt-0.5 block ${c.available ? 'text-gray-500' : 'text-amber-700'}`}>
                  {c.value}
                </span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-gray-700">
                {Math.round(c.points)}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>,
    document.body,
  )
}

type Props = {
  items: RankedSuburb[]
  propertyType: PropertyType
  loading: boolean
  error: string | null
  selectedId: string | null
  onSelect: (suburbId: string) => void
  coverageMessage?: string | null
}

export default function Top100List({
  items,
  propertyType,
  loading,
  error,
  selectedId,
  onSelect,
  coverageMessage,
}: Props) {
  const [tip, setTip] = useState<TipState | null>(null)
  const closeTip = useCallback(() => setTip(null), [])

  useEffect(() => {
    if (!tip) return
    window.addEventListener('scroll', closeTip, true)
    window.addEventListener('resize', closeTip)
    return () => {
      window.removeEventListener('scroll', closeTip, true)
      window.removeEventListener('resize', closeTip)
    }
  }, [tip, closeTip])

  function openTip(
    target: HTMLElement,
    suburbName: string,
    label: string,
    score: number,
    contributions: ScoreContribution[],
  ) {
    const rect = target.getBoundingClientRect()
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - TIP_WIDTH / 2, 8),
      Math.max(window.innerWidth - TIP_WIDTH - 8, 8),
    )
    // Prefer above the bar; flip below when there is not enough headroom.
    const placeAbove = rect.top > 260
    setTip({
      suburbName,
      label,
      score,
      contributions,
      left,
      top: placeAbove ? null : rect.bottom + 8,
      bottom: placeAbove ? window.innerHeight - rect.top + 8 : null,
    })
  }

  if (coverageMessage) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
        {coverageMessage}
      </div>
    )
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Ranking suburbs…</p>
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No suburbs match this city and price range.
      </p>
    )
  }

  return (
    <div>
      <ol
        className="max-h-[36rem] space-y-2 overflow-y-auto pr-1"
        onScroll={closeTip}
        onMouseLeave={closeTip}
      >
        {items.map((item, index) => {
          const selected = item.suburb_id === selectedId
          return (
            <li key={item.suburb_id}>
              <button
                type="button"
                onClick={() => onSelect(item.suburb_id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  selected
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  <span className="w-8 shrink-0 text-base font-semibold tabular-nums text-gray-400">
                    {index + 1}
                  </span>

                  <span className="min-w-0 flex-1 sm:w-56 sm:flex-none">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{item.name}</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${ratingClass(item.map_rating)}`}
                      >
                        {ratingLabel(item.map_rating)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs tabular-nums text-gray-500">
                      {item.median_price != null
                        ? `Median ${TYPE_LABELS[propertyType]} ${AUD.format(item.median_price)}`
                        : `Median ${TYPE_LABELS[propertyType]} price unavailable`}
                    </span>
                  </span>

                  <span className="w-14 shrink-0 text-left">
                    <span
                      className={`block text-xl font-semibold leading-tight tabular-nums ${scoreToneClass(item.score)}`}
                    >
                      {item.score}
                    </span>
                    <span className="block text-[0.65rem] uppercase tracking-wide text-gray-400">
                      Score
                    </span>
                  </span>

                  <span className="grid w-full grid-cols-2 gap-x-5 gap-y-2 sm:ml-auto sm:w-[28rem] sm:grid-cols-5">
                    {DIMENSIONS.map(({ key, label, bar }) => {
                      const value = item.dimension_scores[key]
                      return (
                        <span
                          key={key}
                          className="block"
                          onMouseEnter={(e) =>
                            openTip(
                              e.currentTarget,
                              item.name,
                              label,
                              value,
                              breakdownFor(item.dimension_breakdown, key),
                            )
                          }
                          onMouseLeave={closeTip}
                        >
                          <span className="flex items-baseline justify-between gap-2 text-xs">
                            <span className="truncate text-gray-500">{label}</span>
                            <span className="w-5 shrink-0 text-right font-medium tabular-nums text-gray-700">
                              {Math.round(value)}
                            </span>
                          </span>
                          <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                            <span
                              className={`block h-full rounded-full ${bar}`}
                              style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                            />
                          </span>
                        </span>
                      )
                    })}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ol>

      {tip ? <FactorTooltip tip={tip} /> : null}
    </div>
  )
}
