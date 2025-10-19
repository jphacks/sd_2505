// src/components/FAQ.tsx
"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    question: "このアプリはどんなアプリですか？",
    answer:
      "小説や文学作品を縦書きで快適に読めるように設計されたリーディングアプリです。ページごとに進行し、アンロック機能で順番に読めるようになっています。",
  },
  {
    question: "ページが『■』で隠れているのはなぜですか？",
    answer:
      "ロック中のページだからです。物語を進めると自動的にアンロックされ、本文が表示されます。",
  },
  {
    question: "ページを進めたり戻ったりするには？",
    answer:
      "画面左右の『←』『→』ボタンでページを切り替えられます。スマホではスワイプにも対応予定です。",
  },
  {
    question: "フォントサイズや余白を変えられますか？",
    answer:
      "今後のアップデートで調整機能を追加予定です。現在は固定サイズでの表示です。",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="max-w-2xl mx-auto mt-12 p-6 bg-white rounded-xl shadow-sm border">
      <h2 className="text-2xl font-semibold mb-6 text-center">よくある質問</h2>
      <ul className="space-y-3">
        {faqItems.map((item, index) => (
          <li
            key={index}
            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition"
            onClick={() =>
              setOpenIndex(openIndex === index ? null : index)
            }
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800">{item.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </div>
            {openIndex === index && (
              <p className="mt-3 text-gray-700 text-sm leading-relaxed">
                {item.answer}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
