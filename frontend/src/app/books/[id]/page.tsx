"use client";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockBooks } from "@/app/mock/books";

type SplitResponse = { boundaries: number[] };

// boundariesに基づいて本文を分割する関数
function splitTextByBoundaries(text: string, boundaries: number[]): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  for (const boundary of boundaries) {
    chunks.push(text.slice(start, boundary));
    start = boundary;
  }
  
  return chunks;
}

// 2ページごとのマスク管理
interface MaskState {
  unlockedPages: number[]; // アンロックされたページ
  lastUnlockTime: number; // 最後のアンロック時間
  currentPage: number; // 現在のページ
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const book = useMemo(() => mockBooks.find((b) => b.id === String(id)) ?? null, [id]);

  // API で取得した「境界線」保存用
  const [boundaries, setBoundaries] = useState<number[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // マスク状態管理
  const [maskState, setMaskState] = useState<MaskState>({
    unlockedPages: [0], // 最初のページは常にアンロック
    lastUnlockTime: Date.now(),
    currentPage: 0
  });
  
  // 現在のページ（2ページごと）
  const [currentPage, setCurrentPage] = useState(0);
  const [subPage, setSubPage] = useState<0 | 1>(0); // 0=右ページ、1=左ページ

  // boundariesに基づく本文分割
  const textChunks = useMemo(() => {
    if (!book?.description || !boundaries) return [];
    return splitTextByBoundaries(book.description, boundaries);
  }, [book?.description, boundaries]);

  // 現在表示するテキスト（マスク適用）
  const displayText = useMemo(() => {
    if (!textChunks.length) return "";
    
    const currentChunkIndex = Math.floor(currentPage / 2);
    if (currentChunkIndex >= textChunks.length) return "";
    
    const currentChunk = textChunks[currentChunkIndex];
    const isUnlocked = maskState.unlockedPages.includes(currentChunkIndex);
    
    if (isUnlocked) {
      return currentChunk;
    } else {
      // マスク表示（最初の50文字のみ表示、残りは■で隠す）
      const visibleLength = Math.min(50, currentChunk.length);
      const visibleText = currentChunk.slice(0, visibleLength);
      const maskedText = "■".repeat(Math.max(0, currentChunk.length - visibleLength));
      return visibleText + maskedText;
    }
  }, [textChunks, currentPage, maskState.unlockedPages]);

  // 2ページに分割
  const [pageR, pageL] = useMemo(() => {
    const text = displayText;
    const len = text.length;
    if (len <= 1) return [text, ""];
    const ideal = Math.floor(len / 2);
    const window = 120;

    const leftNewline = text.lastIndexOf("\n", Math.max(0, ideal));
    const rightNewline = text.indexOf("\n", Math.min(len - 1, ideal + 1));
    const pick = (pos: number) =>
      pos >= 0 && Math.abs(pos - ideal) <= window ? pos : -1;

    const candidates = [pick(leftNewline), pick(rightNewline)].filter((x) => x >= 0);
    const cut = candidates.length
      ? candidates.sort((a, b) => Math.abs(a - ideal) - Math.abs(b - ideal))[0]
      : ideal;

    return [text.slice(0, cut), text.slice(cut)];
  }, [displayText]);

  // ここで Flask に POST
  useEffect(() => {
    if (!book?.description) return;

    const controller = new AbortController();
    const run = async () => {
      try {
        setLoading(true);
        setApiError(null);

        const res = await fetch(`http://localhost:5000/api/split`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: book.description }),
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

  // ページ移動とマスク管理
  const goNextPage = () => {
    if (subPage === 0) {
      setSubPage(1);
    } else {
      // 2ページ読み終わったら次のチャンクへ
      const nextPage = currentPage + 2;
      setCurrentPage(nextPage);
      setSubPage(0);
      
      // 2ページ読んだらマスクを適用
      const currentChunkIndex = Math.floor(nextPage / 2);
      if (!maskState.unlockedPages.includes(currentChunkIndex)) {
        setMaskState(prev => ({
          ...prev,
          unlockedPages: [...prev.unlockedPages, currentChunkIndex],
          lastUnlockTime: Date.now()
        }));
      }
    }
  };

  const goPrevPage = () => {
    if (subPage === 1) {
      setSubPage(0);
    } else if (currentPage > 0) {
      const prevPage = currentPage - 2;
      setCurrentPage(prevPage);
      setSubPage(1);
    }
  };

  // 1時間ごとのマスク解除タイマー
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1時間
      
      if (now - maskState.lastUnlockTime >= oneHour) {
        // 次のチャンクをアンロック
        const nextChunkIndex = Math.max(...maskState.unlockedPages) + 1;
        if (textChunks.length > nextChunkIndex) {
          setMaskState(prev => ({
            ...prev,
            unlockedPages: [...prev.unlockedPages, nextChunkIndex],
            lastUnlockTime: now
          }));
        }
      }
    }, 60000); // 1分ごとにチェック

    return () => clearInterval(interval);
  }, [maskState.lastUnlockTime, textChunks.length]);

  // ローカルストレージからマスク状態を復元
  useEffect(() => {
    const saved = localStorage.getItem(`maskState_${id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMaskState(parsed);
      } catch (e) {
        console.error('Failed to parse saved mask state:', e);
      }
    }
  }, [id]);

  // マスク状態をローカルストレージに保存
  useEffect(() => {
    localStorage.setItem(`maskState_${id}`, JSON.stringify(maskState));
  }, [maskState, id]);

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

      {/* ヘッダー情報 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{book.title}</h1>
          <span className="text-sm text-gray-500">
            第{Math.floor(currentPage / 2) + 1}章
          </span>
        </div>
        
        {/* 進捗表示 */}
        {textChunks.length > 0 && (
          <div className="text-sm text-gray-600">
            進捗: {maskState.unlockedPages.length} / {textChunks.length} 章
          </div>
        )}
      </div>

      {/* API の状態表示 */}
      <div className="mb-4 text-sm">
        {loading && <span className="text-blue-600">分割処理中...</span>}
        {apiError && <span className="text-red-600">APIエラー: {apiError}</span>}
        {boundaries && (
          <div className="text-gray-600">
            boundaries: [{boundaries.join(", ")}]
          </div>
        )}
      </div>

      {/* マスク状態表示 */}
      {textChunks.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            {maskState.unlockedPages.includes(Math.floor(currentPage / 2)) ? (
              "✅ この章はアンロックされています"
            ) : (
              "🔒 この章はロックされています。2ページ読むとアンロックされます。"
            )}
          </div>
          {maskState.unlockedPages.length < textChunks.length && (
            <div className="text-xs text-yellow-600 mt-1">
              次の章は1時間後にアンロックされます
            </div>
          )}
        </div>
      )}

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
          {subPage === 0 ? "1ページ目(右)" : "2ページ目(左)"}
        </div>
        
        {/* 読了ボタン */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              // 2ページ読み終わったら次のチャンクへ
              const nextPage = currentPage + 2;
              setCurrentPage(nextPage);
              setSubPage(0);
              
              // 2ページ読んだらマスクを適用
              const currentChunkIndex = Math.floor(nextPage / 2);
              if (!maskState.unlockedPages.includes(currentChunkIndex)) {
                setMaskState(prev => ({
                  ...prev,
                  unlockedPages: [...prev.unlockedPages, currentChunkIndex],
                  lastUnlockTime: Date.now()
                }));
              }
            }}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={textChunks.length === 0}
          >
            2ページ読了
          </button>
        </div>
      </section>
    </div>
  );
}
