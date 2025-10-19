"use client"

import Link from "next/link"
import { Book } from "@/types/book"
import { mockBooks } from "./mock/books"
import { timeIcon } from './components/timeLeft';
import Image, { StaticImageData } from "next/image";




interface BookCardProps {
  id: number
  title: string
  author: string
  progress?: string
}

const bookCover: {[key: string]:string} = {
  '1': '/img/hashire_merosu.jpg',
  '2': '/img/botchan.jpg',
  '3': '/img/kokoro.jpg',
  '4': '/img/ginga.jpg',
  '5': '/img/neko.jpg',
  '6': '/img/rashomon.jpg',
  '7': '/img/yukiguni.jpg',
  '8': '/img/shikkaku.jpg',
  '9': '/img/amenimo.jpg',
  '10': '/img/shayou.jpg'
} 

export function BookCard({ id, title, author, progress, imageUrl }: Book) {
  const imageSrc = bookCover[id];

  return (
    <Link
      href={`/books/${id}`}
      className="group block rounded-lg bg-secondary shadow-sm transition-all duration-200 hover:bg-accent hover:shadow-md"
    >
      <div className="flex flex-col">
        {/* Book cover area with icon */}
        <div className="relative items-center justify-center bg-primary/5 p-12 rounded-t-lg">
          {progress && (timeIcon())}
          <Image
            src={imageSrc}
            alt={`${imageUrl}`}
            width={150}
            height={100}
            className="object-fill overflow-clip duration-300 group-hover:scale-110"
          />
        </div>

        {/* Book info area */}
        <div className="position-relative p-4 space-y-2">
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
