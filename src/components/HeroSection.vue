<script setup>
import { computed } from 'vue'
import { useBooks } from '@/composables/useBooks.js'
import { useStatistics } from '@/composables/useStatistics.js'
import { pageLabel, bookLabel } from '@/utils/format.js'
import AppIcon from './AppIcon.vue'

const emit = defineEmits(['add-book'])

const { totalReadAcrossAll, totalPagesAcrossAll, overallPercent, books, finishedCount } = useBooks()
const { todayPagesRead, streak, nearestDeadline } = useStatistics()

const percent = computed(() =>
  totalPagesAcrossAll.value
    ? Math.round((totalReadAcrossAll.value / totalPagesAcrossAll.value) * 100)
    : 0
)

const headline = computed(() => {
  if (books.value.length === 0) {
    return 'Открой свою библиотеку.'
  }
  if (overallPercent.value >= 100) {
    return 'Все книги прочитаны.'
  }
  if (overallPercent.value >= 75) {
    return 'Финальная глава. Осталось совсем немного.'
  }
  if (overallPercent.value >= 40) {
    return 'Хороший ритм. Продолжай каждый день.'
  }
  return 'Каждая страница — шаг ближе к цели.'
})

const deadlineLabel = computed(() => {
  const nd = nearestDeadline.value
  if (!nd) return null
  return nd.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})
</script>

<template>
  <section
    id="top"
    class="relative overflow-hidden"
  >
    <div
      class="absolute inset-0 bg-library opacity-80 pointer-events-none"
      aria-hidden="true"
    />
    <div
      class="absolute inset-0 bg-grid-light dark:bg-grid-dark [background-size:24px_24px] opacity-50 pointer-events-none"
      aria-hidden="true"
    />

    <div class="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-8 sm:pb-10">
      <div class="flex items-center gap-2 mb-6 animate-fade-in">
        <span class="chip">
          <AppIcon name="library" :size="12" />
          {{ bookLabel(books.length) }} в библиотеке
        </span>
        <span class="chip">
          <AppIcon name="book-open" :size="12" />
          {{ pageLabel(totalPagesAcrossAll) }} в сумме
        </span>
      </div>

      <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
        <div class="lg:col-span-7 animate-slide-up">
          <h1
            class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.05]"
          >
            {{ headline }}
          </h1>
          <p class="mt-4 max-w-xl text-base sm:text-lg text-ink-500 dark:text-ink-300 text-balance">
            Личный трекер чтения. Веди книги, ставь дедлайны, отмечай страницы — план на каждый
            день пересчитается автоматически.
          </p>

          <div class="mt-6 flex flex-wrap items-center gap-2">
            <button class="btn-primary" @click="emit('add-book')">
              <AppIcon name="plus" :size="16" />
              Добавить книгу
            </button>
            <a href="#progress" class="btn-ghost">
              <AppIcon name="trending" :size="16" />
              Открыть прогресс
            </a>
            <a href="#books" class="btn-ghost">
              <AppIcon name="library" :size="16" />
              Все книги
            </a>
          </div>
        </div>

        <div class="lg:col-span-5">
          <div
            class="glass-strong rounded-3xl p-5 sm:p-6 shadow-card animate-slide-up"
            style="animation-delay: 80ms"
          >
            <div class="flex items-baseline justify-between">
              <div>
                <div class="label">Общий прогресс</div>
                <div class="mt-1 flex items-baseline gap-2">
                  <div class="font-display text-5xl font-bold tabular-nums">
                    {{ percent }}<span class="text-2xl text-ink-400">%</span>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="label">Прочитано</div>
                <div class="mt-1 text-2xl font-semibold tabular-nums">
                  {{ totalReadAcrossAll }}<span class="text-ink-400">/{{ totalPagesAcrossAll }}</span>
                </div>
              </div>
            </div>

            <div class="mt-5 h-2 rounded-full bg-ink-200/70 dark:bg-ink-700/70 overflow-hidden">
              <div
                class="relative h-full rounded-full bg-gradient-to-r from-sand-500 via-cocoa-500 to-sand-400
                       transition-[width] duration-700 ease-out progress-shine"
                :style="{ width: overallPercent + '%' }"
              />
            </div>

            <div class="mt-5 grid grid-cols-3 gap-2 text-sm">
              <div class="rounded-xl bg-ink-50/70 dark:bg-ink-900/40 border border-ink-200/60 dark:border-ink-700/60 px-3 py-2.5">
                <div class="label">Сегодня</div>
                <div class="mt-0.5 font-semibold tabular-nums">{{ pageLabel(todayPagesRead) }}</div>
              </div>
              <div class="rounded-xl bg-ink-50/70 dark:bg-ink-900/40 border border-ink-200/60 dark:border-ink-700/60 px-3 py-2.5">
                <div class="label">Streak</div>
                <div class="mt-0.5 font-semibold tabular-nums flex items-center gap-1">
                  <AppIcon name="flame" :size="14" class="text-sand-600 dark:text-sand-400" />
                  {{ streak }}
                </div>
              </div>
              <div class="rounded-xl bg-ink-50/70 dark:bg-ink-900/40 border border-ink-200/60 dark:border-ink-700/60 px-3 py-2.5">
                <div class="label">Книг готово</div>
                <div class="mt-0.5 font-semibold tabular-nums">{{ finishedCount }}/{{ books.length }}</div>
              </div>
            </div>

            <div
              v-if="deadlineLabel"
              class="mt-4 flex items-center gap-2 text-xs text-ink-500 dark:text-ink-300"
            >
              <AppIcon name="calendar" :size="14" />
              Ближайший дедлайн —
              <span class="font-medium text-ink-700 dark:text-ink-100">{{ deadlineLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
