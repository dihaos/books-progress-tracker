const SEARCH_URL = 'https://openlibrary.org/search.json'

export async function searchBooksByTitle(title, { signal, limit = 7 } = {}) {
  const params = new URLSearchParams({
    title: title.trim(),
    fields: 'key,title,author_name',
    lang: 'ru',
    limit: String(limit)
  })

  const response = await fetch(`${SEARCH_URL}?${params}`, { signal })
  if (!response.ok) throw new Error(`Book search failed: ${response.status}`)

  const data = await response.json()
  const seen = new Set()

  return (data.docs || []).flatMap((book) => {
    const title = typeof book.title === 'string' ? book.title.trim() : ''
    if (!title) return []

    const authors = Array.isArray(book.author_name)
      ? book.author_name.filter((author) => typeof author === 'string' && author.trim())
      : []
    const author = authors.join(', ')
    const uniqueKey = `${title.toLocaleLowerCase()}|${author.toLocaleLowerCase()}`
    if (seen.has(uniqueKey)) return []
    seen.add(uniqueKey)

    return [{
      id: book.key || uniqueKey,
      title,
      author
    }]
  })
}
