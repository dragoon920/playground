export const inputClass =
  'w-full rounded-xl border border-mist bg-surface px-4 py-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'

export const btnPrimary =
  'rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink hover:brightness-105'

export const btnNav =
  'rounded-full bg-accent px-5 py-2.5 font-semibold text-ink hover:brightness-105'

export const btnGhost =
  'rounded-full border border-mist bg-surface px-4 py-2 font-semibold text-ink hover:bg-canvas'

export const btnDanger =
  'rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50'

export const cardClass = 'overflow-hidden rounded-2xl border border-mist bg-surface shadow-sm'

/** Text-only nav link in the August Ash style, using current theme colours. */
export function navLink(active: boolean) {
  return `text-[0.95rem] font-semibold tracking-tight transition-colors ${
    active ? 'text-accent' : 'text-ink hover:text-accent'
  }`
}
