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
  dailyPlan,
  isDeadlineOverdue,
  pagesRemaining,
  bookPercent
} from '@/stores/booksStore.js'

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
    todayDelta: pagesReadToday(book),
    dailyPlan: dailyPlan(book),
    overdue: isDeadlineOverdue(book)
  }
}

export function useBooks() {
  const books = computed(() =>
    state.books.map((b) => ({
      ...b,
      progress: bookProgress(b)
    }))
  )

  const finishedCount = computed(
    () => state.books.filter((b) => b.status === 'finished').length
  )
  const readingCount = computed(
    () => state.books.filter((b) => b.status === 'reading' && b.currentPage > b.startPage).length
  )
  const idleCount = computed(
    () => state.books.filter((b) => b.status === 'reading' && b.currentPage <= b.startPage).length
  )

  return {
    books,
    totalPagesAcrossAll,
    totalReadAcrossAll,
    overallPercent,
    finishedCount,
    readingCount,
    idleCount,
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
