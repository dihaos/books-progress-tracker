<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme.js'
import { useScenarios } from '@/composables/useScenarios.js'
import { useStatistics } from '@/composables/useStatistics.js'
import { roundPct } from '@/utils/format.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  view: { type: String, default: 'home' }
})

const emit = defineEmits(['navigate', 'open-settings', 'add-book'])

const { isDark, cycle } = useTheme()
const { activeScenarioStats } = useScenarios()
const { todayPagesRead } = useStatistics()

const percentLabel = computed(() => {
  const s = activeScenarioStats.value
  if (!s?.totalPages) return '—'
  return `${Math.round(s.percent)}%`
})

const navItems = [
  { id: 'home', label: 'Главная' },
  { id: 'library', label: 'Библиотека' },
  { id: 'goals', label: 'Цели' }
]
</script>

<template>
  <header
    class="sticky top-0 z-40 backdrop-blur-xl bg-ink-50/85 dark:bg-ink-900/75
           border-b border-ink-200/70 dark:border-ink-700/60"
  >
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="h-14 flex items-center justify-between gap-3">
        <button
          type="button"
          class="flex items-center gap-2.5 group shrink-0"
          @click="emit('navigate', 'home')"
        >
          <span
            class="grid place-items-center w-8 h-8 rounded-xl
                   bg-gradient-to-br from-sand-500 to-cocoa-700 text-ink-50 shadow-glow"
          >
            <AppIcon name="book" :size="16" />
          </span>
          <div class="leading-tight hidden sm:block text-left">
            <div class="font-display text-sm font-semibold tracking-tight">Library</div>
            <div class="text-[11px] text-ink-400 -mt-0.5">трекер чтения</div>
          </div>
        </button>

        <nav class="hidden md:flex items-center gap-1">
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            class="px-3 h-9 rounded-xl text-sm font-medium transition-colors"
            :class="
              view === item.id
                ? 'bg-sand-100 text-sand-900 dark:bg-sand-500/15 dark:text-sand-100'
                : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-100 hover:bg-ink-100/80 dark:hover:bg-ink-800/50'
            "
            @click="emit('navigate', item.id)"
          >
            {{ item.label }}
          </button>
        </nav>

        <div class="flex items-center gap-2">
          <div
            class="hidden lg:flex items-center gap-2 px-3 h-9 rounded-xl
                   bg-ink-100/80 dark:bg-ink-800/70 border border-ink-200/70 dark:border-ink-700/60 text-xs"
          >
            <span class="text-ink-400">Сегодня</span>
            <span class="font-semibold tabular-nums">+{{ todayPagesRead }}</span>
            <span class="w-px h-4 bg-ink-200 dark:bg-ink-600" />
            <span class="text-ink-400">Цель</span>
            <span class="font-semibold tabular-nums">{{ percentLabel }}</span>
          </div>

          <button type="button" class="btn-primary h-9" @click="emit('add-book')">
            <AppIcon name="plus" :size="16" />
            <span class="hidden lg:inline">Книга</span>
          </button>

          <button
            type="button"
            class="btn-ghost h-9 w-9 p-0"
            :title="isDark ? 'Светлая тема' : 'Тёмная тема'"
            @click="cycle"
          >
            <AppIcon :name="isDark ? 'sun' : 'moon'" :size="16" />
          </button>

          <button type="button" class="btn-soft h-9 w-9 p-0 sm:w-auto sm:px-3" @click="emit('open-settings')">
            <AppIcon name="menu" :size="16" />
          </button>
        </div>
      </div>

      <nav class="md:hidden flex gap-1 pb-2 -mt-1 overflow-x-auto scroll-soft">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          class="px-3 h-8 rounded-lg text-xs font-medium whitespace-nowrap shrink-0"
          :class="
            view === item.id
              ? 'bg-sand-100 text-sand-900 dark:bg-sand-500/15 dark:text-sand-100'
              : 'text-ink-500 bg-ink-100/60 dark:bg-ink-800/50'
          "
          @click="emit('navigate', item.id)"
        >
          {{ item.label }}
        </button>
      </nav>
    </div>
  </header>
</template>
