"use client";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

// -- モック：一旦ここで簡易に書く（本当は /mock/books から取ってOK）
type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl?: string;
};

// 簡易モック一覧（必要なら import に差し替えてOK）
const BOOKS: Book[] = [
  { id: "1", title: "走れメロス", author: "太宰治", description: "友人を信じて走り続けるメロスの物語。", imageUrl: "/mock/hashire_merosu.jpg" },
  { id: "2", title: "坊っちゃん", author: "夏目漱石", description: "青年教師の痛快学園譚。", imageUrl: "/mock/botchan.jpg" },
  // ...必要なら追加
];

// プレビュー用：ダミー本文（適当に日本語文を長めに）
const MOCK_TEXT = `（プレビュー本文）
メロスは激怒した。必ず、かの邪智暴虐の王を除かなければならぬと決意した。メロスには政治がわからぬ。メロスは、村の牧人である。笛を吹き、羊と遊んで暮して来た…（以下略）
これがプレビューの右ページ分となる想定で、文章が続いていきます。
改行をいくつか入れて、見た目のボリュームを調整します。

ここから左ページ相当の内容。実装上は半分付近で切って表示します。
読書方向は右→左なので、左矢印で進む・右矢印で戻る UI を実装します。
`;

/** テキストを「2ページ」に割る（半分付近の改行で割る。なければ真ん中） */
function splitIntoTwoPages(packetText: string): [string, string] {
  const len = packetText.length;
  if (len <= 1) return [packetText, ""];
  const ideal = Math.floor(len / 2);
  const window = 120;

  // 半分付近の改行を探す
  const leftNewline = packetText.lastIndexOf("\n", Math.max(0, ideal));
  const rightNewline = packetText.indexOf("\n", Math.min(len - 1, ideal + 1));

  const pick = (pos: number) =>
    pos >= 0 && Math.abs(pos - ideal) <= window ? pos : -1;

  const candidates = [pick(leftNewline), pick(rightNewline)].filter((x) => x >= 0);
  const cut = candidates.length
    ? candidates.sort((a, b) => Math.abs(a - ideal) - Math.abs(b - ideal))[0]
    : ideal;

  return [packetText.slice(0, cut), packetText.slice(cut)];
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const book = useMemo(() => BOOKS.find((b) => b.id === String(id)) || null, [id]);

  // 1パケット＝2ページのプレビュー（右→左想定）
  const [subPage, setSubPage] = useState<0 | 1>(0); // 0=右ページ、1=左ページ
  const [pageR, pageL] = useMemo(() => splitIntoTwoPages(MOCK_TEXT), []);

  // 左矢印で進む（右→左）
  const goNextPage = () => setSubPage((p) => (p === 0 ? 1 : 1));
  // 右矢印で戻る（左→右）
  const goPrevPage = () => setSubPage((p) => (p === 1 ? 0 : 0));

  if (!book) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <button className="text-sm underline" onClick={() => router.back()}>
          ← 戻る
        </button>
        <div className="mt-4">該当の本が見つかりません。</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center gap-3">
        <button className="text-sm underline" onClick={() => router.back()}>
          ← 戻る
        </button>
      </div>

      {/* 本のメタ情報 */}
      <section className="flex gap-6 items-start">
        <div className="w-32 h-44 relative rounded-lg overflow-hidden border bg-gray-50">
          {book.imageUrl ? (
            <Image src={book.imageUrl} alt={book.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full grid place-content-center text-gray-400 text-sm">
              No Image
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{book.title}</h1>
          <div className="text-gray-600 mt-1">{book.author}</div>
          <p className="mt-3 text-gray-800 leading-7">{book.description}</p>

        </div>
      </section>

      {/* 仕切り */}
      <hr className="my-6" />

      {/* プレビュー：1パケット＝2ページ（右→左） */}
      <section>
        <h2 className="text-sm text-gray-600 mb-2">プレビュー（1パケット / 2ページ, 右→左）</h2>

        <div className="relative border rounded-2xl bg-white shadow-sm overflow-hidden min-h-[320px]">
          {/* 横書き。縦書きにするなら writing-mode を vertical-rl に変更 */}
          <div className="p-5">
            <div
              className="whitespace-pre-wrap leading-7"
              style={{ writingMode: "horizontal-tb" }}
            >
              {subPage === 0 ? pageR : pageL}
            </div>
          </div>

          {/* 左矢印（進む：右→左） */}
          <button
            onClick={goNextPage}
            className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full border bg-white/80 hover:bg-white"
            aria-label="次のページへ（右→左）"
            title="次のページへ"
          >
            ←
          </button>

          {/* 右矢印（戻る：左→右） */}
          <button
            onClick={goPrevPage}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full border bg-white/80 hover:bg-white"
            aria-label="前のページへ（左→右）"
            title="前のページへ"
          >
            →
          </button>
        </div>

        {/* ページインジケータ */}
        <div className="mt-2 text-right text-xs text-gray-600">
          {subPage === 0 ? "1ページ目（右）" : "2ページ目（左）"}
        </div>
      </section>
    </div>
  );
}
