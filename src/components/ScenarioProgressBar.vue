<script setup>
import { computed, reactive, ref, onBeforeUnmount } from 'vue'
import { roundPct } from '@/utils/format.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  books: { type: Array, default: () => [] }
})

const emit = defineEmits(['select-book'])

const barWrapperRef = ref(null)
const tooltip = reactive({ visible: false, x: 0, y: 0, content: null })
const hovered = ref(null)
let hideTimer = null

const totalPages = computed(() =>
  props.books.reduce((s, b) => s + (b.totalPages || 0), 0) || 1
)

const totalRead = computed(() =>
  props.books.reduce((s, b) => s + (b.currentPage || 0), 0)
)

const overallPercent = computed(() =>
  totalPages.value ? (totalRead.value / totalPages.value) * 100 : 0
)

const segments = computed(() =>
  props.books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    totalPages: b.totalPages,
    currentPage: b.currentPage,
    percent: b.progress?.percent ?? (b.totalPages ? (b.currentPage / b.totalPages) * 100 : 0),
    isComplete: b.progress?.isComplete ?? b.status === 'finished',
    width: ((b.totalPages || 0) / totalPages.value) * 100
  }))
)

function setTooltipPosition(buttonEl) {
  if (!barWrapperRef.value) return
  const containerRect = barWrapperRef.value.getBoundingClientRect()
  const rect = buttonEl.getBoundingClientRect()
  tooltip.x = rect.left - containerRect.left + rect.width / 2
  tooltip.y = rect.top - containerRect.top
}

function showTooltip(event, segment) {
  hovered.value = segment.id
  tooltip.content = segment
  setTooltipPosition(event.currentTarget)
  tooltip.visible = true
  if (hideTimer) clearTimeout(hideTimer)
}

function moveTooltip(event) {
  if (!tooltip.visible) return
  setTooltipPosition(event.currentTarget)
}

function hideTooltip() {
  hideTimer = setTimeout(() => {
    tooltip.visible = false
    hovered.value = null
  }, 100)
}

onBeforeUnmount(() => {
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<template>
  <div class="card p-4 sm:p-5">
    <div
      v-if="!segments.length"
      class="text-sm text-ink-500 dark:text-ink-300 py-4 text-center"
    >
      В этой цели пока нет книг.
    </div>
    <template v-else>
      <div class="flex items-baseline justify-between mb-3 px-0.5">
        <div class="text-sm font-medium">
          {{ totalRead }}
          <span class="text-ink-400">/ {{ totalPages }} стр. в цели</span>
        </div>
        <div class="text-sm font-semibold tabular-nums">{{ Math.round(overallPercent) }}%</div>
      </div>

      <div ref="barWrapperRef" class="relative">
        <div
          class="relative h-9 sm:h-10 w-full rounded-xl overflow-hidden flex
                 bg-ink-100/80 dark:bg-ink-700/40 ring-1 ring-inset ring-ink-200/60 dark:ring-ink-700/60"
        >
          <button
            v-for="(s, i) in segments"
            :key="s.id"
            type="button"
            class="relative h-full group transition-all duration-300 outline-none focus:z-10"
            :style="{ width: Math.max(s.width, 0.5) + '%' }"
            :aria-label="`${s.title}`"
            @mouseenter="(e) => showTooltip(e, s)"
            @mousemove="moveTooltip"
            @mouseleave="hideTooltip"
            @click="emit('select-book', s.id)"
          >
            <span
              class="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out
                     bg-gradient-to-r from-sand-500 to-cocoa-600"
              :class="{ 'from-sand-400 to-sand-300': s.isComplete }"
              :style="{ width: s.percent + '%' }"
            />
            <span
              v-if="i < segments.length - 1"
              class="absolute right-0 top-1 bottom-1 w-px bg-ink-50/80 dark:bg-ink-900/80 z-10"
              aria-hidden="true"
            />
          </button>
        </div>

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="tooltip.visible && tooltip.content"
            class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
            :style="{ left: tooltip.x + 'px', top: tooltip.y - 8 + 'px' }"
          >
            <div class="glass-strong rounded-xl px-3 py-2 shadow-card text-xs whitespace-nowrap">
              <div class="font-semibold">{{ tooltip.content.title }}</div>
              <div class="mt-0.5 text-ink-500 dark:text-ink-300">
                {{ tooltip.content.currentPage }} / {{ tooltip.content.totalPages }} стр.
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <div class="mt-3 flex items-center gap-1.5 text-[11px] text-ink-400">
        <AppIcon name="info" :size="12" />
        Нажми на сегмент — откроется книга
      </div>
    </template>
  </div>
</template>
