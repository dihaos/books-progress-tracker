<script setup>
import { ref, watch, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import HomePage from '@/pages/HomePage.vue'
import LibraryPage from '@/pages/LibraryPage.vue'
import GoalsPage from '@/pages/GoalsPage.vue'
import AuthPage from '@/pages/AuthPage.vue'
import SetupRequiredPage from '@/pages/SetupRequiredPage.vue'
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
import { useAuth } from '@/composables/useAuth.js'
import { isSupabaseConfigured } from '@/lib/supabase.js'
import state, { hydrateFromServer, disableCloudSync } from '@/stores/booksStore.js'
import { pageLabel } from '@/utils/format.js'

useTheme()

const view = ref('home')
const settingsOpen = ref(false)
const bootError = ref('')

const selectedBookId = ref(null)
const formOpen = ref(false)
const formBookId = ref(null)
const scenarioFormOpen = ref(false)
const scenarioFormId = ref(null)

const { books, setCurrentPage } = useBooks()
const { setActiveScenario } = useScenarios()
const toast = useToast()
const { fire } = useConfetti()
const { user, loading: authLoading, initAuth, signOut } = useAuth()

const appReady = ref(!isSupabaseConfigured)

onMounted(async () => {
  document.body.style.overflow = ''

  if (!isSupabaseConfigured) return

  try {
    await initAuth()
    if (user.value) {
      await hydrateFromServer(user.value.id)
    }
  } catch (err) {
    bootError.value = err.message || 'Не удалось загрузить приложение'
  } finally {
    appReady.value = true
  }
})

watch(user, async (next, prev) => {
  if (!isSupabaseConfigured) return

  if (next && !prev) {
    try {
      await hydrateFromServer(next.id)
      bootError.value = ''
    } catch (err) {
      bootError.value = err.message || 'Не удалось загрузить данные'
    }
  }

  if (!next && prev) {
    disableCloudSync()
    state.books = []
    state.scenarios = []
    state.settings.activeScenarioId = null
    state.ready = true
  }
})

async function onAuthSuccess() {
  if (!user.value) return
  try {
    await hydrateFromServer(user.value.id)
    bootError.value = ''
    toast.success('Добро пожаловать!', 'Вход выполнен')
  } catch (err) {
    bootError.value = err.message || 'Не удалось загрузить данные'
  }
}

async function onSignOut() {
  try {
    await signOut()
    toast.info('Вы вышли из аккаунта', 'Сессия')
  } catch (err) {
    toast.error(err.message || 'Не удалось выйти', 'Ошибка')
  }
}

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
  <SetupRequiredPage v-if="!isSupabaseConfigured" />

  <div
    v-else-if="authLoading || !appReady || (user && !state.ready)"
    class="min-h-full grid place-items-center px-4"
  >
    <div class="text-center space-y-2">
      <div class="text-sm text-ink-500 dark:text-ink-300">Загрузка…</div>
      <p v-if="bootError" class="text-sm text-red-600 dark:text-red-400 max-w-md">{{ bootError }}</p>
    </div>
  </div>

  <AuthPage v-else-if="!user" @success="onAuthSuccess" />

  <div v-else class="min-h-full flex flex-col">
    <div
      v-if="state.syncError"
      class="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200/70 dark:border-amber-500/20 px-4 py-2 text-xs text-amber-900 dark:text-amber-100 text-center"
    >
      Не удалось синхронизировать: {{ state.syncError }}
    </div>

    <AppHeader
      :view="view"
      :syncing="state.syncing"
      @navigate="navigate"
      @open-settings="settingsOpen = true"
      @add-book="openAddBook"
      @sign-out="onSignOut"
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
