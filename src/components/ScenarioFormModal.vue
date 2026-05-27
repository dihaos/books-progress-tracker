<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useScenarios } from '@/composables/useScenarios.js'
import { useBooks } from '@/composables/useBooks.js'
import { useToast } from '@/composables/useToast.js'
import { todayKey } from '@/utils/date.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  scenarioId: { type: String, default: null }
})
const emit = defineEmits(['close', 'saved'])

const { addScenario, updateScenario, getScenarioById } = useScenarios()
const { books } = useBooks()
const toast = useToast()

const isEdit = computed(() => !!props.scenarioId)

const form = ref({
  title: '',
  deadline: '',
  bookIds: []
})

function resetForm() {
  const s = props.scenarioId ? getScenarioById(props.scenarioId) : null
  if (s) {
    form.value = {
      title: s.title,
      deadline: s.deadline || '',
      bookIds: [...s.bookIds]
    }
  } else {
    form.value = {
      title: '',
      deadline: '2026-12-31',
      bookIds: []
    }
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm()
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }
)

function onKey(e) {
  if (e.key === 'Escape') close()
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

function close() {
  emit('close')
}

const errors = ref({})

function validate() {
  const e = {}
  if (!form.value.title.trim()) e.title = 'Введите название цели'
  if (!form.value.deadline) e.deadline = 'Укажите дедлайн'
  if (!form.value.bookIds.length) e.books = 'Выберите хотя бы одну книгу'
  errors.value = e
  return Object.keys(e).length === 0
}

function toggleBook(id) {
  const idx = form.value.bookIds.indexOf(id)
  if (idx === -1) form.value.bookIds.push(id)
  else form.value.bookIds.splice(idx, 1)
}

function submit() {
  if (!validate()) return
  const payload = {
    title: form.value.title.trim(),
    deadline: form.value.deadline,
    bookIds: [...form.value.bookIds]
  }
  if (isEdit.value) {
    updateScenario(props.scenarioId, payload)
    toast.success('Цель обновлена', 'Сохранено')
    emit('saved', props.scenarioId)
  } else {
    const s = addScenario(payload)
    toast.success('Новая цель создана', 'Готово')
    emit('saved', s.id)
  }
  close()
}

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
      v-if="open"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      @click.self="close"
    >
      <div class="absolute inset-0 bg-ink-900/40 dark:bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <form
        class="relative w-full sm:max-w-xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl overflow-hidden
               bg-ink-50 dark:bg-ink-800 border border-ink-200/70 dark:border-ink-700/70 shadow-card flex flex-col"
        @submit.prevent="submit"
      >
        <header class="relative px-5 sm:px-7 pt-6 pb-4 border-b border-ink-200/70 dark:border-ink-700/60">
          <button type="button" class="absolute top-3 right-3 btn-ghost h-8 w-8 p-0" @click="close">
            <AppIcon name="close" :size="16" />
          </button>
<div class="text-xs text-ink-500">{{ isEdit ? 'Редактирование' : 'Новая цель' }}</div>
          <h2 class="mt-1 font-display text-2xl font-bold tracking-tight">
            {{ isEdit ? 'Изменить сценарий' : 'Создать сценарий' }}
          </h2>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-300">
            Выбери книги из библиотеки и дедлайн — план на день посчитается автоматически.
          </p>
        </header>

        <div class="px-5 sm:px-7 py-5 space-y-4 overflow-y-auto scroll-soft flex-1">
          <div>
            <div class="label mb-1.5">Название</div>
            <input v-model="form.title" type="text" class="input" placeholder="Прочитать в 2026 — 12 книг" />
            <div v-if="errors.title" class="mt-1 text-xs text-amber-700 dark:text-amber-300">{{ errors.title }}</div>
          </div>

          <div>
            <div class="label mb-1.5">Дедлайн</div>
            <input v-model="form.deadline" type="date" class="input tabular-nums" :min="todayStr" />
            <div v-if="errors.deadline" class="mt-1 text-xs text-amber-700 dark:text-amber-300">{{ errors.deadline }}</div>
          </div>

          <div>
            <div class="label mb-2">Книги из библиотеки</div>
            <div v-if="errors.books" class="mb-2 text-xs text-amber-700 dark:text-amber-300">{{ errors.books }}</div>
            <div v-if="!books.length" class="text-sm text-ink-500 py-4 text-center card">
              Сначала добавь книги в библиотеку.
            </div>
            <div
              v-else
              class="max-h-56 overflow-y-auto scroll-soft space-y-1 rounded-xl border border-ink-200/70 dark:border-ink-700/60 p-2"
            >
              <label
                v-for="b in books"
                :key="b.id"
                class="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer
                       hover:bg-ink-100/80 dark:hover:bg-ink-700/40 transition-colors"
              >
                <input
                  type="checkbox"
                  class="rounded border-ink-300 text-sand-600 focus:ring-sand-400"
                  :checked="form.bookIds.includes(b.id)"
                  @change="toggleBook(b.id)"
                />
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-medium truncate">{{ b.title }}</span>
                  <span v-if="b.author" class="block text-xs text-ink-400 truncate">{{ b.author }}</span>
                </span>
                <span class="text-xs tabular-nums text-ink-400 shrink-0">{{ b.totalPages }} стр.</span>
              </label>
            </div>
          </div>
        </div>

        <footer class="px-5 sm:px-7 py-4 border-t border-ink-200/70 dark:border-ink-700/60 flex justify-end gap-2">
          <button type="button" class="btn-ghost" @click="close">Отмена</button>
          <button type="submit" class="btn-primary">
            <AppIcon :name="isEdit ? 'check' : 'plus'" :size="16" />
            {{ isEdit ? 'Сохранить' : 'Создать' }}
          </button>
        </footer>
      </form>
    </div>
  </Transition>
</template>
