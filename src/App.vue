<script setup>
import { ref, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import HomePage from '@/pages/HomePage.vue'
import LibraryPage from '@/pages/LibraryPage.vue'
import GoalsPage from '@/pages/GoalsPage.vue'
import ToastStack from '@/components/ToastStack.vue'
import ConfettiOverlay from '@/components/ConfettiOverlay.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import BookFormModal from '@/components/BookFormModal.vue'
import BookDetailModal from '@/components/BookDetailModal.vue'
import ScenarioFormModal from '@/components/ScenarioFormModal.vue'
import { useBooks } from '@/composables/useBooks.js'
import { useScenarios } from '@/composables/useScenarios.js'
import { useToast } from '@/composables/useToast.js'
import { useConfetti } from '@/composables/useConfetti.js'
import { useTheme } from '@/composables/useTheme.js'
import { pageLabel } from '@/utils/format.js'

useTheme()

const view = ref('home')
const settingsOpen = ref(false)

const selectedBookId = ref(null)
const formOpen = ref(false)
const formBookId = ref(null)
const scenarioFormOpen = ref(false)
const scenarioFormId = ref(null)

const { books, setCurrentPage } = useBooks()
const { setActiveScenario } = useScenarios()
const toast = useToast()
const { fire } = useConfetti()

onMounted(() => {
  document.body.style.overflow = ''
})

function navigate(v) {
  view.value = v
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function openBook(id) {
  selectedBookId.value = id
}

function closeBook() {
  selectedBookId.value = null
}

function openAddBook() {
  formBookId.value = null
  formOpen.value = true
}

function openEditBook(id) {
  formBookId.value = id
  formOpen.value = true
  closeBook()
}

function closeForm() {
  formOpen.value = false
  formBookId.value = null
}

function openCreateGoal() {
  scenarioFormId.value = null
  scenarioFormOpen.value = true
}

function openEditGoal(id) {
  scenarioFormId.value = id
  scenarioFormOpen.value = true
}

function closeScenarioForm() {
  scenarioFormOpen.value = false
  scenarioFormId.value = null
}

function onScenarioSaved(id) {
  if (id) setActiveScenario(id)
}

function addPages(bookId) {
  const book = books.value.find((b) => b.id === bookId)
  if (!book || book.progress.isComplete) return
  const wasComplete = book.progress.isComplete
  const next = Math.min(book.totalPages, book.currentPage + 1)
  setCurrentPage(bookId, next)
  toast.success(`«${book.title}» — ${pageLabel(1)}`, '+1 страница')
  const after = books.value.find((b) => b.id === bookId)
  if (!wasComplete && after?.progress.isComplete) {
    fire()
    toast.success(`«${after.title}» прочитана!`, 'Готово')
  }
}

function onBookCompleted(id) {
  const b = books.value.find((x) => x.id === id)
  if (b) {
    fire()
    toast.success(`«${b.title}» прочитана — поздравляем!`, 'Книга завершена')
  }
}
</script>

<template>
  <div class="min-h-full flex flex-col">
    <AppHeader
      :view="view"
      @navigate="navigate"
      @open-settings="settingsOpen = true"
      @add-book="openAddBook"
    />

    <HomePage
      v-if="view === 'home'"
      @open-book="openBook"
      @add-book="openAddBook"
      @manage-goals="navigate('goals')"
      @create-goal="openCreateGoal"
    />
    <LibraryPage
      v-else-if="view === 'library'"
      @open-book="openBook"
      @add-book="openAddBook"
      @add-pages="addPages"
    />
    <GoalsPage
      v-else-if="view === 'goals'"
      @open-book="openBook"
      @add-pages="addPages"
      @create-goal="openCreateGoal"
      @edit-goal="openEditGoal"
    />

    <ToastStack />
    <ConfettiOverlay />

    <SettingsPanel :open="settingsOpen" @close="settingsOpen = false" />

    <BookFormModal :open="formOpen" :book-id="formBookId" @close="closeForm" />

    <BookDetailModal
      :book-id="selectedBookId"
      @close="closeBook"
      @completed="onBookCompleted"
      @edit="openEditBook"
    />

    <ScenarioFormModal
      :open="scenarioFormOpen"
      :scenario-id="scenarioFormId"
      @close="closeScenarioForm"
      @saved="onScenarioSaved"
    />
  </div>
</template>
