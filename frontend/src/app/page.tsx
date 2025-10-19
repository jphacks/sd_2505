"use client";
import { useState, useEffect } from 'react';
import { BookCard } from './bookCard';
import { getCurrentlyReadingBooks, getOtherBooks } from './lib/books';
import { mockBooks } from './mock/books';
import FAQ from './components/FAQ';
import Footer from './components/footer';

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
    <div
  className="relative bg-cover bg-center bg-fixed text-white"
  style={{
    backgroundImage: "url('/library-bg.jpg')", // public配下に画像を置く
  }}
>
  <header className="shadow-lg backdrop-blur-sm">
    <nav className="bg-neutral-900/70 text-gray-200 py-6 text-center text-lg font-semibold">
      すきま文庫
    </nav>
  </header>

  <div className="flex flex-col items-center justify-center py-40 px-4 text-center bg-black/40">
    <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
      「いつか読もう」？ 今日から読もう
    </h1>
    <p className="mt-4 text-lg md:text-xl text-gray-200 italic">
      ~ 読書が続かないと思っている方へ ~
    </p>
  </div>
</div>

    <div className='mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8'>

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
    <FAQ/>
    <Footer/>
    </div>
  );
}