import { computed } from 'vue'
import state, {
  addBook,
  updateBookFields,
  setCurrentPage,
  markBookFinished,
  reopenBook,
  removeBook,
  resetAll,
  exportData,
  importData,
  totalPagesAcrossAll,
  totalReadAcrossAll,
  overallPercent,
  pagesReadToday,
  pagesRemaining,
  bookPercent
} from '@/stores/booksStore.js'
import { groupBooksByShelf } from '@/utils/bookShelf.js'

function bookProgress(book) {
  const learned = book.currentPage
  const total = book.totalPages
  return {
    learned,
    total,
    remaining: pagesRemaining(book),
    percent: bookPercent(book),
    isComplete: book.status === 'finished' || learned >= total,
    isInProgress: book.status !== 'finished' && learned > book.startPage && learned < total,
    isNotStarted: book.status !== 'finished' && learned <= book.startPage,
    todayDelta: pagesReadToday(book)
  }
}

export function useBooks() {
  const books = computed(() =>
    state.books.map((b) => ({
      ...b,
      progress: bookProgress(b)
    }))
  )

  const shelves = computed(() => groupBooksByShelf(books.value))

  const finishedCount = computed(
    () => books.value.filter((b) => b.progress.isComplete).length
  )
  const readingCount = computed(
    () => books.value.filter((b) => b.progress.isInProgress).length
  )
  const queueCount = computed(
    () => books.value.filter((b) => b.progress.isNotStarted && !b.progress.isComplete).length
  )

  return {
    books,
    shelves,
    totalPagesAcrossAll,
    totalReadAcrossAll,
    overallPercent,
    finishedCount,
    readingCount,
    queueCount,
    idleCount: queueCount,
    addBook,
    updateBookFields,
    setCurrentPage,
    markBookFinished,
    reopenBook,
    removeBook,
    resetAll,
    exportData,
    importData
  }
}
