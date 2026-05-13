import { reactive, computed, watch } from 'vue'
import { loadJSON, saveJSON, removeKey, storageHasKey } from '@/utils/storage.js'
import { todayKey } from '@/utils/date.js'
import { uid } from '@/utils/id.js'
import seedLibrary from '@/data/my-books-2026.json'

const BOOKS_KEY = 'books.v1'
const SETTINGS_KEY = 'settings.v1'

/**
 * Book shape:
 * {
 *   id: string,
 *   title: string,
 *   author: string,
 *   totalPages: number,
 *   startPage: number,        // baseline when book entered the tracker (not the live bookmark).
 *                              Used with history for “pages today” and “ещё не начал” if no history.
 *   currentPage: number,      // current bookmark (last marked page)
 *   addedAt: ISOString,
 *   startedAt: 'YYYY-MM-DD',  // calendar day when book was added
 *   deadline: 'YYYY-MM-DD' | null,
 *   status: 'reading' | 'finished',
 *   finishedAt: 'YYYY-MM-DD' | null,
 *   history: { 'YYYY-MM-DD': endPage }
 * }
 */

function defaultSettings() {
  return {
    theme: 'system',
    weekStartsOn: 1
  }
}

const state = reactive({
  books: [],
  settings: defaultSettings(),
  ready: false
})

function hydrate() {
  const persisted = loadJSON(BOOKS_KEY, null)
  if (Array.isArray(persisted)) {
    state.books = persisted.map(normalizeBook).filter(Boolean)
  }

  if (!storageHasKey(BOOKS_KEY) && state.books.length === 0) {
    const seed = seedLibrary?.books
    if (Array.isArray(seed) && seed.length) {
      state.books = seed.map(normalizeBook).filter(Boolean)
    }
  }

  const settings = loadJSON(SETTINGS_KEY, null)
  if (settings && typeof settings === 'object') {
    state.settings = { ...defaultSettings(), ...settings }
  }

  state.ready = true
}

function normalizeBook(raw) {
  if (!raw || typeof raw !== 'object') return null
  const totalPages = Math.max(1, Number(raw.totalPages) || 1)
  const currentPage = clampPage(
    raw.currentPage != null ? Number(raw.currentPage) : 0,
    totalPages
  )
  // startPage = baseline when book entered the tracker. If absent in raw data
  // (seed JSON, legacy export), default to currentPage so daily deltas count
  // only what was actually read inside the tracker, not pre-tracker progress.
  let startPage = clampPage(
    raw.startPage != null ? Number(raw.startPage) : currentPage,
    totalPages
  )
  const history =
    raw.history && typeof raw.history === 'object' && !Array.isArray(raw.history)
      ? { ...raw.history }
      : {}
  // Legacy migration: seed-style data persisted with startPage=0 and no history
  // would otherwise attribute all "already read" pages to the first edit day.
  if (startPage === 0 && currentPage > 0 && Object.keys(history).length === 0) {
    startPage = currentPage
  }
  return {
    id: String(raw.id || uid()),
    title: String(raw.title || 'Без названия'),
    author: String(raw.author || ''),
    totalPages,
    startPage,
    currentPage,
    addedAt: raw.addedAt || new Date().toISOString(),
    startedAt: raw.startedAt || todayKey(),
    deadline: raw.deadline || null,
    status: raw.status === 'finished' ? 'finished' : 'reading',
    finishedAt: raw.finishedAt || null,
    history
  }
}

function clampPage(page, total) {
  if (Number.isNaN(page)) return 0
  return Math.max(0, Math.min(total, Math.floor(page)))
}

hydrate()

watch(() => state.books, (val) => saveJSON(BOOKS_KEY, val), { deep: true })
watch(() => state.settings, (val) => saveJSON(SETTINGS_KEY, val), { deep: true })

// ---------- Derived helpers ----------

/** Greatest endPage from history for keys strictly before `key`. */
function lastEndBeforeDay(book, key) {
  let best = null
  for (const k of Object.keys(book.history)) {
    if (k < key) {
      const v = book.history[k]
      if (best === null || k > best.key) best = { key: k, value: v }
    }
  }
  return best ? best.value : null
}

/** Pages read today for a single book (delta of currentPage vs end of yesterday). */
export function pagesReadToday(book) {
  const today = todayKey()
  const todayEnd =
    book.history[today] != null ? book.history[today] : book.currentPage
  const prev = lastEndBeforeDay(book, today)
  const base = prev != null ? prev : book.startPage
  return Math.max(0, todayEnd - base)
}

/** Daily plan (recommended pages today) for a book given its deadline and progress so far. */
export function dailyPlan(book) {
  if (book.status !== 'reading') return null
  if (!book.deadline) return null
  const today = todayKey()
  const pagesLeft = Math.max(0, book.totalPages - book.currentPage)
  if (pagesLeft === 0) return 0
  const todayDate = parseDayKey(today)
  const deadlineDate = parseDayKey(book.deadline)
  if (!deadlineDate) return null
  const daysLeftInclusive = Math.max(
    1,
    Math.round((deadlineDate - todayDate) / 86400000) + 1
  )
  return Math.ceil(pagesLeft / daysLeftInclusive)
}

