📘 アプリ設計図（モックDB＋青空文庫API＋AI分割）
🎯 コンセプト
•
•
•
読書家のための「強制的に少しずつ読む」アプリ
ストーリー性のある本を対象に、読書習慣を生活リズムに組み込む
自分のペース（1セッション＝◯分）で読み進められ、次を読むまでロックがかかる
🧍♂️ ペルソナ
属性 説明
年齢層 20代後半〜40代社会人
読書目的 ストーリーを楽しみたいが、忙しくて集中が続かない
行動特性 通勤・寝る前など、隙間時間に短時間読書をしたい
課題 読書が続かない／忘れてしまう／内容を思い出せない
要望 自分に合ったペースで読みたい・過去の要約を見たい
⚙️ 機能一覧
機能 概要
🔹 本一覧表示 青空文庫APIから取得／おすすめリストから選択
🔹 本を読む AIで意味ごとに分割されたテキストを5分単位で表示
🔹 ロック制御 次のチャプターは一定時間経過後にのみ開ける
🔹 要約機能（拡張） 読了済み部分のみ要約を生成・閲覧可能
🔹 時間設定 1セッションの読書時間をユーザーが自由設定
🔹 UIテーマ シンプルで集中できるUI（白地・モノトーン）
🖥️ 画面設計
1. /book_list
•
•
•
表示：本一覧（タイトル・著者・進捗バー）
操作：
「読む」→ /read/[bookId]
1
•
「新しく始める」→ /book_list?book-id=xxx （AI分割リクエスト）
2. /read/[bookId]
•
•
•
•
•
表示：現在のバケットテキスト
操作：
「読了」ボタン → 次のチャプターをロック＋完了記録
「過去の章を見る」→ 過去分のみ閲覧可
「要約を見る」→（拡張）AI要約を表示
3. /settings
•
•
表示：セッション時間・テーマ設定
保存先：localStorage
🔄 データフロー概要
1.
2.
3.
4.
5.
本選択（/book_list） → Flask API /api/split に bookId, sessionMinutes をPOST
Flaskで青空文庫のテキストを取得 → AIで文脈ごとに分割（target: 5分＝約2000字）
Next.jsで受け取ったバケット配列を localStorage に保存
/read/[bookId] に遷移 → 最初のバケットを表示
「読了」クリックで進捗更新（次のチャプターを時間ロック）
🧩 データ構造（localStorage）
reader.settings = {
"sessionMinutes": 5,
"lockMinutes": 240,
"cpm": 400,
"theme": "light"
}
reader.progress.book1 = {
"currentIndex": 0,
"finished": [0],
"nextUnlockAt": "2025-10-18T12:34:56Z",
"buckets": [
{"index":0,"text":"...","summary":"..."},
{"index":1,"text":"..."}
]
}
2
🧠 AI利用部分
API 内容 使用例
/api/split 本文を文脈で分割 target文字数ごとに意味単位でカット
/api/summarize 要約生成（拡張） 読了済み部分のみ要約
分割プロンプト例：
以下の日本語小説本文を、意味が途切れないように5分で読める長さに分割してください。各ブ
ロックをJSON形式で返してください。
🔐 ロック仕様
状況 動作
初回開始 currentIndex=0 , ロックなし
読了時 nextUnlockAt = now + lockMinutes
次回起動 now < nextUnlockAt → 次のバケットは非表示
戻り操作 index <= currentIndex のみ閲覧可能
🧱 フォルダ構成（Next.js）
frontend/
app/
book_list/page.tsx
read/[bookId]/page.tsx
settings/page.tsx
components/
BookCard.tsx
ReaderView.tsx
Timer.tsx
3
lib/
api.ts
storage.ts
types/
index.ts
⚠️ 注意点
•
•
•
青空文庫はパブリックドメイン作品のみ対象
LLMに渡すテキストサイズ制限あり → バッチ分割送信
ローカル保存のみのため他デバイス同期なし（MVPではOK）