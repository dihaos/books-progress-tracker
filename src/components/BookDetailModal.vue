<script setup>
import { computed, watch, ref, onBeforeUnmount } from 'vue'
import { useBooks } from '@/composables/useBooks.js'
import { useToast } from '@/composables/useToast.js'
import { pageLabel, dayLabel } from '@/utils/format.js'
import { parseKey, todayKey } from '@/utils/date.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  bookId: { type: String, default: null }
})
const emit = defineEmits(['close', 'completed', 'edit'])

const { books, setCurrentPage, markBookFinished, reopenBook, removeBook } = useBooks()
const toast = useToast()

const book = computed(() =>
  props.bookId ? books.value.find((b) => b.id === props.bookId) : null
)

const isOpen = computed(() => !!book.value)

const pageInput = ref('')
const confirmingDelete = ref(false)
const customQuick = ref('10')

watch(book, (b) => {
  if (b) {
    pageInput.value = String(b.currentPage)
    confirmingDelete.value = false
  }
})

function close() {
  emit('close')
}

function onKey(e) {
  if (e.key === 'Escape') close()
}

watch(isOpen, (open) => {
  if (typeof document === 'undefined') return
  if (open) {
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', onKey)
    document.body.style.overflow = ''
    confirmingDelete.value = false
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

function commitPage(rawPage) {
  if (!book.value) return
  const wasComplete = book.value.progress.isComplete
  const page = Math.max(0, Math.min(book.value.totalPages, Math.floor(Number(rawPage) || 0)))
  setCurrentPage(book.value.id, page)
  pageInput.value = String(page)
  const after = books.value.find((b) => b.id === book.value.id)
  if (!wasComplete && after?.progress.isComplete) {
    emit('completed', after.id)
  }
}

function savePage() {
  commitPage(pageInput.value)
}

function addPages(delta) {
  if (!book.value) return
  commitPage(book.value.currentPage + delta)
}

function addCustom() {
  const n = Math.floor(Number(customQuick.value) || 0)
  if (n <= 0) return
  addPages(n)
}

function finishBook() {
  if (!book.value) return
  const wasComplete = book.value.progress.isComplete
  markBookFinished(book.value.id)
  toast.success(`«${book.value.title}» отмечена как прочитанная`, 'Готово')
  if (!wasComplete) emit('completed', book.value.id)
}

function reopen() {
  if (!book.value) return
  reopenBook(book.value.id)
  toast.info('Книга снова в списке чтения', 'Открыто')
}

function doDelete() {
  if (!book.value) return
  if (!confirmingDelete.value) {
    confirmingDelete.value = true
    return
  }
  const title = book.value.title
  removeBook(book.value.id)
  toast.info(`«${title}» удалена`, 'Удалено')
  close()
}

function openEdit() {
  if (!book.value) return
  emit('edit', book.value.id)
}

const deadlineInfo = computed(() => {
  if (!book.value?.deadline) return null
  const date = parseKey(book.value.deadline)
  if (!date) return null
  const today = new Date()
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((date - t0) / 86400000)
  return {
    dateLabel: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
    days,
    overdue: book.value.progress.overdue
  }
})

const todayStr = todayKey()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      @click.self="close"
    >
      <div
        class="absolute inset-0 bg-ink-900/40 dark:bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      <Transition
        appear
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-6 sm:translate-y-2 sm:scale-[0.98]"
        enter-to-class="opacity-100 translate-y-0 sm:scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div
          v-if="book"
          role="dialog"
          aria-modal="true"
          :aria-label="book.title"
          class="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh]
                 rounded-t-3xl sm:rounded-3xl overflow-hidden
                 bg-ink-50 dark:bg-ink-800 border border-ink-200/70 dark:border-ink-700/70 shadow-card
                 flex flex-col"
        >
          <header
            class="relative px-5 sm:px-7 pt-6 pb-5 border-b border-ink-200/70 dark:border-ink-700/60
                   bg-gradient-to-br from-sand-50 via-ink-50 to-sand-100/60
                   dark:from-sand-500/[0.06] dark:via-ink-800 dark:to-cocoa-500/[0.04]"
          >
            <div class="absolute top-3 right-3 flex items-center gap-1">
              <button class="btn-ghost h-8 w-8 p-0" @click="openEdit" aria-label="Редактировать" title="Редактировать">
                <AppIcon name="edit" :size="14" />
              </button>
              <button class="btn-ghost h-8 w-8 p-0" @click="close" aria-label="Закрыть">
                <AppIcon name="close" :size="16" />
              </button>
            </div>

            <div class="flex items-start justify-between gap-4 pr-16">
              <div class="min-w-0">
                <div class="flex items-center gap-2 text-[11px] text-ink-400">
                  <span>{{ book.totalPages }} страниц</span>
                  <template v-if="book.author">
                    <span class="w-1 h-1 rounded-full bg-current opacity-50" />
                    <span class="truncate">{{ book.author }}</span>
                  </template>
                </div>
                <h2 class="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight">
                  {{ book.title }}
                </h2>
                <div
                  v-if="deadlineInfo"
                  class="mt-1.5 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  :class="deadlineInfo.overdue
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
                    : 'bg-sand-100 text-sand-800 dark:bg-sand-500/15 dark:text-sand-200'"
                >
                  <AppIcon name="calendar" :size="12" />
                  Дедлайн: {{ deadlineInfo.dateLabel }}
                  <template v-if="deadlineInfo.overdue">
                    · просрочено
                  </template>
                  <template v-else-if="deadlineInfo.days === 0">
                    · сегодня
                  </template>
                  <template v-else>
                    · через {{ dayLabel(deadlineInfo.days) }}
                  </template>
                </div>
                <div v-else class="mt-1.5 text-xs text-ink-400">
                  Дедлайн не задан. План на день не считается.
                </div>
              </div>
            </div>

            <div class="mt-5">
              <div class="flex items-baseline justify-between text-sm">
                <div>
                  <span class="font-semibold tabular-nums">{{ book.currentPage }}</span>
                  <span class="text-ink-400"> / {{ book.totalPages }} страниц</span>
                </div>
                <div class="font-semibold tabular-nums">
                  {{ Math.round(book.progress.percent) }}%
                </div>
              </div>
              <div class="mt-2 h-1.5 rounded-full bg-ink-200/70 dark:bg-ink-700/70 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-sand-500 to-cocoa-600
                         transition-[width] duration-700 ease-out"
                  :style="{ width: book.progress.percent + '%' }"
                />
              </div>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div class="rounded-xl bg-ink-50/80 dark:bg-ink-900/40 border border-ink-200/60 dark:border-ink-700/60 px-3 py-2">
                <div class="label">Сегодня</div>
                <div class="mt-0.5 font-semibold tabular-nums">+{{ book.progress.todayDelta }}</div>
              </div>
              <div class="rounded-xl bg-ink-50/80 dark:bg-ink-900/40 border border-ink-200/60 dark:border-ink-700/60 px-3 py-2">
                <div class="label">План / день</div>
                <div class="mt-0.5 font-semibold tabular-nums">
                  <template v-if="book.progress.dailyPlan != null">{{ book.progress.dailyPlan }}</template>
                  <template v-else>—</template>
                </div>
              </div>
              <div class="rounded-xl bg-ink-50/80 dark:bg-ink-900/40 border border-ink-200/60 dark:border-ink-700/60 px-3 py-2">
                <div class="label">Осталось</div>
                <div class="mt-0.5 font-semibold tabular-nums">{{ book.progress.remaining }}</div>
              </div>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto scroll-soft px-5 sm:px-7 py-5 space-y-5">
            <section v-if="book.status === 'reading'">
              <div class="label mb-2">Где я остановился</div>
              <div class="flex items-center gap-2">
                <label class="flex items-center gap-2 flex-1">
                  <span class="text-sm text-ink-500 dark:text-ink-300 whitespace-nowrap">Страница</span>
                  <input
                    v-model="pageInput"
                    type="number"
                    min="0"
                    :max="book.totalPages"
                    inputmode="numeric"
                    class="input tabular-nums"
                  />
                </label>
                <button class="btn-primary" type="button" @click="savePage">
                  <AppIcon name="bookmark" :size="14" />
                  Сохранить
                </button>
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <button class="btn-soft text-xs h-8" type="button" @click="addPages(5)">+5</button>
                <button class="btn-soft text-xs h-8" type="button" @click="addPages(10)">+10</button>
                <button class="btn-soft text-xs h-8" type="button" @click="addPages(20)">+20</button>
                <div class="ml-auto flex items-center gap-2">
                  <input
                    v-model="customQuick"
                    type="number"
                    min="1"
                    inputmode="numeric"
                    class="input w-20 h-8 px-2 py-1 text-sm tabular-nums"
                  />
                  <button class="btn-soft text-xs h-8" type="button" @click="addCustom">
                    <AppIcon name="plus" :size="12" />
                    Добавить
                  </button>
                </div>
              </div>

              <div
                v-if="book.progress.dailyPlan != null"
                class="mt-4 rounded-xl border border-sand-200/60 bg-sand-50/60 dark:bg-sand-500/[0.06] dark:border-sand-500/30 px-3.5 py-3 text-sm text-ink-700 dark:text-ink-100"
              >
                <div class="flex items-center gap-2">
                  <AppIcon name="target" :size="14" class="text-sand-700 dark:text-sand-300" />
                  <span>
                    Сегодня нужно прочитать
                    <span class="font-semibold">{{ pageLabel(book.progress.dailyPlan) }}</span>
                  </span>
                </div>
                <div v-if="book.progress.todayDelta > 0" class="mt-1 text-xs text-ink-500 dark:text-ink-300">
                  Уже прочитано {{ pageLabel(book.progress.todayDelta) }}.
                  <template v-if="book.progress.todayDelta >= book.progress.dailyPlan">
                    План на сегодня выполнен.
                  </template>
                  <template v-else>
                    Осталось ещё {{ pageLabel(book.progress.dailyPlan - book.progress.todayDelta) }}.
                  </template>
                </div>
                <div class="mt-1 text-[11px] text-ink-400">
                  План пересчитывается ежедневно из расчёта оставшихся страниц и дней до дедлайна.
                </div>
              </div>
            </section>

            <section v-else>
              <div
                class="rounded-xl border border-sand-200/60 bg-sand-50/60 dark:bg-sand-500/[0.06] dark:border-sand-500/30 px-3.5 py-3"
              >
                <div class="flex items-center gap-2 text-sm font-medium">
                  <AppIcon name="check" :size="14" class="text-sand-700 dark:text-sand-300" />
                  Книга отмечена прочитанной
                </div>
                <div class="mt-1 text-xs text-ink-500 dark:text-ink-300">
                  {{ book.finishedAt ? `Закрыто ${book.finishedAt}` : '' }}
                </div>
                <button type="button" class="mt-3 btn-soft h-8 text-xs" @click="reopen">
                  <AppIcon name="reset" :size="12" />
                  Вернуть в чтение
                </button>
              </div>
            </section>

            <div class="divider" />

            <section class="flex flex-wrap items-center gap-2">
              <button
                v-if="book.status === 'reading'"
                class="btn-accent"
                type="button"
                @click="finishBook"
              >
                <AppIcon name="check" :size="14" />
                Отметить прочитанной
              </button>
              <button class="btn-ghost" type="button" @click="openEdit">
                <AppIcon name="edit" :size="14" />
                Изменить
              </button>
              <button
                class="ml-auto btn h-9 text-xs"
                type="button"
                :class="confirmingDelete
                  ? 'bg-amber-600 text-white hover:bg-amber-500'
                  : 'bg-ink-50 dark:bg-ink-800 border border-amber-300/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-500/[0.08]'"
                @click="doDelete"
              >
                <AppIcon name="trash" :size="12" />
                {{ confirmingDelete ? 'Подтвердить удаление' : 'Удалить книгу' }}
              </button>
            </section>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
