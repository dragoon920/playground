export const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'

export const btnPrimary =
  'rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink hover:brightness-105'

export const btnGhost =
  'rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-900 hover:bg-gray-50'

export const btnDanger =
  'rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50'

export const cardClass = 'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'

export function navBtn(active: boolean) {
  return `rounded-lg border px-4 py-2 font-semibold ${
    active
      ? 'border-accent bg-accent text-accent-ink'
      : 'border-gray-200 bg-gray-100 text-gray-500 hover:text-gray-900'
  }`
}
