export function todayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function diffInDays(a, b) {
  const MS = 24 * 60 * 60 * 1000
  const aDate = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const bDate = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((aDate - bDate) / MS)
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function startOfWeek(date, weekStartsOn = 1) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const offset = (day - weekStartsOn + 7) % 7
  d.setDate(d.getDate() - offset)
  return d
}

const MONTHS_RU = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек'
]

export function formatShortDate(date) {
  return `${date.getDate()} ${MONTHS_RU[date.getMonth()]}`
}

export function formatLongDate(date) {
  return `${date.getDate()} ${MONTHS_RU[date.getMonth()]} ${date.getFullYear()}`
}
