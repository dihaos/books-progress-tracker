<script setup>
import { computed } from 'vue'
import { useStatistics } from '@/composables/useStatistics.js'
import { useBooks } from '@/composables/useBooks.js'
import { pageLabel, dayLabel } from '@/utils/format.js'
import AppIcon from './AppIcon.vue'

const { todayPagesRead, streak, todayPlanTotal } = useStatistics()
const { totalReadAcrossAll, totalPagesAcrossAll } = useBooks()

const goal = computed(() => todayPlanTotal.value.total)
const hasPlan = computed(() => todayPlanTotal.value.counted > 0 && goal.value > 0)

const goalPercent = computed(() => {
  if (!goal.value) return 0
  return Math.min(100, (todayPagesRead.value / goal.value) * 100)
})

const headline = computed(() => {
  if (todayPagesRead.value === 0) {
    return 'Прочитай сегодня хотя бы одну страницу — не теряй ритм.'
  }
  if (hasPlan.value && todayPagesRead.value >= goal.value) {
    return `Отлично! Дневной план выполнен — ${pageLabel(todayPagesRead.value)} сегодня.`
  }
  if (hasPlan.value) {
    return `Сегодня прочитано ${pageLabel(todayPagesRead.value)}. Ещё ${pageLabel(
      Math.max(0, goal.value - todayPagesRead.value)
    )} до плана.`
  }
  return `Сегодня прочитано ${pageLabel(todayPagesRead.value)}. Так держать.`
})

const sub = computed(() => {
  if (streak.value >= 1) {
    return `Streak: ${dayLabel(streak.value)}. Продолжай — ритм решает всё.`
  }
  return 'Маленькие ежедневные шаги превращаются в результат.'
})

const completion = computed(() =>
  totalPagesAcrossAll.value
    ? Math.round((totalReadAcrossAll.value / totalPagesAcrossAll.value) * 100)
    : 0
)
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
    <div
      class="card relative overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-sand-50 via-ink-50 to-sand-100/50
             dark:from-sand-500/[0.08] dark:via-ink-800 dark:to-cocoa-500/[0.06]"
    >
      <div
        class="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-sand-200/60 dark:bg-sand-400/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div class="relative grid sm:grid-cols-3 gap-5 items-center">
        <div class="sm:col-span-2">
          <div class="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-300">
            <AppIcon name="sparkles" :size="14" class="text-sand-700 dark:text-sand-300" />
            <span>Сегодняшний фокус</span>
          </div>
          <h3 class="mt-1.5 font-display text-xl sm:text-2xl font-semibold tracking-tight text-balance">
            {{ headline }}
          </h3>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-300">{{ sub }}</p>

          <div class="mt-4 max-w-md">
            <div class="flex items-baseline justify-between text-xs text-ink-500 dark:text-ink-300">
              <span>{{ hasPlan ? 'Дневной план' : 'Прочитано сегодня' }}</span>
              <span class="font-medium tabular-nums">
                <template v-if="hasPlan">{{ todayPagesRead }} / {{ goal }} стр.</template>
                <template v-else>{{ todayPagesRead }} стр.</template>
              </span>
            </div>
            <div class="mt-1.5 h-1.5 rounded-full bg-ink-200/70 dark:bg-ink-700/70 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-sand-500 to-cocoa-500 transition-[width] duration-700 ease-out"
                :style="{ width: hasPlan ? goalPercent + '%' : (todayPagesRead > 0 ? 100 : 0) + '%' }"
              />
            </div>
            <div v-if="!hasPlan" class="mt-2 text-[11px] text-ink-400">
              План появится, когда у книг будет дедлайн.
            </div>
          </div>
        </div>

        <div class="sm:justify-self-end">
          <div
            class="rounded-2xl border border-ink-200/70 dark:border-ink-700/60 bg-ink-50/80 dark:bg-ink-900/50 backdrop-blur p-4 w-full sm:w-56"
          >
            <div class="text-xs uppercase tracking-wider text-ink-400">До завершения</div>
            <div class="mt-1 font-display text-3xl font-bold tabular-nums">
              {{ 100 - completion }}%
            </div>
            <div class="mt-1 text-xs text-ink-500 dark:text-ink-300">
              осталось {{ pageLabel(Math.max(0, totalPagesAcrossAll - totalReadAcrossAll)) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
