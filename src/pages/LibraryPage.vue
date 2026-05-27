<script setup>
import { ref, computed } from 'vue'
import { useBooks } from '@/composables/useBooks.js'
import { groupBooksByShelf } from '@/utils/bookShelf.js'
import BookShelves from '@/components/BookShelves.vue'
import SearchAndFilter from '@/components/SearchAndFilter.vue'
import AppIcon from '@/components/AppIcon.vue'

const emit = defineEmits(['open-book', 'add-book', 'add-pages'])

const { books, finishedCount, readingCount, queueCount } = useBooks()

const search = ref('')
const filter = ref('all')

const counts = computed(() => ({
  all: books.value.length,
  completed: finishedCount.value,
  progress: readingCount.value,
  idle: queueCount.value
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

const shelves = computed(() => groupBooksByShelf(filtered.value))
</script>

<template>
  <main id="library">
    <section class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-4">
      <div class="flex items-baseline justify-between gap-3">
        <div>
          <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight">Библиотека</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-300">
            Все книги без дедлайнов — добавляй в цели отдельно
          </p>
        </div>
        <button type="button" class="btn-primary h-9" @click="emit('add-book')">
          <AppIcon name="plus" :size="16" />
          <span class="hidden sm:inline">Добавить книгу</span>
        </button>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-6">
      <SearchAndFilter v-model:search="search" v-model:filter="filter" :counts="counts" />
    </section>

    <section class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-12">
      <BookShelves
        v-if="filtered.length"
        :shelves="shelves"
        empty-message="Ничего на полках"
        @open="emit('open-book', $event)"
        @add-pages="emit('add-pages', $event)"
      />

      <div v-else-if="!books.length" class="card p-10 text-center">
        <AppIcon name="book" :size="24" class="mx-auto text-ink-300" />
        <p class="mt-3 font-display font-semibold text-lg">Библиотека пуста</p>
        <p class="mt-1 text-sm text-ink-500 dark:text-ink-300">
          Добавь первую книгу — название, автор и число страниц.
        </p>
        <button type="button" class="mt-4 btn-primary" @click="emit('add-book')">
          Добавить книгу
        </button>
      </div>

      <div v-else class="card p-10 text-center">
        <p class="font-display font-semibold">Ничего не найдено</p>
        <p class="mt-1 text-sm text-ink-500">Смени запрос или фильтр.</p>
      </div>
    </section>
  </main>
</template>
