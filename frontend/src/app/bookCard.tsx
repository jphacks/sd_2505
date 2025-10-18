"use client"

import Link from "next/link"

interface BookCardProps {
  id: number
  title: string
  author: string
  progress?: string
}

export function BookCard({ id, title, author, progress }: BookCardProps) {
  return (
    <Link
      href={`/books/${id}`}
      className="group block rounded-lg bg-secondary p-5 shadow-sm transition-all duration-200 hover:bg-accent hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-medium leading-relaxed text-foreground group-hover:text-accent-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{author}</p>
        </div>
        {progress && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {progress}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
