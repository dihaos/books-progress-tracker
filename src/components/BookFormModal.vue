<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useBooks } from '@/composables/useBooks.js'
import { useToast } from '@/composables/useToast.js'
import { searchBooksByTitle } from '@/api/bookSearchApi.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  bookId: { type: String, default: null }
})
const emit = defineEmits(['close', 'added'])

const { addBook, updateBookFields, books } = useBooks()
const toast = useToast()

const isEdit = computed(() => !!props.bookId)
const editingBook = computed(() =>
  props.bookId ? books.value.find((b) => b.id === props.bookId) : null
)

const form = ref({
  title: '',
  author: '',
  totalPages: '',
  currentPage: '',
})

const suggestions = ref([])
const isSearching = ref(false)
const searchFailed = ref(false)
const titleFocused = ref(false)
const activeSuggestion = ref(-1)
let searchTimer
let searchController
let skipNextSearch = false

const showSuggestions = computed(() =>
  titleFocused.value && form.value.title.trim().length >= 2
)

watch(
  () => form.value.title,
  (title) => {
    clearTimeout(searchTimer)
    searchController?.abort()
    activeSuggestion.value = -1
    searchFailed.value = false

    if (skipNextSearch) {
      skipNextSearch = false
      return
    }

    if (!props.open || title.trim().length < 2) {
      suggestions.value = []
      isSearching.value = false
      return
    }

    isSearching.value = true
    searchTimer = setTimeout(async () => {
      const controller = new AbortController()
      searchController = controller
      try {
        suggestions.value = await searchBooksByTitle(title, {
          signal: controller.signal
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          suggestions.value = []
          searchFailed.value = true
        }
      } finally {
        if (searchController === controller && !controller.signal.aborted) {
          isSearching.value = false
        }
      }
    }, 350)
  }
)

function selectSuggestion(book) {
  clearTimeout(searchTimer)
  searchController?.abort()
  isSearching.value = false
  skipNextSearch = true
  form.value.title = book.title
  form.value.author = book.author
  suggestions.value = []
  titleFocused.value = false
  activeSuggestion.value = -1
}

function onTitleKeydown(event) {
  if (!showSuggestions.value || !suggestions.value.length) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeSuggestion.value = (activeSuggestion.value + 1) % suggestions.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeSuggestion.value = activeSuggestion.value <= 0
      ? suggestions.value.length - 1
      : activeSuggestion.value - 1
  } else if (event.key === 'Enter' && activeSuggestion.value >= 0) {
    event.preventDefault()
    selectSuggestion(suggestions.value[activeSuggestion.value])
  }
}

