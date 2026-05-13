<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme.js'
import { useBooks } from '@/composables/useBooks.js'
import { roundPct } from '@/utils/format.js'
import AppIcon from './AppIcon.vue'

const emit = defineEmits(['open-settings', 'add-book'])

const { isDark, cycle } = useTheme()
const { totalReadAcrossAll, totalPagesAcrossAll, overallPercent } = useBooks()

const percentLabel = computed(
  () => `${roundPct(totalReadAcrossAll.value, totalPagesAcrossAll.value)}%`
)
</script>

<template>
  <header
    class="sticky top-0 z-40 backdrop-blur-xl bg-ink-50/85 dark:bg-ink-900/75
           border-b border-ink-200/70 dark:border-ink-700/60"
  >
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="h-14 flex items-center justify-between gap-3">
        <a href="#top" class="flex items-center gap-2.5 group">
          <span
            class="grid place-items-center w-8 h-8 rounded-xl
                   bg-gradient-to-br from-sand-500 to-cocoa-700
                   text-ink-50 shadow-glow"
          >
            <AppIcon name="book" :size="16" />
          </span>
          <div class="leading-tight">
            <div class="font-display text-sm font-semibold tracking-tight">Library</div>
            <div class="text-[11px] text-ink-400 -mt-0.5">books progress tracker</div>
          </div>
        </a>

        <div class="hidden sm:flex items-center gap-2">
          <div
            class="hidden md:flex items-center gap-2 px-3 h-9 rounded-xl
                   bg-ink-100/80 dark:bg-ink-800/70 border border-ink-200/70 dark:border-ink-700/60"
          >
            <div class="text-[11px] uppercase tracking-wider text-ink-400">Прочитано</div>
            <div class="text-sm font-semibold tabular-nums">{{ percentLabel }}</div>
            <div class="w-24 h-1.5 rounded-full bg-ink-200/70 dark:bg-ink-700/70 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-sand-500 to-cocoa-600 transition-all duration-500"
                :style="{ width: overallPercent + '%' }"
              />
            </div>
          </div>

          <button
            class="btn-primary h-9"
            @click="emit('add-book')"
            title="Добавить книгу"
          >
            <AppIcon name="plus" :size="16" />
            <span class="hidden lg:inline">Добавить книгу</span>
          </button>

          <button
            class="btn-ghost h-9 w-9 p-0"
            :title="isDark ? 'Светлая тема' : 'Тёмная тема'"
            @click="cycle"
          >
            <AppIcon :name="isDark ? 'sun' : 'moon'" :size="16" />
          </button>

          <button
            class="btn-soft h-9"
            @click="emit('open-settings')"
            title="Настройки и данные"
          >
            <AppIcon name="menu" :size="16" />
            <span class="hidden lg:inline">Меню</span>
          </button>
        </div>

        <div class="flex sm:hidden items-center gap-2">
          <div class="flex items-center gap-1.5 chip">
            <AppIcon name="book-open" :size="12" />
            <span class="tabular-nums">{{ percentLabel }}</span>
          </div>
          <button class="btn-primary h-9 w-9 p-0" @click="emit('add-book')" title="Добавить книгу">
            <AppIcon name="plus" :size="16" />
          </button>
          <button class="btn-ghost h-9 w-9 p-0" @click="cycle">
            <AppIcon :name="isDark ? 'sun' : 'moon'" :size="16" />
          </button>
          <button class="btn-soft h-9 w-9 p-0" @click="emit('open-settings')">
            <AppIcon name="menu" :size="16" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
