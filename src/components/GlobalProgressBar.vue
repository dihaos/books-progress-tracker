<script setup>
import { computed, ref, reactive, onBeforeUnmount } from 'vue'
import { useBooks } from '@/composables/useBooks.js'
import { roundPct } from '@/utils/format.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  showLabels: { type: Boolean, default: true }
})

const emit = defineEmits(['select-book'])

const barWrapperRef = ref(null)

const {
  books,
  totalPagesAcrossAll,
  totalReadAcrossAll,
  overallPercent,
  finishedCount,
  readingCount
} = useBooks()

const segments = computed(() => {
  const total = totalPagesAcrossAll.value || 1
  return books.value.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    totalPages: b.totalPages,
    currentPage: b.currentPage,
    percent: b.progress.percent,
    isComplete: b.progress.isComplete,
    width: (b.totalPages / total) * 100
  }))
})

const tooltip = reactive({ visible: false, x: 0, y: 0, content: null })
const hovered = ref(null)
let hideTimer = null

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

function handleClick(segment) {
  emit('select-book', segment.id)
}
</script>

<template>
  <section id="progress" class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
    <div class="flex items-baseline justify-between mb-4">
      <div>
        <h2 class="font-display text-lg sm:text-xl font-semibold tracking-tight">
          Добавленные книги
        </h2>
        <p class="mt-0.5 text-sm text-ink-500 dark:text-ink-300">
          Ширина каждой книги пропорциональна числу её страниц
        </p>
      </div>
      <div class="hidden sm:flex items-center gap-2 text-xs">
        <span class="chip">
          <span class="w-2 h-2 rounded-sm bg-sand-600"></span>
          Прочитано · {{ finishedCount }}
        </span>
        <span class="chip">
          <span class="w-2 h-2 rounded-sm bg-sand-400/80"></span>
          Читаю · {{ readingCount }}
        </span>
      </div>
    </div>

    <div class="card p-4 sm:p-5">
      <div v-if="!segments.length" class="text-sm text-ink-500 dark:text-ink-300 py-4 text-center">
        Пока ни одной книги. Добавь первую — и она появится на этой полке.
      </div>

      <template v-else>
        <div class="flex items-baseline justify-between mb-3 px-0.5">
          <div class="text-sm font-medium">
            {{ totalReadAcrossAll }} <span class="text-ink-400">/ {{ totalPagesAcrossAll }} страниц</span>
          </div>
          <div class="text-sm font-semibold tabular-nums">
            {{ Math.round(overallPercent) }}%
          </div>
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
              :style="{ width: s.width + '%' }"
              :aria-label="`${s.title} — ${roundPct(s.currentPage, s.totalPages)}%`"
              @mouseenter="(e) => showTooltip(e, s)"
              @mousemove="moveTooltip"
              @mouseleave="hideTooltip"
              @focus="(e) => showTooltip(e, s)"
              @blur="hideTooltip"
              @click="handleClick(s)"
            >
              <span class="absolute inset-0 bg-transparent group-hover:bg-ink-900/5 dark:group-hover:bg-ink-50/5 transition-colors" />
              <span
                class="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out
                       bg-gradient-to-r from-sand-500 to-cocoa-600"
                :class="{
                  'from-sand-400 to-sand-300': s.isComplete && s.percent >= 100
                }"
                :style="{ width: s.percent + '%' }"
              />
              <span
                v-if="i < segments.length - 1"
                class="absolute right-0 top-1 bottom-1 w-px bg-ink-50/80 dark:bg-ink-900/80 z-10"
                aria-hidden="true"
              />
              <span
                v-if="hovered === s.id"
                class="absolute inset-0 ring-2 ring-sand-400/70 rounded-[2px] pointer-events-none"
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
              <div
                class="glass-strong rounded-xl px-3 py-2 shadow-card text-xs whitespace-nowrap"
              >
                <div class="flex items-center gap-2">
                  <span class="font-semibold">{{ tooltip.content.title }}</span>
                </div>
                <div class="mt-0.5 text-ink-500 dark:text-ink-300">
                  {{ tooltip.content.currentPage }} / {{ tooltip.content.totalPages }} стр. ·
                  <span class="font-medium text-sand-700 dark:text-sand-300">
                    {{ roundPct(tooltip.content.currentPage, tooltip.content.totalPages) }}%
                  </span>
                </div>
              </div>
              <div
                class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45
                       bg-ink-50/95 dark:bg-ink-800/95 border-r border-b border-ink-200/70 dark:border-ink-700/70"
              />
            </div>
          </Transition>
        </div>

        <div
          v-if="props.showLabels"
          class="mt-3 flex w-full overflow-x-auto scroll-soft mask-fade-r sm:mask-none"
        >
          <div class="flex w-full">
            <div
              v-for="s in segments"
              :key="`label-${s.id}`"
              class="shrink-0 sm:flex-1 px-1"
              :style="{ minWidth: '72px', flexBasis: s.width + '%' }"
            >
              <button
                class="block w-full text-[10px] sm:text-[11px] truncate text-left text-ink-400 hover:text-ink-700 dark:hover:text-ink-100 transition-colors"
                :title="s.title"
                @click="handleClick(s)"
              >
                {{ s.title }}
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3 text-[11px] text-ink-400">
          <div class="flex items-center gap-1.5">
            <AppIcon name="info" :size="12" />
            Наведи на сегмент — увидишь сводку. Нажми — откроется детальный список.
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
