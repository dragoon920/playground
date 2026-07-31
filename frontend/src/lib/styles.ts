export const inputClass =
  'w-full rounded-2xl border border-mist bg-surface px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/25'

/**
 * Native Windows arrows ignore padding — hide them and pair with a relative
 * wrapper + absolute chevron (see CitySelect / PropertyTypeSelect).
 */
export const selectClass = `${inputClass} appearance-none pr-12`

export const btnPrimary =
  'rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink hover:brightness-110'

export const btnNav =
  'rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink hover:brightness-110'

export const btnGhost =
  'rounded-full bg-card px-4 py-2 font-semibold text-ink hover:bg-mist/60'

export const btnDanger =
  'rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100'

export const cardClass = 'overflow-hidden rounded-[1.25rem] bg-card'

/** Text-only nav link — Apple-style, accent when active. */
export function navLink(active: boolean) {
  return `text-[0.95rem] font-medium tracking-tight transition-colors ${
    active ? 'text-accent' : 'text-ink hover:text-accent'
  }`
}
