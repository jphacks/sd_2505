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

// マスク管理
interface MaskState {
  unlockedPages: number; // アンロックされたページ数（2ページ単位）
  lockTime: number; // ロックされた時間
  isLocked: boolean; // 現在ロック状態か
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
    unlockedPages: 2, // 初回は2ページアンロック
    lockTime: 0,
    isLocked: false
  });
  
  // 現在のページ
  const [currentPage, setCurrentPage] = useState(0);
  const [subPage, setSubPage] = useState<0 | 1>(0); // 0=右ページ、1=左ページ

  // boundariesに基づく本文分割
  const textChunks = useMemo(() => {
    if (!book?.description || !boundaries) return [];
    return splitTextByBoundaries(book.description, boundaries);
  }, [book?.description, boundaries]);

  const GRID_ROWS = 25;   // 1列あたりの行数（縦に並ぶ文字数）
  const GRID_COLS = 30;   // 列数（改行で次の列へ）
  const GRID_SIZE = GRID_ROWS * GRID_COLS; // 750 文字
  
  // 25文字ごとに改行を入れて縦書きの「列」を作る
  const toVerticalGrid = (s: string, rows = GRID_ROWS, cols = GRID_COLS, pad = true) => {
    let text = s.slice(0, rows * cols); // あふれ防止
    if (pad && text.length < rows * cols) {
      // 全角スペースでパディング（視覚的なズレを避ける用。不要なら外してOK）
      text = text + "　".repeat(rows * cols - text.length);
    }
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += rows) {
      chunks.push(text.slice(i, i + rows));
    }
    // 25文字 → 改行 → 次の25文字…で「30列」になる
    return chunks.join("\n");
  };
  
  const displayText = useMemo(() => {
    if (!textChunks.length) return "";
  
    const currentChunkIndex = Math.floor(currentPage / 2);
    if (currentChunkIndex >= textChunks.length) return "";
  
    const currentChunk = textChunks[currentChunkIndex];
    const isUnlocked = currentPage < maskState.unlockedPages;
  
    if (isUnlocked) {
      // アンロック：本文750文字を上限にレイアウト
      const page = currentChunk.slice(0, GRID_SIZE);
      return toVerticalGrid(page, GRID_ROWS, GRID_COLS, /*pad*/ true);
    } else {
      // ロック：先頭だけ見せて残りは■で埋める（グリッドサイズに合わせる）
      const visibleLength = Math.min(50, currentChunk.length);
      const visibleText = currentChunk.slice(0, visibleLength);
      const maskedLen = Math.max(0, GRID_SIZE - visibleText.length);
      const maskedText = "■".repeat(maskedLen);
      const page = (visibleText + maskedText).slice(0, GRID_SIZE);
      return toVerticalGrid(page, GRID_ROWS, GRID_COLS, /*pad*/ false);
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

  // ページ移動（ロック状態をチェック）
  const goNextPage = () => {
    if (maskState.isLocked) return; // ロック中は移動不可
    
    if (subPage === 0) {
      setSubPage(1);
    } else {
      // 2ページ読み終わったら次のチャンクへ
      const nextPage = currentPage + 2;
      setCurrentPage(nextPage);
      setSubPage(0);
      
      // 2ページ進んだらロック
      if (nextPage >= maskState.unlockedPages) {
        setMaskState(prev => ({
          ...prev,
          isLocked: true,
          lockTime: Date.now()
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

  // 1時間ごとのロック解除タイマー
  useEffect(() => {
    if (!maskState.isLocked) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1時間
      
      if (now - maskState.lockTime >= oneHour) {
        // ロック解除
        setMaskState(prev => ({
          ...prev,
          isLocked: false,
          unlockedPages: prev.unlockedPages + 2, // 次の2ページをアンロック
          lockTime: 0
        }));
      }
    }, 1000); // 1秒ごとにチェック

    return () => clearInterval(interval);
  }, [maskState.isLocked, maskState.lockTime]);

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
        <button className="text-sm underline hover:bg-gray-100" onClick={() => router.back()}>
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
      </div>

      {/* ロック状態表示 */}
      {textChunks.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          {maskState.isLocked ? (
            <div className="text-sm text-yellow-800">
              🔒 ページがロックされています
              <div className="text-xs text-yellow-600 mt-1">
                解除時間: {new Date(maskState.lockTime + 60 * 60 * 1000).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-sm text-green-800">
              ✅ ページはアンロックされています
            </div>
          )}
        </div>
      )}

<section>
<div className="relative border rounded-2xl bg-white shadow-sm overflow-x-auto min-h-[700px] flex justify-end items-center px-16">
    
    {/* 本文エリア（常に中央） */}
    <div
      className="whitespace-pre-wrap text-lg inline-block p-4"
      style={{
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        lineHeight: "1.9",
        width: `${GRID_COLS}em`,
      }}
    >
      {subPage === 0 ? pageR : pageL}
    </div>

    {/* 左矢印（進む：右→左） */}
    <button
      onClick={goNextPage}
      disabled={maskState.isLocked}
      className={`absolute left-5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full border shadow-sm ${
        maskState.isLocked 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-white/80 hover:bg-red-100'
      }`}
      aria-label="次のページへ（右→左）"
      title={maskState.isLocked ? "ロック中" : "次のページへ"}
    >
      ←
    </button>

    {/* 右矢印（戻る：左→右） */}
    <button
      onClick={goPrevPage}
      disabled={maskState.isLocked}
      className={`absolute right-5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full border shadow-sm ${
        maskState.isLocked 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-white/80 hover:bg-red-100'
      }`}
      aria-label="前のページへ（左→右）"
      title={maskState.isLocked ? "ロック中" : "前のページへ"}
    >
      →
    </button>
  </div>

  <div className="mt-2 text-center text-xs text-gray-600">
    {subPage === 0 ? "1ページ目(右)" : "2ページ目(左)"}
  </div>
</section>

    </div>
  );
}
