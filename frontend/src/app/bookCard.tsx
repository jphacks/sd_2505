"use client"

import Link from "next/link"
import { Book } from "@/types/book"
import { mockBooks } from "./mock/books"

interface BookCardProps {
  id: number
  title: string
  author: string
  progress?: string
}

export function BookCard({ id, title, author, progress, imageUrl }: Book) {
  return (
    <Link
      href={`/books/${id}`}
      className="group block rounded-lg bg-secondary shadow-sm transition-all duration-200 hover:bg-accent hover:shadow-md"
    >
      <div className="flex flex-col">
        {/* Book cover area with icon */}
        <div className="flex items-center justify-center bg-primary/5 p-12 rounded-t-lg">
          <img src={imageUrl} className="h-16 w-16 text-primary/40"/>
        </div>

        {/* Book info area */}
        <div className="p-4 space-y-2">
          <h3 className="text-base font-medium leading-snug text-foreground group-hover:text-accent-foreground line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{author}</p>
        {progress && (
          <div className="pt-1">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {progress}
            </span>
          </div>
        )}
        </div>
      </div>
    </Link>
  )
}
