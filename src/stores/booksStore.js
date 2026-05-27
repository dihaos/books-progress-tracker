import { reactive, computed, watch } from 'vue'
import { loadJSON, saveJSON, removeKey, storageHasKey } from '@/utils/storage.js'
import { todayKey } from '@/utils/date.js'
import { uid } from '@/utils/id.js'
import seedLibrary from '@/data/my-books-2026.json'

const BOOKS_KEY = 'books.v1'
const SCENARIOS_KEY = 'scenarios.v1'
const SETTINGS_KEY = 'settings.v1'

/**
 * Book — каталог библиотеки (без дедлайна).
 * Scenario — цель: название, дедлайн, список bookIds из библиотеки.
 */

function defaultSettings() {
  return {
    theme: 'system',
    weekStartsOn: 1,
    activeScenarioId: null
  }
}

const state = reactive({
  books: [],
  scenarios: [],
  settings: defaultSettings(),
  ready: false
})

function normalizeBook(raw) {
  if (!raw || typeof raw !== 'object') return null
  const totalPages = Math.max(1, Number(raw.totalPages) || 1)
  const currentPage = clampPage(
    raw.currentPage != null ? Number(raw.currentPage) : 0,
    totalPages
  )
  let startPage = clampPage(
    raw.startPage != null ? Number(raw.startPage) : currentPage,
    totalPages
  )
  const history =
    raw.history && typeof raw.history === 'object' && !Array.isArray(raw.history)
      ? { ...raw.history }
      : {}
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
    status: raw.status === 'finished' ? 'finished' : 'reading',
    finishedAt: raw.finishedAt || null,
    history
  }
}

function normalizeScenario(raw) {
  if (!raw || typeof raw !== 'object') return null
  const bookIds = Array.isArray(raw.bookIds)
    ? raw.bookIds.map((id) => String(id)).filter(Boolean)
    : []
  const deadline = raw.deadline && typeof raw.deadline === 'string' ? raw.deadline : null
  return {
    id: String(raw.id || uid()),
    title: String(raw.title || 'Новая цель').trim() || 'Новая цель',
    deadline,
    bookIds,
    createdAt: raw.createdAt || new Date().toISOString()
  }
}

function clampPage(page, total) {
  if (Number.isNaN(page)) return 0
  return Math.max(0, Math.min(total, Math.floor(page)))
}

function migrateLegacyFromRawBooks(rawBooks) {
  if (state.scenarios.length > 0 || !Array.isArray(rawBooks) || !rawBooks.length) return
  const deadline = rawBooks.find((b) => b.deadline)?.deadline || '2026-12-31'
  const bookIds = rawBooks
    .filter((b) => b.status !== 'finished')
    .map((b) => String(b.id))
    .filter(Boolean)
  if (!bookIds.length) return
  const scenario = normalizeScenario({
    id: 'scenario-reading-2026',
    title: 'Прочитать в 2026',
    deadline,
    bookIds,
    createdAt: new Date().toISOString()
  })
  state.scenarios.push(scenario)
  if (!state.settings.activeScenarioId) {
    state.settings.activeScenarioId = scenario.id
  }
}

