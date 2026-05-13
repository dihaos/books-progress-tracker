<script setup>
import { useToast } from '@/composables/useToast.js'
import AppIcon from './AppIcon.vue'

const { toasts, dismiss } = useToast()

function iconFor(type) {
  if (type === 'success') return 'check'
  if (type === 'error') return 'warning'
  return 'info'
}
</script>

<template>
  <div
    class="fixed z-[60] inset-x-0 bottom-4 sm:inset-auto sm:bottom-6 sm:right-6 flex flex-col items-center sm:items-end gap-2 px-4 sm:px-0 pointer-events-none"
  >
    <TransitionGroup
      tag="div"
      class="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto"
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-3 sm:translate-y-0 sm:translate-x-3"
      enter-to-class="opacity-100 translate-y-0 sm:translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 translate-y-2"
      move-class="transition-transform duration-300"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto w-full sm:max-w-sm rounded-2xl shadow-card backdrop-blur-xl
               border bg-ink-50/95 dark:bg-ink-800/90 border-ink-200/70 dark:border-ink-700/70
               px-3.5 py-3 flex items-start gap-3"
      >
        <span
          class="grid place-items-center w-7 h-7 rounded-lg shrink-0"
          :class="{
            'bg-sand-100 text-sand-800 dark:bg-sand-500/20 dark:text-sand-200': t.type === 'success',
            'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200': t.type === 'error',
            'bg-ink-100 text-ink-700 dark:bg-ink-700 dark:text-ink-100': t.type === 'info'
          }"
        >
          <AppIcon :name="iconFor(t.type)" :size="14" />
        </span>
        <div class="flex-1 min-w-0">
          <div v-if="t.title" class="text-sm font-semibold leading-tight">{{ t.title }}</div>
          <div class="text-sm text-ink-500 dark:text-ink-300">{{ t.message }}</div>
        </div>
        <button
          class="text-ink-400 hover:text-ink-700 dark:hover:text-ink-100 -m-1 p-1 transition-colors"
          @click="dismiss(t.id)"
          aria-label="Закрыть"
        >
          <AppIcon name="close" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
