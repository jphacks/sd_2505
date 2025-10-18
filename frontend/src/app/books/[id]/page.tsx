"use client";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { mockBooks } from "@/app/mock/books";


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

  const book = useMemo(() => mockBooks.find((b) => b.id === String(id)) || null, [id]);

  // 1パケット＝2ページのプレビュー（右→左想定）
  const [subPage, setSubPage] = useState<0 | 1>(0); // 0=右ページ、1=左ページ
  const [pageR, pageL] = useMemo(
  () => splitIntoTwoPages(book?.description ?? ""),
  [book?.description]
  );

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

      {/* プレビュー：1パケット＝2ページ（右→左） */}
      <section>

        <div className="relative border rounded-2xl bg-white shadow-sm overflow-hidden min-h-[700px]">
          {/* 横書き。縦書きにするなら writing-mode を vertical-rl に変更 */}
          <div className="p-5 flex justify-center">
            <div
              className="whitespace-pre-wrap text-lg inline-block w-[420px]"
              style={{
                writingMode: "vertical-rl",   // 縦書き（右→左へ行送り）
                textOrientation: "mixed",     // ラテン文字は横向き、日本語は縦
                lineHeight: "1.9",            // 行間（縦方向の字送り）
              }}
            >
              {subPage === 0 ? pageR : pageL}
            </div>
          </div>

          {/* 左矢印（進む：右→左） */}
          <button
            onClick={goNextPage}
            className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full border bg-white/80 hover:bg-red-100"
            aria-label="次のページへ（右→左）"
            title="次のページへ"
          >
            ←
          </button>

          {/* 右矢印（戻る：左→右） */}
          <button
            onClick={goPrevPage}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full border bg-white/80 hover:bg-red-100"
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