function hydrate() {
  const rawBooks = loadJSON(BOOKS_KEY, null)
  const persistedScenarios = loadJSON(SCENARIOS_KEY, null)

  if (Array.isArray(persistedScenarios)) {
    state.scenarios = persistedScenarios.map(normalizeScenario).filter(Boolean)
  }

  if (!storageHasKey(BOOKS_KEY) && (!Array.isArray(rawBooks) || !rawBooks.length)) {
    const seedBooks = seedLibrary?.books
    if (Array.isArray(seedBooks) && seedBooks.length) {
      state.books = seedBooks.map(normalizeBook).filter(Boolean)
    }
    const seedScenarios = seedLibrary?.scenarios
    if (Array.isArray(seedScenarios) && seedScenarios.length) {
      state.scenarios = seedScenarios.map(normalizeScenario).filter(Boolean)
    }
  } else {
    migrateLegacyFromRawBooks(rawBooks)
    if (Array.isArray(rawBooks)) {
      state.books = rawBooks.map(normalizeBook).filter(Boolean)
    }
  }

  if (
    state.settings.activeScenarioId &&
    !state.scenarios.some((s) => s.id === state.settings.activeScenarioId)
  ) {
    state.settings.activeScenarioId = state.scenarios[0]?.id || null
  }
  if (!state.settings.activeScenarioId && state.scenarios.length) {
    state.settings.activeScenarioId = state.scenarios[0].id
  }

  const settings = loadJSON(SETTINGS_KEY, null)
  if (settings && typeof settings === 'object') {
    state.settings = { ...defaultSettings(), ...settings }
    if (
      state.settings.activeScenarioId &&
      !state.scenarios.some((s) => s.id === state.settings.activeScenarioId)
    ) {
      state.settings.activeScenarioId = state.scenarios[0]?.id || null
    }
  }

  state.ready = true
}

hydrate()

watch(() => state.books, (val) => saveJSON(BOOKS_KEY, val), { deep: true })
watch(() => state.scenarios, (val) => saveJSON(SCENARIOS_KEY, val), { deep: true })
watch(() => state.settings, (val) => saveJSON(SETTINGS_KEY, val), { deep: true })

// ---------- Scenario helpers ----------

export function getScenarioById(id) {
  return state.scenarios.find((s) => s.id === id) || null
}

export function getActiveScenario() {
  const id = state.settings.activeScenarioId
  if (!id) return null
  return getScenarioById(id)
}

export function scenarioBooks(scenario) {
  if (!scenario) return []
  return scenario.bookIds
    .map((id) => state.books.find((b) => b.id === id))
    .filter(Boolean)
}

function parseDayKey(key) {
  if (!key || typeof key !== 'string') return null
  const [y, m, d] = key.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function scenarioDaysLeftInclusive(scenario) {
  if (!scenario?.deadline) return null
  const today = parseDayKey(todayKey())
  const deadlineDate = parseDayKey(scenario.deadline)
  if (!today || !deadlineDate) return null
  const days = Math.round((deadlineDate - today) / 86400000) + 1
  return Math.max(1, days)
}

export function scenarioStats(scenario) {
  const books = scenarioBooks(scenario)
  const totalPages = books.reduce((s, b) => s + b.totalPages, 0)
  const readPages = books.reduce((s, b) => s + b.currentPage, 0)
  const pagesLeft = books.reduce(
    (s, b) => (b.status === 'finished' ? s : s + Math.max(0, b.totalPages - b.currentPage)),
    0
  )
  const finishedCount = books.filter(
    (b) => b.status === 'finished' || b.currentPage >= b.totalPages
  ).length
  const daysLeft = scenarioDaysLeftInclusive(scenario)
  const dailyPlan =
    pagesLeft > 0 && daysLeft != null ? Math.ceil(pagesLeft / daysLeft) : pagesLeft === 0 ? 0 : null

  return {
    books,
    bookCount: books.length,
    finishedCount,
    totalPages,
    readPages,
    pagesLeft,
    percent: totalPages ? (readPages / totalPages) * 100 : 0,
    daysLeft,
    dailyPlan,
    overdue:
      scenario?.deadline &&
      scenario.deadline < todayKey() &&
      pagesLeft > 0
  }
}

// ---------- Book progress helpers ----------

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

export function pagesReadToday(book) {
  const today = todayKey()
  const todayEnd =
    book.history[today] != null ? book.history[today] : book.currentPage
  const prev = lastEndBeforeDay(book, today)
  const base = prev != null ? prev : book.startPage
  return Math.max(0, todayEnd - base)
}

export function pagesRemaining(book) {
  return Math.max(0, book.totalPages - book.currentPage)
}

export function bookPercent(book) {
  return book.totalPages ? (book.currentPage / book.totalPages) * 100 : 0
}

// ---------- Mutations: books ----------

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
  return true
}

