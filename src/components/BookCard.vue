<script setup>
import { computed } from "vue";
import { pageLabel } from "@/utils/format.js";
import AppIcon from "./AppIcon.vue";

const props = defineProps({
  book: { type: Object, required: true },
});

const emit = defineEmits(["open", "add-pages"]);

const progress = computed(() => props.book.progress);
const percent = computed(() => Math.round(progress.value.percent));

const status = computed(() => {
  if (progress.value.isComplete) return "complete";
  if (progress.value.isInProgress) return "progress";
  return "idle";
});

const statusLabel = computed(() => {
  if (status.value === "complete") return "Прочитано";
  if (status.value === "progress") return "Читаю";
  return "В очереди";
});

function handleOpen() {
  emit("open", props.book.id);
}

function handleKey(e) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handleOpen();
  }
}

function handleAddPages(e) {
  e.stopPropagation();
  emit("add-pages", props.book.id);
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :aria-label="`Открыть книгу ${book.title}`"
    class="group relative cursor-pointer text-left card overflow-hidden p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-sand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50 dark:focus-visible:ring-offset-ink-900"
    @click="handleOpen"
    @keydown="handleKey"
  >
    <span
      class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-sand-100/60 via-transparent to-cocoa-50/40 dark:from-sand-500/[0.06] dark:via-transparent dark:to-cocoa-500/[0.04] pointer-events-none"
      aria-hidden="true"
    />

    <div class="relative flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 text-[11px] text-ink-400">
          <span>{{ book.totalPages }} стр.</span>
          <template v-if="book.author">
            <span class="w-1 h-1 rounded-full bg-current opacity-50" />
            <span class="truncate">{{ book.author }}</span>
          </template>
        </div>
        <h3
          class="mt-1 font-display font-semibold text-lg sm:text-xl tracking-tight leading-snug line-clamp-2"
        >
          {{ book.title }}
        </h3>
      </div>
      <div class="text-right shrink-0">
        <div
          class="mt-1.5 text-[10px] uppercase tracking-wider"
          :class="{
            'text-sand-700 dark:text-sand-300': status === 'complete',
            'text-amber-700 dark:text-amber-300': status === 'progress',
            'text-ink-400': status === 'idle',
          }"
        >
          {{ statusLabel }}
        </div>
      </div>
    </div>

    <div class="relative mt-5">
      <div class="flex items-baseline justify-between text-sm">
        <div>
          <span class="font-semibold tabular-nums">{{ book.currentPage }}</span>
          <span class="text-ink-400"> / {{ book.totalPages }}</span>
        </div>
        <div class="font-semibold tabular-nums">{{ percent }}%</div>
      </div>

      <div
        class="mt-2 h-1.5 rounded-full bg-ink-200/70 dark:bg-ink-700/70 overflow-hidden"
      >
        <div
          class="h-full rounded-full transition-[width] duration-700 ease-out"
          :class="
            status === 'complete'
              ? 'bg-gradient-to-r from-sand-400 to-sand-300'
              : 'bg-gradient-to-r from-sand-500 to-cocoa-600'
          "
          :style="{ width: progress.percent + '%' }"
        />
      </div>
    </div>

    <div class="relative mt-5 flex items-center justify-between gap-2">
      <div
        class="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400 min-w-0"
      >
        <span
          v-if="progress.isComplete"
          class="flex items-center gap-1 text-sand-700 dark:text-sand-300 font-medium"
        >
          <AppIcon name="check" :size="14" />
          Книга прочитана
        </span>
        <template v-else>
          <span class="truncate"
            >Осталось {{ pageLabel(progress.remaining) }}</span
          >
        </template>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="!progress.isComplete"
          type="button"
          class="btn-soft h-8 text-xs"
          @click="handleAddPages"
        >
          <AppIcon name="plus" :size="12" />
          Страницы
        </button>
        <span
          class="hidden group-hover:inline-flex items-center gap-1 text-xs font-medium text-ink-500 dark:text-ink-300"
        >
          Открыть
          <AppIcon name="chevron-right" :size="12" />
        </span>
      </div>
    </div>

    <div
      v-if="progress.todayDelta > 0"
      class="relative mt-3 inline-flex items-center gap-1.5 text-[11px] text-sand-700 dark:text-sand-300"
    >
      <AppIcon name="sparkles" :size="12" />
      Сегодня +{{ progress.todayDelta }} стр.
    </div>
  </div>
</template>
