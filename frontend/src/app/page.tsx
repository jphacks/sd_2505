"use client";
import { useState, useEffect } from 'react';
import { BookCard } from './bookCard';
import { getCurrentlyReadingBooks, getOtherBooks } from './lib/books';
import { mockBooks } from './mock/books';

const currentReadings = getCurrentlyReadingBooks();
const otherBooks = getOtherBooks();

export default function Home() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/')
      .then((res) => res.text())
      .then((data) => setMessage(data));
  }, []);

  return (
    <div className='mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8'>
      <p>{message}</p>
      <h1 className="mb-12 text-4xl font-light tracking-tight text-foreground">Book List</h1>

      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-normal text-foreground">Reading now</h2>
        <div className="flex flex-col gap-3">
          {currentReadings.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      </section>
      
      <section className='mb-16'>
          <h1 className='mb-6 text-2xl font-normal text-foreground'>New Books</h1>
          <div className='flex flex-col gap-3'>
            {otherBooks.map((book) => (
              <BookCard key={book.id} {...book} />
            ))}
          </div>
      </section>

      {mockBooks.map((b) => (
        <div key={b.id} className="border rounded-lg p-3 mb-2 flex items-center justify-between">
          <div>
            <div className="font-medium">{b.title}</div>
            <div className="text-sm text-gray-600">{b.author}</div>
            <p className="text-sm text-gray-700 mt-1">{b.description}</p>
          </div>
          <button className="px-3 py-2 border rounded">読む</button>
        </div>
      ))}

    </div>
  );
}