/** Whether the deadline has already passed (calendar day < today). */
export function isDeadlineOverdue(book) {
  if (!book.deadline) return false
  if (book.status === 'finished') return false
  const today = todayKey()
  return book.deadline < today && book.currentPage < book.totalPages
}

/** Pages remaining (no negatives). */
export function pagesRemaining(book) {
  return Math.max(0, book.totalPages - book.currentPage)
}

/** Reading completion percent for a single book. */
export function bookPercent(book) {
  return book.totalPages ? (book.currentPage / book.totalPages) * 100 : 0
}

function parseDayKey(key) {
  if (!key || typeof key !== 'string') return null
  const [y, m, d] = key.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

// ---------- Mutations ----------

export function addBook(payload) {
  const total = Math.max(1, Math.floor(Number(payload.totalPages) || 1))
  const start = clampPage(Math.floor(Number(payload.currentPage) || 0), total)
  const today = todayKey()
  const book = {
    id: uid(),
    title: String(payload.title || '').trim() || 'Без названия',
    author: String(payload.author || '').trim(),
    totalPages: total,
    startPage: start,
    currentPage: start,
    addedAt: new Date().toISOString(),
    startedAt: today,
    deadline: payload.deadline || null,
    status: start >= total ? 'finished' : 'reading',
    finishedAt: start >= total ? today : null,
    history: start > 0 ? { [today]: start } : {}
  }
  state.books.unshift(book)
  return book
}

export function updateBookFields(id, patch) {
  const book = state.books.find((b) => b.id === id)
  if (!book) return false
  if (patch.title != null) book.title = String(patch.title).trim() || book.title
  if (patch.author != null) book.author = String(patch.author).trim()
  if (patch.totalPages != null) {
    const total = Math.max(1, Math.floor(Number(patch.totalPages) || 1))
    book.totalPages = total
    if (book.currentPage > total) book.currentPage = total
    if (book.startPage > total) book.startPage = total
    Object.keys(book.history).forEach((k) => {
      if (book.history[k] > total) book.history[k] = total
    })
  }
  if (patch.deadline !== undefined) {
    book.deadline = patch.deadline || null
  }
  return true
}

/**
 * Sets the current page (bookmark). Stores today's end page snapshot in history,
 * so subsequent days can compute deltas.
 */
export function setCurrentPage(id, rawPage) {
  const book = state.books.find((b) => b.id === id)
  if (!book) return false
  const page = clampPage(Math.floor(Number(rawPage) || 0), book.totalPages)
  const today = todayKey()
  // First write to this book's history: lift the baseline so today's delta
  // counts only the freshly read pages, not the gap between startPage (often 0
  // for legacy/seed data) and the bookmark we already had before today.
  if (Object.keys(book.history).length === 0 && book.currentPage > book.startPage) {
    book.startPage = book.currentPage
  }
  book.currentPage = page
  book.history[today] = page

  if (page >= book.totalPages) {
    book.status = 'finished'
    book.finishedAt = today
  } else if (book.status === 'finished') {
    // user moved bookmark back — book is no longer finished
    book.status = 'reading'
    book.finishedAt = null
  }
  return true
}

/** Mark book as fully read regardless of currentPage. Does NOT touch history of prior days
 *  beyond setting today's snapshot, so streak/today calculations remain honest. */
export function markBookFinished(id) {
  const book = state.books.find((b) => b.id === id)
  if (!book) return false
  const today = todayKey()
  // Same baseline lift as in setCurrentPage: don't dump untracked progress
  // into today's stats when finishing a book that had no history yet.
  if (Object.keys(book.history).length === 0 && book.currentPage > book.startPage) {
    book.startPage = book.currentPage
  }
  book.currentPage = book.totalPages
  book.history[today] = book.totalPages
  book.status = 'finished'
  book.finishedAt = today
  return true
}

/** Reopen finished book — reset to currentPage from history or startPage. */
export function reopenBook(id) {
  const book = state.books.find((b) => b.id === id)
  if (!book) return false
  book.status = 'reading'
  book.finishedAt = null
  return true
}

export function removeBook(id) {
  const idx = state.books.findIndex((b) => b.id === id)
  if (idx === -1) return false
  state.books.splice(idx, 1)
  return true
}

export function resetAll() {
  state.books = []
}

export function exportData() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    books: state.books,
    settings: state.settings
  }
}

export function importData(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Некорректный файл прогресса')
  }
  if (!Array.isArray(payload.books)) {
    throw new Error('Файл не содержит данных о книгах')
  }
  state.books = payload.books.map(normalizeBook).filter(Boolean)
  if (payload.settings && typeof payload.settings === 'object') {
    state.settings = { ...defaultSettings(), ...payload.settings }
  }
}

export function clearStorage() {
  removeKey(BOOKS_KEY)
  removeKey(SETTINGS_KEY)
}

// ---------- Derived totals ----------

export const totalPagesAcrossAll = computed(() =>
  state.books.reduce((sum, b) => sum + b.totalPages, 0)
)

export const totalReadAcrossAll = computed(() =>
  state.books.reduce((sum, b) => sum + b.currentPage, 0)
)

export const overallPercent = computed(() => {
  const total = totalPagesAcrossAll.value
  return total ? (totalReadAcrossAll.value / total) * 100 : 0
})

export default state
