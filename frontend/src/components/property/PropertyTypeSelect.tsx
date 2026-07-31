import { selectClass } from '../../lib/styles'
import type { PropertyType } from '../../types/property'
import SelectChevron from './SelectChevron'

const OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'apartment', label: 'Apartment' },
]

type Props = {
  value: PropertyType
  onChange: (next: PropertyType) => void
  disabled?: boolean
}

export default function PropertyTypeSelect({ value, onChange, disabled }: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">Property type</span>
      <span className="relative block">
        <select
          className={selectClass}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as PropertyType)}
        >
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <SelectChevron />
      </span>
    </label>
  )
}
