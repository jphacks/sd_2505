"use client";
import { useMemo, useState, useEffect } from "react";
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

// ローカルストレージの型定義
interface ReaderSettings {
  sessionMinutes: number;
  lockMinutes: number;
  cpm: number;
  theme: string;
}

interface BookProgress {
  currentIndex: number;
  finished: number[];
  nextUnlockAt: string;
  buckets: Array<{
    index: number;
    text: string;
    summary?: string;
  }>;
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const book = useMemo(() => mockBooks.find((b) => b.id === String(id)) || null, [id]);
  
  // 状態管理
  const [buckets, setBuckets] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextUnlockAt, setNextUnlockAt] = useState<string | null>(null);
  const [finished, setFinished] = useState<number[]>([]);

  // 1パケット＝2ページのプレビュー（右→左想定）
  const [subPage, setSubPage] = useState<0 | 1>(0); // 0=右ページ、1=左ページ
  const [pageR, pageL] = useMemo(
    () => splitIntoTwoPages(buckets[currentIndex] || ""),
    [buckets, currentIndex]
  );

  // 左矢印で進む（右→左）
  const goNextPage = () => setSubPage((p) => (p === 0 ? 1 : 1));
  // 右矢印で戻る（左→右）
  const goPrevPage = () => setSubPage((p) => (p === 1 ? 0 : 0));

  // AI分割APIを呼び出す
  const splitTextWithAI = async (text: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/split', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const boundaries = data.boundaries;
      
      // 境界線からテキストを分割
      const textBuckets: string[] = [];
      let start = 0;
      for (const boundary of boundaries) {
        textBuckets.push(text.slice(start, boundary));
        start = boundary;
      }
      
      setBuckets(textBuckets);
      
      // ローカルストレージに保存
      const progress: BookProgress = {
        currentIndex: 0,
        finished: [],
        nextUnlockAt: new Date().toISOString(),
        buckets: textBuckets.map((text, index) => ({ index, text }))
      };
      
      localStorage.setItem(`reader.progress.book${id}`, JSON.stringify(progress));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // 読了ボタンの処理
  const handleFinishReading = () => {
    const now = new Date();
    const unlockTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4時間後
    
    setFinished(prev => [...prev, currentIndex]);
    setNextUnlockAt(unlockTime.toISOString());
    setCurrentIndex(prev => prev + 1);
    
    // ローカルストレージを更新
    const progress: BookProgress = {
      currentIndex: currentIndex + 1,
      finished: [...finished, currentIndex],
      nextUnlockAt: unlockTime.toISOString(),
      buckets: buckets.map((text, index) => ({ index, text }))
    };
    
    localStorage.setItem(`reader.progress.book${id}`, JSON.stringify(progress));
  };

  // コンポーネントマウント時にローカルストレージから復元
  useEffect(() => {
    const savedProgress = localStorage.getItem(`reader.progress.book${id}`);
    if (savedProgress) {
      const progress: BookProgress = JSON.parse(savedProgress);
      setBuckets(progress.buckets.map(b => b.text));
      setCurrentIndex(progress.currentIndex);
      setFinished(progress.finished);
      setNextUnlockAt(progress.nextUnlockAt);
    } else if (book?.description) {
      // 初回の場合、AI分割を実行
      splitTextWithAI(book.description);
    }
  }, [id, book]);

  // ロック状態をチェック
  const isLocked = nextUnlockAt ? new Date() < new Date(nextUnlockAt) : false;
  
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
        <h1 className="text-xl font-bold">{book.title}</h1>
        <span className="text-sm text-gray-500">第{currentIndex + 1}章</span>
      </div>

      {/* ローディング状態 */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="text-lg">AIでテキストを分割中...</div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          エラー: {error}
        </div>
      )}

      {/* ロック状態表示 */}
      {isLocked && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          次の章は {nextUnlockAt && new Date(nextUnlockAt).toLocaleString()} にアンロックされます
        </div>
      )}

      {/* プレビュー：1パケット＝2ページ（右→左） */}
      {!isLoading && buckets.length > 0 && (
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

          {/* 読了ボタン */}
          <div className="mt-6 text-center">
            <button
              onClick={handleFinishReading}
              disabled={isLocked}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLocked ? "ロック中" : "読了"}
            </button>
          </div>
        </section>
      )}

      {/* 進捗表示 */}
      {buckets.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          進捗: {finished.length + 1} / {buckets.length} 章
        </div>
      )}
    </div>
  );
}
