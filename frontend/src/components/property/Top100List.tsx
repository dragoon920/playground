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
  { key: 'investment', label: 'Investment', bar: 'bg-[#ef476f]' },
  { key: 'lifestyle', label: 'Lifestyle', bar: 'bg-[#ffafcc]' },
  { key: 'risk', label: 'Stability', bar: 'bg-[#06d6a0]' },
  { key: 'future_growth', label: 'Growth', bar: 'bg-[#118ab2]' },
  { key: 'affordability', label: 'Affordability', bar: 'bg-[#5e60ce]' },
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
      return 'bg-accent/10 text-accent'
    case 'overpriced':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-mist/60 text-muted'
  }
}

function scoreToneClass(score: number): string {
  if (score >= 55) return 'text-accent'
  if (score >= 48) return 'text-ink'
  return 'text-muted'
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
      className="pointer-events-none fixed z-50 rounded-lg border border-mist bg-surface px-3 py-2.5 text-left shadow-xl"
      style={{
        left: tip.left,
        width: TIP_WIDTH,
        ...(tip.bottom != null ? { bottom: tip.bottom } : { top: tip.top ?? 0 }),
      }}
    >
      <p className="text-xs font-semibold text-ink">
        {tip.suburbName} — {tip.label} {Math.round(tip.score)}/100
      </p>
      <p className="mt-0.5 text-[0.65rem] leading-snug text-ink/55">
        Average of these inputs (missing values score as neutral 50):
      </p>
      <ul className="mt-2 space-y-1.5">
        {tip.contributions.length === 0 ? (
          <li className="text-xs text-ink/55">No breakdown available.</li>
        ) : (
          tip.contributions.map((c) => (
            <li
              key={c.label}
              className="flex items-start justify-between gap-3 text-xs leading-snug"
            >
              <span className="min-w-0">
                <span className="font-medium text-ink">{c.label}</span>
                <span className={`mt-0.5 block ${c.available ? 'text-ink/55' : 'text-accent'}`}>
                  {c.value}
                </span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-ink">
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
      <div className="rounded-[1.1rem] bg-card px-4 py-6 text-sm text-ink">
        {coverageMessage}
      </div>
    )
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-ink/55">Ranking suburbs…</p>
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink/55">
        No suburbs match this city and price range.
      </p>
    )
  }

  return (
    <div>
      <ol
        className="max-h-[36rem] space-y-2 overflow-y-auto p-1"
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
                className={`w-full rounded-[1.1rem] px-4 py-3.5 text-left transition ${
                  selected
                    ? 'bg-card shadow-sm outline outline-2 outline-accent/40 outline-offset-0'
                    : 'bg-card hover:brightness-[0.98]'
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  <span className="w-8 shrink-0 text-base font-semibold tabular-nums text-muted">
                    {index + 1}
                  </span>

                  <span className="min-w-0 flex-1 sm:w-56 sm:flex-none">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{item.name}</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${ratingClass(item.map_rating)}`}
                      >
                        {ratingLabel(item.map_rating)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs tabular-nums text-muted">
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
                    <span className="block text-[0.65rem] uppercase tracking-wide text-muted">
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
                            <span className="truncate text-muted">{label}</span>
                            <span className="w-5 shrink-0 text-right font-medium tabular-nums text-ink">
                              {Math.round(value)}
                            </span>
                          </span>
                          <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-mist/70">
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
