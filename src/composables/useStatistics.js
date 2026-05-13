import { computed } from 'vue'
import state, {
  totalPagesAcrossAll,
  totalReadAcrossAll,
  overallPercent,
  dailyPlan
} from '@/stores/booksStore.js'
import { todayKey, addDays, parseKey, diffInDays } from '@/utils/date.js'

/**
 * Aggregates per-day pages read across all books.
 * For each book we walk its history in chronological order and emit deltas
 * relative to the previous known endPage (startPage for the first entry).
 */
function dailyTotalsMap() {
  const map = new Map()
  for (const book of state.books) {
    const keys = Object.keys(book.history).sort()
    let prev = book.startPage
    for (const k of keys) {
      const end = book.history[k]
      const delta = Math.max(0, end - prev)
      if (delta > 0) {
        map.set(k, (map.get(k) || 0) + delta)
      }
      prev = end
    }
  }
  return map
}

export function useStatistics() {
  const totals = computed(() => dailyTotalsMap())

  const todayPagesRead = computed(() => totals.value.get(todayKey()) || 0)

  const remaining = computed(() => totalPagesAcrossAll.value - totalReadAcrossAll.value)

  /** Streak — consecutive days, counting backwards from today (grace for today empty). */
  const streak = computed(() => {
    const keys = new Set(
      Array.from(totals.value.entries())
        .filter(([, v]) => v > 0)
        .map(([k]) => k)
    )
    if (keys.size === 0) return 0
    const today = new Date()
    let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (!keys.has(todayKey(cursor))) {
      cursor = addDays(cursor, -1)
      if (!keys.has(todayKey(cursor))) return 0
    }
    let count = 0
    while (keys.has(todayKey(cursor))) {
      count += 1
      cursor = addDays(cursor, -1)
    }
    return count
  })

  const bestStreak = computed(() => {
    const keys = Array.from(totals.value.entries())
      .filter(([, v]) => v > 0)
      .map(([k]) => k)
      .sort()
    if (keys.length === 0) return 0
    let best = 1
    let current = 1
    for (let i = 1; i < keys.length; i++) {
      const prev = parseKey(keys[i - 1])
      const cur = parseKey(keys[i])
      if (diffInDays(cur, prev) === 1) {
        current += 1
        best = Math.max(best, current)
      } else {
        current = 1
      }
    }
    return best
  })

  /** Sum of recommended pages today across reading books that have a deadline. */
  const todayPlanTotal = computed(() => {
    let total = 0
    let counted = 0
    for (const b of state.books) {
      if (b.status !== 'reading') continue
      const plan = dailyPlan(b)
      if (plan != null) {
        total += plan
        counted += 1
      }
    }
    return { total, counted }
  })

  /** Nearest deadline among reading books (returns Date or null). */
  const nearestDeadline = computed(() => {
    const reading = state.books
      .filter((b) => b.status === 'reading' && b.deadline)
      .map((b) => ({ book: b, date: parseKey(b.deadline) }))
      .filter((x) => x.date)
      .sort((a, b) => a.date - b.date)
    return reading[0] || null
  })

  /** Daily heatmap series for the last `days` calendar days, ordered oldest -> newest. */
  function heatmap(days = 119) {
    const today = new Date()
    const series = []
    const map = totals.value
    for (let i = days - 1; i >= 0; i--) {
      const date = addDays(today, -i)
      const key = todayKey(date)
      const value = map.get(key) || 0
      series.push({ date, key, value })
    }
    return series
  }

  return {
    totalPagesAcrossAll,
    totalReadAcrossAll,
    overallPercent,
    remaining,
    todayPagesRead,
    streak,
    bestStreak,
    todayPlanTotal,
    nearestDeadline,
    heatmap
  }
}
