<script setup>
import { computed } from 'vue'
import { useScenarios } from '@/composables/useScenarios.js'
import { useStatistics } from '@/composables/useStatistics.js'
import { parseKey } from '@/utils/date.js'
import { pageLabel, dayLabel } from '@/utils/format.js'
import { groupBooksByShelf } from '@/utils/bookShelf.js'
import ScenarioProgressBar from './ScenarioProgressBar.vue'
import AppIcon from './AppIcon.vue'

const emit = defineEmits(['select-book', 'manage-goals', 'create-goal'])

const { activeScenario, scenarios, setActiveScenario } = useScenarios()
const { todayPagesRead } = useStatistics()

const stats = computed(() => activeScenario.value?.stats ?? null)

const deadlineLabel = computed(() => {
  const d = activeScenario.value?.deadline
  if (!d) return null
  const date = parseKey(d)
  return date?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})

const deadlineSub = computed(() => {
  if (!stats.value?.daysLeft) return ''
  const days = stats.value.daysLeft
  const today = new Date()
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const target = parseKey(activeScenario.value.deadline)
  const diff = target ? Math.round((target - t0) / 86400000) : 0
  if (stats.value.overdue) return `Просрочено · осталось ${pageLabel(stats.value.pagesLeft)}`
  if (diff === 0) return 'Дедлайн сегодня'
  return `Ещё ${dayLabel(diff)} · ${pageLabel(stats.value.pagesLeft)} осталось`
})

const shelfGroups = computed(() => {
  if (!activeScenario.value?.books?.length) return null
  return groupBooksByShelf(activeScenario.value.books)
})

const shelfSummary = computed(() => {
  if (!shelfGroups.value) return []
  return [
    { key: 'reading', count: shelfGroups.value.reading.length },
    { key: 'queue', count: shelfGroups.value.queue.length },
    { key: 'finished', count: shelfGroups.value.finished.length }
  ].filter((s) => s.count > 0)
})
</script>

<template>
  <section id="goals" class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
    <div class="flex items-baseline justify-between gap-3 mb-5">
      <div>
        <h2 class="font-display text-lg sm:text-xl font-semibold tracking-tight">Активная цель</h2>
        <p class="mt-0.5 text-sm text-ink-500 dark:text-ink-300">
          План и прогресс по выбранному сценарию
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" class="btn-soft h-9 text-xs" @click="emit('manage-goals')">
          Все цели
        </button>
        <button type="button" class="btn-primary h-9 text-xs" @click="emit('create-goal')">
          <AppIcon name="plus" :size="14" />
          <span class="hidden sm:inline">Новая цель</span>
        </button>
      </div>
    </div>

    <div v-if="!activeScenario" class="card p-8 text-center">
      <AppIcon name="target" :size="24" class="mx-auto text-ink-300" />
      <p class="mt-3 font-display font-semibold">Нет активной цели</p>
      <p class="mt-1 text-sm text-ink-500 dark:text-ink-300">
        Создай сценарий: выбери книги из библиотеки и поставь дедлайн.
      </p>
      <button type="button" class="mt-4 btn-primary" @click="emit('create-goal')">
        Создать сценарий
      </button>
    </div>

    <template v-else>
      <div v-if="scenarios.length > 1" class="mb-4 flex flex-wrap gap-2">
        <button
          v-for="s in scenarios"
          :key="s.id"
          type="button"
          class="chip transition-colors"
          :class="
            s.id === activeScenario.id
              ? 'bg-sand-200/80 dark:bg-sand-500/20 text-sand-900 dark:text-sand-100 ring-1 ring-sand-400/50'
              : 'hover:bg-ink-100 dark:hover:bg-ink-700/50'
          "
          @click="setActiveScenario(s.id)"
        >
          {{ s.title }}
        </button>
      </div>

      <div class="card p-5 sm:p-6 mb-5">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="min-w-0">
            <h3 class="font-display text-xl sm:text-2xl font-bold tracking-tight">
              {{ activeScenario.title }}
            </h3>
            <div
              v-if="deadlineLabel"
              class="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              :class="
                stats?.overdue
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
                  : 'bg-sand-100 text-sand-800 dark:bg-sand-500/15 dark:text-sand-200'
              "
            >
              <AppIcon name="calendar" :size="12" />
              До {{ deadlineLabel }}
            </div>
            <p class="mt-2 text-sm text-ink-500 dark:text-ink-300">{{ deadlineSub }}</p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm shrink-0">
            <div class="rounded-xl bg-ink-50/80 dark:bg-ink-900/40 border border-ink-200/60 dark:border-ink-700/60 px-3 py-2">
              <div class="label">План / день</div>
              <div class="mt-0.5 font-semibold tabular-nums">
                {{ stats?.dailyPlan != null ? stats.dailyPlan : '—' }}
              </div>
            </div>
            <div class="rounded-xl bg-ink-50/80 dark:bg-ink-900/40 border border-ink-200/60 dark:border-ink-700/60 px-3 py-2">
              <div class="label">Сегодня</div>
            </div>
            <div class="rounded-xl bg-ink-50/80 dark:bg-ink-900/40 border border-ink-200/60 dark:border-ink-700/60 px-3 py-2 col-span-2 sm:col-span-1">
              <div class="label">Книги</div>
              <div class="mt-0.5 font-semibold tabular-nums">
                {{ stats?.finishedCount }}/{{ stats?.bookCount }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2 text-xs text-ink-500">
          <span>{{ pageLabel(stats?.readPages ?? 0) }} прочитано</span>
          <span class="opacity-40">·</span>
          <span>{{ pageLabel(stats?.totalPages ?? 0) }} в цели</span>
          <span class="opacity-40">·</span>
          <span>{{ Math.round(stats?.percent ?? 0) }}% томов</span>
        </div>

        <div v-if="shelfSummary.length" class="mt-3 flex flex-wrap gap-2">
          <span v-for="s in shelfSummary" :key="s.key" class="chip tabular-nums">
            <template v-if="s.key === 'reading'">Читаю {{ s.count }}</template>
            <template v-else-if="s.key === 'queue'">В очереди {{ s.count }}</template>
            <template v-else>Прочитано {{ s.count }}</template>
          </span>
        </div>
      </div>

      <ScenarioProgressBar
        :books="activeScenario.books"
        @select-book="emit('select-book', $event)"
      />
    </template>
  </section>
</template>
