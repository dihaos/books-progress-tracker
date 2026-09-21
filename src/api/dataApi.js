import { getSupabase } from '@/lib/supabase.js'

function bookToRow(book, userId) {
  return {
    id: book.id,
    user_id: userId,
    title: book.title,
    author: book.author,
    total_pages: book.totalPages,
    start_page: book.startPage,
    current_page: book.currentPage,
    added_at: book.addedAt,
    started_at: book.startedAt,
    status: book.status,
    finished_at: book.finishedAt,
    history: book.history || {},
    updated_at: new Date().toISOString()
  }
}

function rowToBook(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    totalPages: row.total_pages,
    startPage: row.start_page,
    currentPage: row.current_page,
    addedAt: row.added_at,
    startedAt: row.started_at,
    status: row.status,
    finishedAt: row.finished_at,
    history: row.history || {}
  }
}

function scenarioToRow(scenario, userId) {
  return {
    id: scenario.id,
    user_id: userId,
    title: scenario.title,
    deadline: scenario.deadline,
    created_at: scenario.createdAt,
    updated_at: new Date().toISOString()
  }
}

function rowToScenario(row, bookIds) {
  return {
    id: row.id,
    title: row.title,
    deadline: row.deadline,
    bookIds: bookIds || [],
    createdAt: row.created_at
  }
}

function settingsToRow(settings, userId) {
  return {
    user_id: userId,
    theme: settings.theme,
    week_starts_on: settings.weekStartsOn,
    active_scenario_id: settings.activeScenarioId,
    updated_at: new Date().toISOString()
  }
}

function rowToSettings(row, defaults) {
  return {
    theme: row?.theme ?? defaults.theme,
    weekStartsOn: row?.week_starts_on ?? defaults.weekStartsOn,
    activeScenarioId: row?.active_scenario_id ?? defaults.activeScenarioId
  }
}

export async function fetchUserData(userId, defaultSettings) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase не настроен')

  const [booksRes, scenariosRes, linksRes, settingsRes] = await Promise.all([
    supabase.from('books').select('*').eq('user_id', userId),
    supabase.from('scenarios').select('*').eq('user_id', userId),
    supabase.from('scenario_books').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()
  ])

  if (booksRes.error) throw booksRes.error
  if (scenariosRes.error) throw scenariosRes.error
  if (linksRes.error) throw linksRes.error
  if (settingsRes.error) throw settingsRes.error

  const linksByScenario = new Map()
  for (const link of linksRes.data || []) {
    if (!linksByScenario.has(link.scenario_id)) {
      linksByScenario.set(link.scenario_id, [])
    }
    linksByScenario.get(link.scenario_id).push(link.book_id)
  }

  return {
    books: (booksRes.data || []).map(rowToBook),
    scenarios: (scenariosRes.data || []).map((row) =>
      rowToScenario(row, linksByScenario.get(row.id) || [])
    ),
    settings: rowToSettings(settingsRes.data, defaultSettings)
  }
}

export async function syncUserData(userId, { books, scenarios, settings }) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase не настроен')

  const bookRows = books.map((book) => bookToRow(book, userId))
  const scenarioRows = scenarios.map((scenario) => scenarioToRow(scenario, userId))
  const linkRows = []

  scenarios.forEach((scenario) => {
    ;(scenario.bookIds || []).forEach((bookId, index) => {
      linkRows.push({
        scenario_id: scenario.id,
        book_id: bookId,
        user_id: userId,
        sort_order: index
      })
    })
  })

  const settingsRow = settingsToRow(settings, userId)

  const { data: existingBooks } = await supabase
    .from('books')
    .select('id')
    .eq('user_id', userId)
  const { data: existingScenarios } = await supabase
    .from('scenarios')
    .select('id')
    .eq('user_id', userId)

  const bookIds = new Set(books.map((b) => b.id))
  const scenarioIds = new Set(scenarios.map((s) => s.id))

  const booksToDelete = (existingBooks || [])
    .map((row) => row.id)
    .filter((id) => !bookIds.has(id))
  const scenariosToDelete = (existingScenarios || [])
    .map((row) => row.id)
    .filter((id) => !scenarioIds.has(id))

  if (booksToDelete.length) {
    const { error } = await supabase.from('books').delete().in('id', booksToDelete)
    if (error) throw error
  }

  if (scenariosToDelete.length) {
    const { error } = await supabase.from('scenarios').delete().in('id', scenariosToDelete)
    if (error) throw error
  }

  if (bookRows.length) {
    const { error } = await supabase.from('books').upsert(bookRows, { onConflict: 'id' })
    if (error) throw error
  }

  if (scenarioRows.length) {
    const { error } = await supabase.from('scenarios').upsert(scenarioRows, { onConflict: 'id' })
    if (error) throw error
  }

  const { error: deleteLinksError } = await supabase
    .from('scenario_books')
    .delete()
    .eq('user_id', userId)
  if (deleteLinksError) throw deleteLinksError

  if (linkRows.length) {
    const { error } = await supabase.from('scenario_books').insert(linkRows)
    if (error) throw error
  }

  const { error: settingsError } = await supabase
    .from('user_settings')
    .upsert(settingsRow, { onConflict: 'user_id' })
  if (settingsError) throw settingsError
}

export async function clearUserData(userId) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase не настроен')

  const tables = ['scenario_books', 'books', 'scenarios', 'user_settings']
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) throw error
  }
}

export async function importUserData(userId, payload, defaultSettings) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase не настроен')

  await clearUserData(userId)

  const books = Array.isArray(payload.books) ? payload.books : []
  const scenarios = Array.isArray(payload.scenarios) ? payload.scenarios : []
  const settings =
    payload.settings && typeof payload.settings === 'object'
      ? { ...defaultSettings, ...payload.settings }
      : defaultSettings

  await syncUserData(userId, { books, scenarios, settings })
  return fetchUserData(userId, defaultSettings)
}
