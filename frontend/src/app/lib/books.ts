export interface Book {
  id: number
  title: string
  author: string
  progress?: string
}

export const booksData: Book[] = [
  {
    id: 1,
    title: "BookA",
    author: "AuthorA",
    progress: "10%",
  },
  {
    id: 2,
    title: "BookB",
    author: "AuthorB",
  }
]

export function getCurrentlyReadingBooks(): Book[] {
  return booksData.filter((book) => book.progress)
}

export function getBookById(id: number): Book | undefined {
  return booksData.find((book) => book.id === id)
}

export function getOtherBooks(): Book[] {
  return booksData.filter((book) => !book.progress)
}