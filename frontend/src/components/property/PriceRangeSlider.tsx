import { inputClass } from '../../lib/styles'

const AUD = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

type Props = {
  min: number
  max: number
  absoluteMin?: number
  absoluteMax?: number
  step?: number
  onChange: (next: { min: number; max: number }) => void
  disabled?: boolean
}

export default function PriceRangeSlider({
  min,
  max,
  absoluteMin = 200_000,
  absoluteMax = 5_000_000,
  step = 50_000,
  onChange,
  disabled,
}: Props) {
  const span = absoluteMax - absoluteMin
  const minPct = ((min - absoluteMin) / span) * 100
  const maxPct = ((max - absoluteMin) / span) * 100

  // When both thumbs sit together at the top, the min thumb needs to be on top to stay draggable.
  const minThumbOnTop = min > absoluteMax - span * 0.03

  function setMin(next: number) {
    onChange({ min: Math.min(Math.max(next, absoluteMin), max), max })
  }

  function setMax(next: number) {
    onChange({ min, max: Math.max(Math.min(next, absoluteMax), min) })
  }

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium text-ink">Price range</legend>
      <p className="text-sm text-ink/60">
        {AUD.format(min)} – {AUD.format(max)}
      </p>

      <div className="relative h-5">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-mist" />
        <div
          className={`absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full ${
            disabled ? 'bg-ink/30' : 'bg-accent'
          }`}
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          className="range-dual"
          style={{ zIndex: minThumbOnTop ? 4 : 3 }}
          min={absoluteMin}
          max={absoluteMax}
          step={step}
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          aria-label="Minimum price"
        />
        <input
          type="range"
          className="range-dual"
          style={{ zIndex: minThumbOnTop ? 3 : 4 }}
          min={absoluteMin}
          max={absoluteMax}
          step={step}
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          aria-label="Maximum price"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          className={inputClass}
          min={absoluteMin}
          max={max}
          step={step}
          value={min}
          onChange={(e) => setMin(Number(e.target.value) || absoluteMin)}
          aria-label="Minimum price value"
        />
        <input
          type="number"
          className={inputClass}
          min={min}
          max={absoluteMax}
          step={step}
          value={max}
          onChange={(e) => setMax(Number(e.target.value) || absoluteMax)}
          aria-label="Maximum price value"
        />
      </div>
    </fieldset>
  )
}
