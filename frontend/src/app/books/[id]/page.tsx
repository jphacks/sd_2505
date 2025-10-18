import { notFound } from "next/navigation"
import Link from "next/link"
import { getBookById } from "@/app/lib/books"

export default function BookPage({ params }: { params: { id: string } }) {
  const bookId = Number.parseInt(params.id)
  const book = getBookById(bookId)

  if (!book) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <p>
            {book.title}の内容を表示
        </p>
      </div>
    </main>
  )
}
