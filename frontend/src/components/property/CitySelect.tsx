import { inputClass } from '../../lib/styles'
import type { City } from '../../types/property'

type Props = {
  cities: City[]
  value: string
  onChange: (cityId: string) => void
  disabled?: boolean
}

export default function CitySelect({ cities, value, onChange, disabled }: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">City</span>
      <select
        className={inputClass}
        value={value}
        disabled={disabled || cities.length === 0}
        onChange={(e) => onChange(e.target.value)}
      >
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
            {city.coverage !== 'full' ? ` (${city.coverage.replace(/_/g, ' ')})` : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
