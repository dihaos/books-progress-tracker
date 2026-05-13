export function pct(value, total) {
  if (!total) return 0
  return Math.max(0, Math.min(100, (value / total) * 100))
}

export function roundPct(value, total) {
  return Math.round(pct(value, total))
}

export function pluralRu(n, forms) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}

export function pageLabel(n) {
  return `${n} ${pluralRu(n, ['страница', 'страницы', 'страниц'])}`
}

export function bookLabel(n) {
  return `${n} ${pluralRu(n, ['книга', 'книги', 'книг'])}`
}

export function dayLabel(n) {
  return `${n} ${pluralRu(n, ['день', 'дня', 'дней'])}`
}
