<script setup>
import AppIcon from './AppIcon.vue'

const props = defineProps({
  search: { type: String, default: '' },
  filter: { type: String, default: 'all' },
  counts: {
    type: Object,
    default: () => ({ all: 0, completed: 0, progress: 0, idle: 0 })
  }
})
const emit = defineEmits(['update:search', 'update:filter'])

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'progress', label: 'Читаю' },
  { id: 'idle', label: 'Не начатые' },
  { id: 'completed', label: 'Прочитанные' }
]
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
    <label class="relative flex-1 max-w-md">
      <span class="absolute inset-y-0 left-3 grid place-items-center text-ink-400">
        <AppIcon name="search" :size="16" />
      </span>
      <input
        :value="props.search"
        @input="emit('update:search', $event.target.value)"
        type="search"
        placeholder="Поиск по книгам или авторам..."
        class="input pl-9"
      />
    </label>

    <div
      class="inline-flex items-center bg-ink-100/80 dark:bg-ink-800/70 border border-ink-200/70 dark:border-ink-700/60
             rounded-xl p-1 overflow-x-auto scroll-soft"
    >
      <button
        v-for="f in FILTERS"
        :key="f.id"
        type="button"
        class="relative px-3 h-8 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200"
        :class="props.filter === f.id
          ? 'bg-ink-50 dark:bg-ink-700 text-ink-900 dark:text-ink-50 shadow-sm'
          : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-100'"
        @click="emit('update:filter', f.id)"
      >
        {{ f.label }}
        <span
          class="ml-1.5 inline-flex items-center justify-center rounded-md text-[10px] tabular-nums px-1
                 bg-ink-200/70 dark:bg-ink-600/70 min-w-[18px]"
        >
          {{ counts[f.id] ?? 0 }}
        </span>
      </button>
    </div>
  </div>
</template>
