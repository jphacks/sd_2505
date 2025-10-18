// types/book.ts
export type Book = {
  id: string;              // 一意のID
  title: string;           // タイトル
  author: string;          // 著者名
  description: string;     // 簡単な説明（抜粋 or あらすじ）
  textFileUrl: string;     // 本文の取得元（今回はモックなので空文字でもOK）
  imageUrl?: string;       // サムネイル（任意）
};