<script setup>
import { ref, computed } from 'vue'
import { useBooks } from '@/composables/useBooks.js'
import { useToast } from '@/composables/useToast.js'
import { useConfetti } from '@/composables/useConfetti.js'
import { pageLabel } from '@/utils/format.js'

import HeroSection from '@/components/HeroSection.vue'
import GlobalProgressBar from '@/components/GlobalProgressBar.vue'
import MotivationalBlock from '@/components/MotivationalBlock.vue'
import StatisticsBlock from '@/components/StatisticsBlock.vue'
import ActivityHeatmap from '@/components/ActivityHeatmap.vue'
import SearchAndFilter from '@/components/SearchAndFilter.vue'
import BookCard from '@/components/BookCard.vue'
import BookDetailModal from '@/components/BookDetailModal.vue'
import BookFormModal from '@/components/BookFormModal.vue'
import AppIcon from '@/components/AppIcon.vue'

const {
  books,
  setCurrentPage,
  finishedCount,
  readingCount,
  idleCount
} = useBooks()
const toast = useToast()
const { fire } = useConfetti()

const search = ref('')
const filter = ref('all')
const selectedBookId = ref(null)

const formOpen = ref(false)
const formBookId = ref(null)

const counts = computed(() => ({
  all: books.value.length,
  completed: finishedCount.value,
  progress: readingCount.value,
  idle: idleCount.value
}))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return books.value.filter((b) => {
    if (filter.value === 'completed' && !b.progress.isComplete) return false
    if (filter.value === 'progress' && !b.progress.isInProgress) return false
    if (filter.value === 'idle' && !b.progress.isNotStarted) return false
    if (!q) return true
    return (
      b.title.toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q)
    )
  })
})

function openBook(id) {
  selectedBookId.value = id
}

function closeBook() {
  selectedBookId.value = null
}

function openAddForm() {
  formBookId.value = null
  formOpen.value = true
}

function openEditForm(id) {
  formBookId.value = id
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  formBookId.value = null
}

function addPages(bookId) {
  const book = books.value.find((b) => b.id === bookId)
  if (!book || book.progress.isComplete) return
  const wasComplete = book.progress.isComplete
  const next = Math.min(book.totalPages, book.currentPage + 1)
  setCurrentPage(bookId, next)
  toast.success(`«${book.title}» — отмечено ${pageLabel(1)}`, '+1 страница')
  const after = books.value.find((b) => b.id === bookId)
  if (!wasComplete && after?.progress.isComplete) {
    handleCompletion(after)
  }
}

function handleCompletion(book) {
  fire()
  toast.success(
    `«${book.title}» прочитана — поздравляем!`,
    'Книга завершена'
  )
}
</script>

<template>
  <main>
    <HeroSection @add-book="openAddForm" />

    <MotivationalBlock />

    <GlobalProgressBar @select-book="openBook" />

    <StatisticsBlock />

    <ActivityHeatmap />

    <section id="books" class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div class="flex items-baseline justify-between mb-4 gap-3">
        <div>
          <h2 class="font-display text-lg sm:text-xl font-semibold tracking-tight">
            Моя библиотека
          </h2>
          <p class="mt-0.5 text-sm text-ink-500 dark:text-ink-300">
            Отмечай страницы и не теряй закладку
          </p>
        </div>
        <button class="btn-primary h-9" @click="openAddForm">
          <AppIcon name="plus" :size="16" />
          <span class="hidden sm:inline">Добавить книгу</span>
        </button>
      </div>

      <SearchAndFilter
        v-model:search="search"
        v-model:filter="filter"
        :counts="counts"
      />

      <div
        v-if="filtered.length"
        class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <BookCard
          v-for="(b, i) in filtered"
          :key="b.id"
          :book="b"
          class="animate-slide-up"
          :style="{ animationDelay: Math.min(i, 12) * 30 + 'ms' }"
          @open="openBook"
          @add-pages="addPages"
        />
      </div>

      <div
        v-else-if="!books.length"
        class="card p-10 text-center"
      >
        <div class="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-sand-100 text-sand-700 dark:bg-sand-500/15 dark:text-sand-300">
          <AppIcon name="book" :size="20" />
        </div>
        <div class="mt-3 font-display font-semibold text-lg">Библиотека пуста</div>
        <div class="mt-1 text-sm text-ink-500 dark:text-ink-300">
          Добавь первую книгу — план чтения посчитается автоматически.
        </div>
        <button class="mt-4 btn-primary" @click="openAddForm">
          <AppIcon name="plus" :size="16" />
          Добавить книгу
        </button>
      </div>

      <div v-else class="card p-10 text-center">
        <div class="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-ink-100 dark:bg-ink-700/70 text-ink-400">
          <AppIcon name="search" :size="20" />
        </div>
        <div class="mt-3 font-display font-semibold text-lg">Ничего не найдено</div>
        <div class="mt-1 text-sm text-ink-500 dark:text-ink-300">
          Попробуй другой запрос или сними фильтр.
        </div>
      </div>
    </section>

    <footer class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 text-center text-xs text-ink-400">
      <div class="divider mb-6" />
      <p>
        Сделано с заботой. Каждая страница — кирпичик в твоей библиотеке.
      </p>
    </footer>

    <BookDetailModal
      :book-id="selectedBookId"
      @close="closeBook"
      @completed="(id) => {
        const b = books.find((x) => x.id === id)
        if (b) handleCompletion(b)
      }"
      @edit="(id) => {
        closeBook()
        openEditForm(id)
      }"
    />

    <BookFormModal
      :open="formOpen"
      :book-id="formBookId"
      @close="closeForm"
    />
  </main>
</template>