function resetForm() {
  if (editingBook.value) {
    const b = editingBook.value
    form.value = {
      title: b.title,
      author: b.author || '',
      totalPages: String(b.totalPages),
      currentPage: String(b.currentPage)
    }
  } else {
    form.value = {
      title: '',
      author: '',
      totalPages: '',
      currentPage: '0'
    }
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm()
      suggestions.value = []
      searchFailed.value = false
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
  clearTimeout(searchTimer)
  searchController?.abort()
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

function close() {
  emit('close')
}

const errors = ref({})

function validate() {
  const e = {}
  const total = Number(form.value.totalPages)
  const current = Number(form.value.currentPage || 0)
  if (!form.value.title.trim()) e.title = 'Введите название'
  if (!total || total < 1) e.totalPages = 'Нужно положительное число'
  if (current < 0) e.currentPage = 'Не может быть отрицательным'
  if (total && current > total) e.currentPage = `Не больше ${total}`
  errors.value = e
  return Object.keys(e).length === 0
}

function submit() {
  if (!validate()) return

  const payload = {
    title: form.value.title.trim(),
    author: form.value.author.trim(),
    totalPages: Number(form.value.totalPages),
    currentPage: Number(form.value.currentPage || 0)
  }

  if (isEdit.value && editingBook.value) {
    updateBookFields(editingBook.value.id, {
      title: payload.title,
      author: payload.author,
      totalPages: payload.totalPages
    })
    toast.success('Книга обновлена', 'Изменения сохранены')
    emit('added', editingBook.value.id)
    close()
    return
  }

  const book = addBook(payload)
  toast.success(`«${book.title}» добавлена в библиотеку`, 'Готово')
  emit('added', book.id)
  close()
}

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
      <Transition
        appear
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-6 sm:translate-y-2 sm:scale-[0.98]"
        enter-to-class="opacity-100 translate-y-0 sm:scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0 translate-y-4"
      >
        <form
          v-if="open"
          class="relative w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl overflow-hidden
                 bg-ink-50 dark:bg-ink-800 border border-ink-200/70 dark:border-ink-700/70 shadow-card
                 flex flex-col"
          @submit.prevent="submit"
        >
          <header
            class="relative px-5 sm:px-7 pt-6 pb-5 border-b border-ink-200/70 dark:border-ink-700/60
                   bg-gradient-to-br from-sand-50 via-ink-50 to-sand-100/60
                   dark:from-sand-500/[0.06] dark:via-ink-800 dark:to-cocoa-500/[0.04]"
          >
            <button
              type="button"
              class="absolute top-3 right-3 btn-ghost h-8 w-8 p-0"
              @click="close"
              aria-label="Закрыть"
            >
              <AppIcon name="close" :size="16" />
            </button>
            <div class="text-xs text-ink-500 dark:text-ink-300">
              {{ isEdit ? 'Редактирование' : 'Новая книга' }}
            </div>
            <h2 class="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight">
              {{ isEdit ? 'Изменить параметры' : 'Добавить книгу' }}
            </h2>
            <p class="mt-1 text-sm text-ink-500 dark:text-ink-300">
              Книга попадёт в библиотеку. Дедлайн задаётся в целях (сценариях).
            </p>
          </header>

          <div class="px-5 sm:px-7 py-5 space-y-4 max-h-[70vh] overflow-y-auto scroll-soft">
            <div class="relative">
              <div class="label mb-1.5">Название</div>
              <input
                v-model="form.title"
                type="text"
                class="input"
                placeholder="Например, «Война и мир»"
                autocomplete="off"
                autofocus
                role="combobox"
                aria-autocomplete="list"
                :aria-expanded="showSuggestions"
                aria-controls="book-title-suggestions"
                :aria-activedescendant="activeSuggestion >= 0 ? `book-suggestion-${activeSuggestion}` : undefined"
                @focus="titleFocused = true"
                @blur="titleFocused = false"
                @keydown="onTitleKeydown"
              />
              <div v-if="errors.title" class="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {{ errors.title }}
              </div>
              <div
                v-if="showSuggestions"
                id="book-title-suggestions"
                role="listbox"
                class="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-ink-200/80 bg-white shadow-card dark:border-ink-700 dark:bg-ink-800"
              >
                <div v-if="isSearching" class="px-4 py-3 text-sm text-ink-500 dark:text-ink-300">
                  Ищем книги…
                </div>
                <button
                  v-for="(book, index) in suggestions"
                  v-else
                  :id="`book-suggestion-${index}`"
                  :key="book.id"
                  type="button"
                  role="option"
                  :aria-selected="index === activeSuggestion"
                  class="block w-full px-4 py-2.5 text-left transition-colors hover:bg-sand-100 dark:hover:bg-ink-700"
                  :class="index === activeSuggestion ? 'bg-sand-100 dark:bg-ink-700' : ''"
                  @mousedown.prevent="selectSuggestion(book)"
                  @mouseenter="activeSuggestion = index"
                >
                  <span class="block text-sm font-medium text-ink-900 dark:text-ink-50">{{ book.title }}</span>
                  <span class="mt-0.5 block text-xs text-ink-500 dark:text-ink-300">
                    {{ book.author || 'Автор не указан' }}
                  </span>
                </button>
                <div
                  v-if="!isSearching && !suggestions.length"
                  class="px-4 py-3 text-sm text-ink-500 dark:text-ink-300"
                >
                  {{ searchFailed ? 'Не удалось загрузить подсказки. Можно ввести вручную.' : 'Подходящих книг не найдено' }}
                </div>
              </div>
            </div>

            <div>
              <div class="label mb-1.5">Автор <span class="normal-case text-ink-400">(необязательно)</span></div>
              <input
                v-model="form.author"
                type="text"
                class="input"
                placeholder="Лев Толстой"
                autocomplete="off"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="label mb-1.5">Всего страниц</div>
                <input
                  v-model="form.totalPages"
                  type="number"
                  min="1"
                  inputmode="numeric"
                  class="input tabular-nums"
                  placeholder="например, 480"
                />
                <div v-if="errors.totalPages" class="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {{ errors.totalPages }}
                </div>
              </div>
              <div>
                <div class="label mb-1.5">Текущая страница</div>
                <input
                  v-model="form.currentPage"
                  type="number"
                  min="0"
                  inputmode="numeric"
                  class="input tabular-nums"
                  placeholder="0"
                  :disabled="isEdit"
                />
                <div v-if="errors.currentPage" class="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {{ errors.currentPage }}
                </div>
                <div v-if="isEdit" class="mt-1 text-[11px] text-ink-400">
                  Меняй через детальный экран книги, чтобы корректно посчиталась активность.
                </div>
              </div>
            </div>

          </div>

          <footer class="px-5 sm:px-7 py-4 border-t border-ink-200/70 dark:border-ink-700/60 flex items-center justify-end gap-2">
            <button type="button" class="btn-ghost" @click="close">Отмена</button>
            <button type="submit" class="btn-primary">
              <AppIcon :name="isEdit ? 'check' : 'plus'" :size="16" />
              {{ isEdit ? 'Сохранить' : 'Добавить книгу' }}
            </button>
          </footer>
        </form>
      </Transition>
    </div>
  </Transition>
</template>
