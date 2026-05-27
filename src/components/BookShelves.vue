<script setup>
import { ref, computed, watch } from 'vue'
import { SHELF_ORDER, SHELF_META } from '@/utils/bookShelf.js'
import BookCard from './BookCard.vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  shelves: { type: Object, required: true },
  emptyMessage: { type: String, default: 'На этой полке пока пусто' },
  /** По умолчанию «Прочитано» свёрнуто, остальные полки открыты */
  collapseFinishedByDefault: { type: Boolean, default: true }
})

const emit = defineEmits(['open', 'add-pages'])

const orderedShelves = computed(() =>
  SHELF_ORDER.map((key) => ({
    ...SHELF_META[key],
    books: props.shelves[key] || []
  })).filter((s) => s.books.length > 0)
)

const hasAny = computed(() => orderedShelves.value.length > 0)

const openByKey = ref({})

function defaultOpen(key) {
  if (props.collapseFinishedByDefault && key === 'finished') return false
  return true
}

function isShelfOpen(key) {
  return openByKey.value[key] ?? defaultOpen(key)
}

function toggleShelf(key) {
  openByKey.value = { ...openByKey.value, [key]: !isShelfOpen(key) }
}

function shelfIcon(key) {
  if (key === 'finished') return 'check'
  if (key === 'reading') return 'book-open'
  return 'bookmark'
}

watch(
  orderedShelves,
  (shelves) => {
    const next = { ...openByKey.value }
    for (const s of shelves) {
      if (next[s.key] === undefined) next[s.key] = defaultOpen(s.key)
    }
    openByKey.value = next
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="!hasAny" class="card p-10 text-center text-sm text-ink-500 dark:text-ink-300">
    {{ emptyMessage }}
  </div>

  <div v-else class="space-y-4">
    <section
      v-for="shelf in orderedShelves"
      :key="shelf.key"
      class="relative rounded-2xl border border-ink-200/80 dark:border-ink-700/70
             bg-gradient-to-b from-sand-100/90 via-sand-50/40 to-ink-100/30
             dark:from-ink-800/80 dark:via-ink-900/40 dark:to-ink-950/30
             shadow-[inset_0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_2px_16px_rgba(0,0,0,0.25)]
             overflow-hidden"
    >
      <div
        v-if="isShelfOpen(shelf.key)"
        class="absolute inset-x-4 sm:inset-x-6 bottom-0 h-3 rounded-b-lg
               bg-gradient-to-t from-cocoa-900/15 to-transparent dark:from-black/40 pointer-events-none"
        aria-hidden="true"
      />

      <button
        type="button"
        class="w-full text-left px-4 sm:px-6 py-4 flex items-start gap-3
               hover:bg-ink-900/[0.03] dark:hover:bg-ink-50/[0.03] transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-sand-400/60 focus-visible:ring-inset"
        :aria-expanded="isShelfOpen(shelf.key)"
        :aria-controls="`shelf-panel-${shelf.key}`"
        @click="toggleShelf(shelf.key)"
      >
        <span
          class="grid place-items-center w-8 h-8 rounded-lg shrink-0 mt-0.5
                 bg-ink-50/90 dark:bg-ink-900/60 border border-ink-200/60 dark:border-ink-700/60"
        >
          <AppIcon :name="shelfIcon(shelf.key)" :size="16" />
        </span>

        <span class="min-w-0 flex-1">
          <span class="flex items-center gap-2 flex-wrap">
            <span class="font-display text-lg font-semibold tracking-tight">
              {{ shelf.title }}
            </span>
            <span class="chip tabular-nums">{{ shelf.books.length }}</span>
          </span>
          <span class="mt-1 block text-xs text-ink-500 dark:text-ink-400">
            {{ shelf.subtitle }}
          </span>
        </span>

        <span
          class="shrink-0 grid place-items-center w-8 h-8 rounded-lg text-ink-400
                 bg-ink-50/80 dark:bg-ink-900/50 border border-ink-200/50 dark:border-ink-700/50
                 transition-transform duration-200"
          :class="{ 'rotate-180': isShelfOpen(shelf.key) }"
          aria-hidden="true"
        >
          <AppIcon name="chevron-down" :size="16" />
        </span>
      </button>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="isShelfOpen(shelf.key)"
          :id="`shelf-panel-${shelf.key}`"
          class="px-4 sm:px-6 pb-6 sm:pb-8"
        >
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <BookCard
              v-for="(b, i) in shelf.books"
              :key="b.id"
              :book="b"
              class="animate-slide-up shadow-sm"
              :style="{ animationDelay: Math.min(i, 8) * 25 + 'ms' }"
              @open="emit('open', $event)"
              @add-pages="emit('add-pages', $event)"
            />
          </div>
        </div>
      </Transition>
    </section>
  </div>
</template>