export function setCurrentPage(id, rawPage) {
  const book = state.books.find((b) => b.id === id)
  if (!book) return false
  const page = clampPage(Math.floor(Number(rawPage) || 0), book.totalPages)
  const today = todayKey()
  if (Object.keys(book.history).length === 0 && book.currentPage > book.startPage) {
    book.startPage = book.currentPage
  }
  book.currentPage = page
  book.history[today] = page

  if (page >= book.totalPages) {
    book.status = 'finished'
    book.finishedAt = today
  } else if (book.status === 'finished') {
    book.status = 'reading'
    book.finishedAt = null
  }
  return true
}

export function markBookFinished(id) {
  const book = state.books.find((b) => b.id === id)
  if (!book) return false
  const today = todayKey()
  if (Object.keys(book.history).length === 0 && book.currentPage > book.startPage) {
    book.startPage = book.currentPage
  }
  book.currentPage = book.totalPages
  book.history[today] = book.totalPages
  book.status = 'finished'
  book.finishedAt = today
  return true
}

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
  for (const scenario of state.scenarios) {
    const i = scenario.bookIds.indexOf(id)
    if (i !== -1) scenario.bookIds.splice(i, 1)
  }
  return true
}

// ---------- Mutations: scenarios ----------

export function addScenario(payload) {
  const scenario = normalizeScenario({
    id: uid(),
    title: payload.title,
    deadline: payload.deadline || null,
    bookIds: payload.bookIds || [],
    createdAt: new Date().toISOString()
  })
  state.scenarios.unshift(scenario)
  if (!state.settings.activeScenarioId) {
    state.settings.activeScenarioId = scenario.id
  }
  return scenario
}

export function updateScenario(id, patch) {
  const scenario = getScenarioById(id)
  if (!scenario) return false
  if (patch.title != null) {
    scenario.title = String(patch.title).trim() || scenario.title
  }
  if (patch.deadline !== undefined) {
    scenario.deadline = patch.deadline || null
  }
  if (patch.bookIds != null && Array.isArray(patch.bookIds)) {
    scenario.bookIds = patch.bookIds.map(String)
  }
  return true
}

export function removeScenario(id) {
  const idx = state.scenarios.findIndex((s) => s.id === id)
  if (idx === -1) return false
  state.scenarios.splice(idx, 1)
  if (state.settings.activeScenarioId === id) {
    state.settings.activeScenarioId = state.scenarios[0]?.id || null
  }
  return true
}

export function setActiveScenario(id) {
  if (id != null && !getScenarioById(id)) return false
  state.settings.activeScenarioId = id
  return true
}

export function addBookToScenario(scenarioId, bookId) {
  const scenario = getScenarioById(scenarioId)
  const book = state.books.find((b) => b.id === bookId)
  if (!scenario || !book) return false
  if (!scenario.bookIds.includes(bookId)) {
    scenario.bookIds.push(bookId)
  }
  return true
}

export function removeBookFromScenario(scenarioId, bookId) {
  const scenario = getScenarioById(scenarioId)
  if (!scenario) return false
  const idx = scenario.bookIds.indexOf(bookId)
  if (idx === -1) return false
  scenario.bookIds.splice(idx, 1)
  return true
}

export function resetAll() {
  state.books = []
  state.scenarios = []
  state.settings.activeScenarioId = null
}

export function exportData() {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    books: state.books,
    scenarios: state.scenarios,
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
  state.scenarios = Array.isArray(payload.scenarios)
    ? payload.scenarios.map(normalizeScenario).filter(Boolean)
    : []
  if (!state.scenarios.length) {
    migrateLegacyFromRawBooks(payload.books)
  }
  if (payload.settings && typeof payload.settings === 'object') {
    state.settings = { ...defaultSettings(), ...payload.settings }
  }
}

export function clearStorage() {
  removeKey(BOOKS_KEY)
  removeKey(SCENARIOS_KEY)
  removeKey(SETTINGS_KEY)
}

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
