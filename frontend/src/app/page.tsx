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
    <div>
      <header className='bg-black shadow-lg'>
        <nav className='bg-neutral-900 text-gray-300 py-6 text-center border-t border-neutral-800 text-lg font-semibold'>すきま文庫</nav>
      </header>
      <div className='py-40 text-center'>
        <h1 className='text-4xl md:text-6xl font-extrabold text-gray-800 py-10 tracking-tight'>「いつか読もう」？ 今日から読もう</h1>
        <p></p>
      </div>
    <div className='mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8'>
      <p>{message}</p>
      <h1 className="mb-12 text-4xl font-light tracking-tight text-foreground">Book List</h1>

      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-normal text-foreground">Reading Now</h2>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {currentReadings.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      </section>
      
      <section className='mb-16'>
          <h1 className='mb-6 text-2xl font-normal text-foreground'>New Books</h1>
          <div className='grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3'>
            {otherBooks.map((book) => (
              <BookCard key={book.id} {...book} />
            ))}
          </div>
      </section>
    </div>
    </div>
  );
}