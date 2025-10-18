"use client";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockBooks } from "@/app/mock/books";

type SplitResponse = { boundaries: number[] };

function splitIntoTwoPages(packetText: string): [string, string] {
  const len = packetText.length;
  if (len <= 1) return [packetText, ""];
  const ideal = Math.floor(len / 2);
  const window = 120;

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

  const book = useMemo(() => mockBooks.find((b) => b.id === String(id)) ?? null, [id]);

  // 1パケット＝2ページのプレビュー（右→左想定）
  const [subPage, setSubPage] = useState<0 | 1>(0);
  const [pageR, pageL] = useMemo(
    () => splitIntoTwoPages(book?.description ?? ""),
    [book?.description]
  );

  // ← API で取得した「境界線」保存用
  const [boundaries, setBoundaries] = useState<number[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ここで Flask に POST
  useEffect(() => {
    if (!book?.description) return;

    const controller = new AbortController();
    const run = async () => {
      try {
        setLoading(true);
        setApiError(null);

        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
        const res = await fetch(`http://localhost:5000/api/split`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: book.description }), // Flask 側のキーに合わせる
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
        }

        const json: SplitResponse = await res.json();
        if (!Array.isArray(json.boundaries)) {
          throw new Error("Invalid response shape: boundaries not array");
        }
        setBoundaries(json.boundaries);
      } catch (e: any) {
        setApiError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [book?.description]);

  const goNextPage = () => setSubPage(1);
  const goPrevPage = () => setSubPage(0);

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
      <div className="mb-4 flex items-center gap-3">
        <button className="text-sm underline" onClick={() => router.back()}>
          ← 戻る
        </button>
      </div>

      {/* API の状態表示（デバッグ用） */}
      <div className="mb-4 text-sm">
        {loading && <span>分割処理中...</span>}
        {apiError && <span className="text-red-600">APIエラー: {apiError}</span>}
        {boundaries && (
          <div className="text-gray-600">boundaries: [{boundaries.join(", ")}]</div>
        )}
      </div>

      <section>
        <div className="relative border rounded-2xl bg-white shadow-sm overflow-hidden min-h-[700px]">
          <div className="p-5 flex justify-center">
            <div
              className="whitespace-pre-wrap text-lg inline-block w-[420px]"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                lineHeight: "1.9",
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

        <div className="mt-2 text-right text-xs text-gray-600">
          {subPage === 0 ? "1ページ目（右）" : "2ページ目（左）"}
        </div>
      </section>
    </div>
  );
}
