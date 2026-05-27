<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useBooks } from '@/composables/useBooks.js'
import { useTheme } from '@/composables/useTheme.js'
import { useToast } from '@/composables/useToast.js'
import { clearStorage } from '@/stores/booksStore.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const { exportData, importData, resetAll } = useBooks()
const { theme, setTheme } = useTheme()
const toast = useToast()

const fileRef = ref(null)
const confirmingReset = ref(false)

function close() {
  emit('close')
}

function onKey(e) {
  if (e.key === 'Escape') close()
}
watch(
  () => props.open,
  (open) => {
    if (typeof document === 'undefined') return
    if (open) {
      document.addEventListener('keydown', onKey)
    } else {
      document.removeEventListener('keydown', onKey)
      confirmingReset.value = false
    }
  }
)
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))

function downloadExport() {
  const data = exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `library-progress-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  toast.success('Файл с прогрессом сохранён', 'Экспорт')
}

function triggerImport() {
  fileRef.value?.click()
}

function handleFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result)
      importData(data)
      toast.success('Прогресс восстановлен из файла', 'Импорт')
    } catch (err) {
      toast.error(err.message || 'Не удалось прочитать файл', 'Ошибка импорта')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function doReset() {
  if (!confirmingReset.value) {
    confirmingReset.value = true
    return
  }
  resetAll()
  clearStorage()
  confirmingReset.value = false
  toast.info('Библиотека, цели и прогресс удалены', 'Сброс')
}

const themeOptions = [
  { id: 'light', label: 'Светлая', icon: 'sun' },
  { id: 'dark', label: 'Тёмная', icon: 'moon' },
  { id: 'system', label: 'Системная', icon: 'sparkles' }
]
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
      class="fixed inset-0 z-50 flex justify-end"
      @click.self="close"
    >
      <div class="absolute inset-0 bg-ink-900/40 dark:bg-black/60 backdrop-blur-sm" />
      <Transition
        appear
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-x-6 opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-6 opacity-0"
      >
        <aside
          v-if="open"
          class="relative w-full sm:w-[420px] max-w-full bg-ink-50 dark:bg-ink-800 border-l border-ink-200/70 dark:border-ink-700/60 shadow-card flex flex-col"
        >
          <header class="px-5 sm:px-6 py-5 border-b border-ink-200/70 dark:border-ink-700/60 flex items-start justify-between">
            <div>
              <h2 class="font-display text-xl font-semibold tracking-tight">Настройки</h2>
              <p class="text-sm text-ink-500 dark:text-ink-300">Тема, импорт и экспорт библиотеки</p>
            </div>
            <button class="btn-ghost h-8 w-8 p-0" @click="close" aria-label="Закрыть">
              <AppIcon name="close" :size="16" />
            </button>
          </header>

          <div class="flex-1 overflow-y-auto scroll-soft px-5 sm:px-6 py-5 space-y-6">
            <section>
              <div class="label mb-2">Внешний вид</div>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="opt in themeOptions"
                  :key="opt.id"
                  type="button"
                  class="rounded-xl border px-3 py-3 flex flex-col items-center gap-1.5 text-xs font-medium transition-all"
                  :class="theme === opt.id
                    ? 'bg-sand-100 border-sand-400 text-sand-800 dark:bg-sand-500/[0.10] dark:border-sand-500/40 dark:text-sand-200'
                    : 'bg-ink-50 dark:bg-ink-900/40 border-ink-200/60 dark:border-ink-700/60 text-ink-600 dark:text-ink-200 hover:border-sand-400/60'"
                  @click="setTheme(opt.id)"
                >
                  <AppIcon :name="opt.icon" :size="16" />
                  {{ opt.label }}
                </button>
              </div>
            </section>

            <div class="divider" />

            <section>
              <div class="label mb-2">Данные</div>
              <div class="space-y-2">
                <button class="btn-soft w-full justify-start" @click="downloadExport">
                  <AppIcon name="download" :size="16" />
                  Экспортировать библиотеку (JSON)
                </button>
                <button class="btn-soft w-full justify-start" @click="triggerImport">
                  <AppIcon name="upload" :size="16" />
                  Импортировать из файла
                </button>
                <input
                  ref="fileRef"
                  type="file"
                  accept="application/json,.json"
                  class="hidden"
                  @change="handleFile"
                />
              </div>
            </section>

            <div class="divider" />

            <section>
              <div class="label mb-2">Опасная зона</div>
              <div class="rounded-xl border border-amber-300/60 bg-amber-50/70 dark:bg-amber-500/[0.06] dark:border-amber-500/30 p-3.5">
                <div class="flex items-start gap-2.5">
                  <AppIcon name="warning" :size="16" class="text-amber-700 dark:text-amber-300 mt-0.5" />
                  <div class="text-xs text-amber-900 dark:text-amber-200">
                    Сброс удалит все книги и историю активности. Это действие нельзя отменить.
                  </div>
                </div>
                <button
                  class="mt-3 w-full justify-center btn"
                  :class="confirmingReset
                    ? 'bg-amber-600 text-white hover:bg-amber-500'
                    : 'bg-ink-50 dark:bg-ink-800 border border-amber-300/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-500/[0.08]'"
                  @click="doReset"
                >
                  <AppIcon name="reset" :size="14" />
                  {{ confirmingReset ? 'Подтвердить сброс' : 'Сбросить библиотеку' }}
                </button>
              </div>
            </section>
          </div>

          <footer class="px-5 sm:px-6 py-4 border-t border-ink-200/70 dark:border-ink-700/60 text-[11px] text-ink-400">
            Библиотека хранится локально в вашем браузере. Регулярный экспорт защитит от потери данных.
          </footer>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>
