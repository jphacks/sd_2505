// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="mt-16 bg-neutral-900 text-gray-300 py-6 text-center border-t border-neutral-800">
      <div className="max-w-4xl mx-auto px-4">
        <p className="text-sm font-medium tracking-wide">
          Created by <span className="text-white font-semibold">馬車馬boys</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          © {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  );
}
