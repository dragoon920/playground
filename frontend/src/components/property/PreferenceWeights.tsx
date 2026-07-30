import type { PreferenceWeights } from '../../types/property'

const KEYS = ['investment', 'lifestyle', 'risk', 'future_growth'] as const
type WeightKey = (typeof KEYS)[number]

const LABELS: Record<WeightKey, string> = {
  investment: 'Investment',
  lifestyle: 'Lifestyle',
  risk: 'Risk',
  future_growth: 'Future Growth',
}

/** Plain-language guidance shown on hover over each factor title. */
const DESCRIPTIONS: Record<WeightKey, string> = {
  investment:
    'How strongly cashflow and returns matter — rental yield, capital growth, vacancy, and overall investment indicators. Raise this if you care most about making money from the property.',
  lifestyle:
    'Day-to-day liveability — walkability, cafes and shops, schools, parks, and how easy it is to get around by train, metro, bus, or car. Raise this if you (or tenants) want a pleasant place to live.',
  risk:
    'How much you want to avoid downside — crime levels, flood or bushfire exposure, oversupply from new building, and other hazard signals. Raise this if you prefer safer, more stable suburbs.',
  future_growth:
    'Longer-term upside — population growth, planned infrastructure (metro, roads, hospitals), rezoning, and the development pipeline. Raise this if you are buying for capital growth over several years.',
}

const BAR_COLORS: Record<WeightKey, string> = {
  investment: 'bg-teal-700',
  lifestyle: 'bg-sky-600',
  risk: 'bg-amber-500',
  future_growth: 'bg-violet-600',
}

const DOT_COLORS: Record<WeightKey, string> = {
  investment: 'bg-teal-700',
  lifestyle: 'bg-sky-600',
  risk: 'bg-amber-500',
  future_growth: 'bg-violet-600',
}

type Props = {
  value: PreferenceWeights
  onChange: (next: PreferenceWeights) => void
  disabled?: boolean
}

/**
 * Effective share of the ranking each weight contributes, as whole percentages
 * that add up to exactly 100 (largest remainder rounding).
 */
export function effectiveShares(value: PreferenceWeights): Record<WeightKey, number> {
  const total = KEYS.reduce((acc, k) => acc + value[k], 0)
  if (total <= 0) {
    return { investment: 25, lifestyle: 25, risk: 25, future_growth: 25 }
  }

  const exact = KEYS.map((k) => ({ key: k, raw: (value[k] / total) * 100 }))
  const shares = exact.map((e) => ({ ...e, floor: Math.floor(e.raw) }))
  let remaining = 100 - shares.reduce((acc, s) => acc + s.floor, 0)

  const byRemainder = [...shares].sort((a, b) => b.raw - b.floor - (a.raw - a.floor))
  const result = { investment: 0, lifestyle: 0, risk: 0, future_growth: 0 }
  for (const s of shares) result[s.key] = s.floor
  for (const s of byRemainder) {
    if (remaining <= 0) break
    result[s.key] += 1
    remaining -= 1
  }
  return result
}

/**
 * Legend entry with the share percentage; hovering it explains the factor.
 * `alignRight` anchors the tooltip to the entry's right edge so entries near the
 * container edge do not push the box outside the card.
 */
function FactorLegendTitle({
  weightKey,
  alignRight,
}: {
  weightKey: WeightKey
  alignRight?: boolean
}) {
  return (
    <span className="group relative inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${DOT_COLORS[weightKey]}`} />
      <span
        className="font-medium text-gray-800"
        tabIndex={0}
        aria-describedby={`factor-tip-${weightKey}`}
      >
        {LABELS[weightKey]}
      </span>
      <span
        id={`factor-tip-${weightKey}`}
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-30 mb-2 hidden w-64 max-w-[min(16rem,60vw)] rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-normal leading-relaxed text-gray-600 shadow-lg group-hover:block group-focus-within:block ${
          alignRight ? 'right-0' : 'left-0'
        }`}
      >
        {DESCRIPTIONS[weightKey]}
      </span>
    </span>
  )
}

export default function PreferenceWeightsControls({ value, onChange, disabled }: Props) {
  const shares = effectiveShares(value)
  const allZero = KEYS.every((k) => value[k] === 0)

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium text-gray-700">Preference weights</legend>
      <p className="text-xs text-gray-500">
        Set how much each factor matters. Hover a name in the legend below for a short
        explanation. Sliders move independently — ranking shares come from their relative sizes.
      </p>

      <div className="space-y-2">
        <div
          className="flex h-3 overflow-hidden rounded-full bg-gray-200"
          role="img"
          aria-label={KEYS.map((k) => `${LABELS[k]} ${shares[k]}%`).join(', ')}
        >
          {KEYS.map((key) =>
            shares[key] > 0 ? (
              <div
                key={key}
                className={`${BAR_COLORS[key]} transition-[width] duration-150`}
                style={{ width: `${shares[key]}%` }}
                title={`${LABELS[key]}: ${shares[key]}%`}
              />
            ) : null,
          )}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
          {KEYS.map((key, index) => (
            <li key={key} className="inline-flex items-center gap-1.5">
              <FactorLegendTitle weightKey={key} alignRight={index % 2 === 1} />
              <span className="tabular-nums font-medium text-gray-800">{shares[key]}%</span>
            </li>
          ))}
        </ul>
      </div>

      {KEYS.map((key) => (
        <label key={key} className="block">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
              <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${DOT_COLORS[key]}`} />
              {LABELS[key]}
            </span>
            <span className="tabular-nums text-gray-600">{value[key]}</span>
          </div>
          <input
            type="range"
            className="w-full accent-[var(--color-accent,#16a34a)]"
            min={0}
            max={100}
            step={1}
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) })}
          />
        </label>
      ))}

      <p className="text-xs font-medium text-gray-500" aria-live="polite">
        {allZero
          ? 'All weights are zero — every factor counts equally (25% each).'
          : 'Bar and labels show each weight’s share of the ranking score (100% total).'}
      </p>
    </fieldset>
  )
}
