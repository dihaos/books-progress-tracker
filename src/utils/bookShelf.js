/**
 * Shelf status for library / scenario views.
 * - finished: book marked complete or currentPage >= totalPages
 * - reading: started but not finished
 * - queue: not started yet (bookmark at or before start baseline)
 */
export function getShelfKey(book) {
  if (book.status === 'finished' || book.currentPage >= book.totalPages) {
    return 'finished'
  }
  if (book.currentPage > book.startPage) {
    return 'reading'
  }
  return 'queue'
}

export const SHELF_ORDER = ['reading', 'queue', 'finished']

export const SHELF_META = {
  reading: {
    key: 'reading',
    title: 'Читаю',
    subtitle: 'Закладка открыта — продолжай с того места'
  },
  queue: {
    key: 'queue',
    title: 'В очереди',
    subtitle: 'Ещё не начинал или только добавил в список'
  },
  finished: {
    key: 'finished',
    title: 'Прочитано',
    subtitle: 'Закрытые тома'
  }
}

export function groupBooksByShelf(books) {
  const groups = { reading: [], queue: [], finished: [] }
  for (const book of books) {
    groups[getShelfKey(book)].push(book)
  }
  return groups
}
