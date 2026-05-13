<script setup>
import { computed } from 'vue'
import { useStatistics } from '@/composables/useStatistics.js'
import { useBooks } from '@/composables/useBooks.js'
import { pageLabel, dayLabel } from '@/utils/format.js'
import AppIcon from './AppIcon.vue'

const {
  totalReadAcrossAll,
  totalPagesAcrossAll,
  remaining,
  overallPercent,
  streak,
  bestStreak,
  todayPagesRead,
  nearestDeadline
} = useStatistics()
const { finishedCount, books } = useBooks()

const deadlineLabel = computed(() => {
  const nd = nearestDeadline.value
  if (!nd) return null
  return nd.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})

const deadlineSub = computed(() => {
  const nd = nearestDeadline.value
  if (!nd) return 'добавьте дедлайн книге'
  const today = new Date()
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((nd.date - t0) / 86400000)
  if (days < 0) return `${nd.book.title} · просрочено на ${dayLabel(-days)}`
  if (days === 0) return `${nd.book.title} · сегодня`
  return `${nd.book.title} · через ${dayLabel(days)}`
})

const stats = computed(() => [
  {
    icon: 'library',
    label: 'Всего книг',
    value: books.value.length.toString(),
    sub: `${pageLabel(totalPagesAcrossAll.value)} в сумме`
  },
  {
    icon: 'book-open',
    label: 'Прочитано',
    value: totalReadAcrossAll.value.toString(),
    sub: `${Math.round(overallPercent.value)}% библиотеки`,
    accent: true
  },
  {
    icon: 'target',
    label: 'Осталось',
    value: remaining.value.toString(),
    sub: pageLabel(remaining.value)
  },
  {
    icon: 'bookmark',
    label: 'Сегодня',
    value: todayPagesRead.value.toString(),
    sub: 'страниц за сегодня'
  },
  {
    icon: 'flame',
    label: 'Streak',
    value: streak.value.toString(),
    sub: bestStreak.value > 0 ? `Рекорд: ${dayLabel(bestStreak.value)}` : 'Сделай первую отметку',
    warm: true
  },
  {
    icon: 'star',
    label: 'Книг завершено',
    value: `${finishedCount.value}/${books.value.length || 0}`,
    sub: finishedCount.value > 0 ? 'отлично!' : 'впереди ещё много'
  },
  {
    icon: 'calendar',
    label: 'Ближайший дедлайн',
    value: deadlineLabel.value || '—',
    sub: deadlineSub.value,
    span: true
  }
])
</script>

<template>
  <section id="statistics" class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
    <div class="flex items-baseline justify-between mb-5">
      <div>
        <h2 class="font-display text-lg sm:text-xl font-semibold tracking-tight">Статистика</h2>
        <p class="mt-0.5 text-sm text-ink-500 dark:text-ink-300">
          Живая картина твоего чтения
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <div
        v-for="(s, i) in stats"
        :key="i"
        class="card p-4 sm:p-5 relative overflow-hidden animate-slide-up"
        :class="{ 'sm:col-span-3 lg:col-span-2': s.span }"
        :style="{ animationDelay: i * 30 + 'ms' }"
      >
        <div
          v-if="s.accent"
          class="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-sand-400/20 dark:bg-sand-400/10 blur-2xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          v-if="s.warm"
          class="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-400/20 dark:bg-amber-400/10 blur-2xl pointer-events-none"
          aria-hidden="true"
        />
        <div class="relative flex items-center gap-2 text-ink-400">
          <span
            class="grid place-items-center w-7 h-7 rounded-lg bg-ink-100 dark:bg-ink-700/70"
            :class="{
              'bg-sand-100 text-sand-800 dark:bg-sand-500/15 dark:text-sand-200': s.accent,
              'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300': s.warm
            }"
          >
            <AppIcon :name="s.icon" :size="14" />
          </span>
          <span class="label">{{ s.label }}</span>
        </div>
        <div class="relative mt-2 text-2xl sm:text-3xl font-display font-bold tracking-tight tabular-nums">
          {{ s.value }}
        </div>
        <div class="relative mt-1 text-xs text-ink-500 dark:text-ink-400">
          {{ s.sub }}
        </div>
      </div>
    </div>
  </section>
</template>
