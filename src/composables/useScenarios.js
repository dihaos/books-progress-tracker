import { computed } from 'vue'
import state, {
  getScenarioById,
  getActiveScenario,
  scenarioBooks,
  scenarioStats,
  addScenario,
  updateScenario,
  removeScenario,
  setActiveScenario,
  addBookToScenario,
  removeBookFromScenario
} from '@/stores/booksStore.js'
import { useBooks } from '@/composables/useBooks.js'

export function useScenarios() {
  const { books } = useBooks()

  const scenarios = computed(() =>
    state.scenarios.map((s) => ({
      ...s,
      stats: scenarioStats(s),
      books: scenarioBooks(s).map((b) => {
        const enriched = books.value.find((x) => x.id === b.id)
        return enriched || b
      })
    }))
  )

  const activeScenario = computed(() => {
    const s = getActiveScenario()
    if (!s) return null
    return {
      ...s,
      stats: scenarioStats(s),
      books: scenarioBooks(s).map((b) => {
        const enriched = books.value.find((x) => x.id === b.id)
        return enriched || b
      })
    }
  })

  const activeScenarioStats = computed(() => {
    const s = getActiveScenario()
    return s ? scenarioStats(s) : null
  })

  const booksNotInScenario = (scenarioId) =>
    computed(() => {
      const scenario = getScenarioById(scenarioId)
      const ids = new Set(scenario?.bookIds || [])
      return books.value.filter((b) => !ids.has(b.id))
    })

  return {
    scenarios,
    activeScenario,
    activeScenarioStats,
    activeScenarioId: computed(() => state.settings.activeScenarioId),
    addScenario,
    updateScenario,
    removeScenario,
    setActiveScenario,
    addBookToScenario,
    removeBookFromScenario,
    getScenarioById,
    scenarioStats,
    booksNotInScenario
  }
}
