<script setup>
import { computed } from 'vue'
import { useStatistics } from '@/composables/useStatistics.js'
import { pageLabel, dayLabel } from '@/utils/format.js'
import AppIcon from './AppIcon.vue'

const { todayPagesRead, streak, bestStreak, todayPlanTotal } = useStatistics()

const goal = computed(() => todayPlanTotal.value.total)
const hasPlan = computed(() => goal.value > 0 && todayPlanTotal.value.daysLeft != null)
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
    <div class="grid sm:grid-cols-2 gap-4">
      <div class="card p-5 sm:p-6 relative overflow-hidden">
        <div class="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-300">
          <AppIcon name="bookmark" :size="14" class="text-sand-700 dark:text-sand-300" />
          <span>Сегодня прочитано</span>
        </div>
        <div class="mt-2 font-display text-4xl font-bold tabular-nums tracking-tight">
          {{ todayPagesRead }}
        </div>
        <p class="mt-1 text-sm text-ink-500 dark:text-ink-300">
          <template v-if="hasPlan && todayPagesRead < goal">
            До плана активной цели: ещё {{ pageLabel(goal - todayPagesRead) }}
          </template>
          <template v-else-if="hasPlan && todayPagesRead >= goal">
            План на сегодня выполнен
          </template>
          <template v-else>
            {{ pageLabel(todayPagesRead) }} за сегодня
          </template>
        </p>
      </div>

      <div class="card p-5 sm:p-6 relative overflow-hidden">
        <div class="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-300">
          <AppIcon name="flame" :size="14" class="text-amber-600 dark:text-amber-300" />
          <span>Streak</span>
        </div>
        <div class="mt-2 font-display text-4xl font-bold tabular-nums tracking-tight">
          {{ streak }}
        </div>
        <p class="mt-1 text-sm text-ink-500 dark:text-ink-300">
          <template v-if="bestStreak > 0">
            Рекорд: {{ dayLabel(bestStreak) }}
          </template>
          <template v-else>
            Отметь страницы сегодня — начни серию
          </template>
        </p>
      </div>
    </div>
  </section>
</template>
