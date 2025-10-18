import { mockBooks } from "../mock/books"
import { Book } from "@/types/book"

export function getCurrentlyReadingBooks(): Book[] {
  return mockBooks.filter((mockBooks) => mockBooks.progress)
}

export function getBookById(id: string): Book | undefined {
  return mockBooks.find((mockBooks) => mockBooks.id === id)
}

export function getOtherBooks(): Book[] {
  return mockBooks.filter((mockBooks) => !mockBooks.progress)
}