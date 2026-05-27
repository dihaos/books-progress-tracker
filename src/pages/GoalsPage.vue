<script setup>
import { ref, computed } from 'vue'
import { useScenarios } from '@/composables/useScenarios.js'
import { parseKey } from '@/utils/date.js'
import { pageLabel, dayLabel } from '@/utils/format.js'
import { groupBooksByShelf } from '@/utils/bookShelf.js'
import BookShelves from '@/components/BookShelves.vue'
import AppIcon from '@/components/AppIcon.vue'

const emit = defineEmits(['open-book', 'add-pages', 'create-goal', 'edit-goal'])

const { scenarios, setActiveScenario, activeScenarioId, removeScenario } = useScenarios()

const expandedId = ref(null)

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function formatDeadline(key) {
  const d = parseKey(key)
  return d?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) || key
}

function daysUntil(deadline) {
  const today = new Date()
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const d = parseKey(deadline)
  if (!d) return null
  return Math.round((d - t0) / 86400000)
}

function confirmDelete(s) {
  if (confirm(`Удалить цель «${s.title}»? Книги останутся в библиотеке.`)) {
    removeScenario(s.id)
    if (expandedId.value === s.id) expandedId.value = null
  }
}
</script>

<template>
  <main id="goals-page">
    <section class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-6">
      <div class="flex items-baseline justify-between gap-3">
        <div>
          <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight">Цели</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-300">
            Сценарии чтения с дедлайном и набором книг из библиотеки
          </p>
        </div>
        <button type="button" class="btn-primary h-9" @click="emit('create-goal')">
          <AppIcon name="plus" :size="16" />
          Новая цель
        </button>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-12 space-y-6">
      <div v-if="!scenarios.length" class="card p-10 text-center">
        <AppIcon name="target" :size="24" class="mx-auto text-ink-300" />
        <p class="mt-3 font-display font-semibold">Пока нет целей</p>
        <p class="mt-1 text-sm text-ink-500 dark:text-ink-300 max-w-md mx-auto">
          Создай сценарий, например «Прочитать 12 книг в 2026», выбери книги и дедлайн.
        </p>
        <button type="button" class="mt-4 btn-primary" @click="emit('create-goal')">
          Создать сценарий
        </button>
      </div>

      <article
        v-for="s in scenarios"
        :key="s.id"
        class="card overflow-hidden"
      >
        <header
          class="p-5 sm:p-6 cursor-pointer hover:bg-ink-50/50 dark:hover:bg-ink-900/30 transition-colors"
          @click="toggleExpand(s.id)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="font-display text-lg font-semibold">{{ s.title }}</h2>
                <span
                  v-if="s.id === activeScenarioId"
                  class="chip text-[10px] uppercase tracking-wider bg-sand-100 dark:bg-sand-500/15 text-sand-800 dark:text-sand-200"
                >
                  Активная
                </span>
              </div>
              <p v-if="s.deadline" class="mt-1 text-sm text-ink-500 flex items-center gap-1.5">
                <AppIcon name="calendar" :size="12" />
                {{ formatDeadline(s.deadline) }}
                <template v-if="daysUntil(s.deadline) != null">
                  ·
                  <span v-if="daysUntil(s.deadline) < 0" class="text-amber-700 dark:text-amber-300">
                    просрочено
                  </span>
                  <span v-else-if="daysUntil(s.deadline) === 0">сегодня</span>
                  <span v-else>через {{ dayLabel(daysUntil(s.deadline)) }}</span>
                </template>
              </p>
              <p class="mt-2 text-xs text-ink-400">
                {{ s.stats.finishedCount }}/{{ s.stats.bookCount }} книг ·
                {{ pageLabel(s.stats.pagesLeft) }} осталось ·
                план {{ s.stats.dailyPlan ?? '—' }} стр/день
              </p>
            </div>
            <AppIcon
              name="chevron-right"
              :size="16"
              class="shrink-0 text-ink-400 transition-transform mt-1"
              :class="{ 'rotate-90': expandedId === s.id }"
            />
          </div>
        </header>

        <div v-if="expandedId === s.id" class="border-t border-ink-200/70 dark:border-ink-700/60 px-4 sm:px-6 py-5">
          <div class="flex flex-wrap gap-2 mb-5">
            <button
              v-if="s.id !== activeScenarioId"
              type="button"
              class="btn-soft h-8 text-xs"
              @click.stop="setActiveScenario(s.id)"
            >
              Сделать активной
            </button>
            <button type="button" class="btn-soft h-8 text-xs" @click.stop="emit('edit-goal', s.id)">
              <AppIcon name="edit" :size="12" />
              Изменить
            </button>
            <button
              type="button"
              class="btn-ghost h-8 text-xs text-amber-700 dark:text-amber-300"
              @click.stop="confirmDelete(s)"
            >
              Удалить
            </button>
          </div>

          <BookShelves
            v-if="s.books.length"
            :shelves="groupBooksByShelf(s.books)"
            empty-message="Нет книг в цели"
            @open="emit('open-book', $event)"
            @add-pages="emit('add-pages', $event)"
          />
          <p v-else class="text-sm text-ink-500 text-center py-6">
            Добавь книги при редактировании цели.
          </p>
        </div>
      </article>
    </section>
  </main>
</template>
