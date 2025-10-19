# ai_splitter.py
import os, json
from pathlib import Path
from dotenv import load_dotenv

# このファイルと同じディレクトリの .env を必ず読む
ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(dotenv_path=ENV_PATH, override=True)

# どちらの環境変数名でも拾う
API_KEY = (os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or "").strip()
if not API_KEY:
    raise RuntimeError(f"APIキー未設定: {ENV_PATH} に GOOGLE_API_KEY か GEMINI_API_KEY を定義して")

# ---- 新SDK（google-genai）を使う場合 ----
from google import genai
client = genai.Client(api_key=API_KEY)
MODEL = "gemini-2.5-flash"  # 好みで変更可

def get_packets_from_ai(full_text: str) -> list[str]:
    """
    AIを使って長文を100文字ごとに分割する。
    JSONリストとして返す。
    """
    prompt = f"""
    あなたはプロの編集者です。以下の日本語小説の本文を、文章の流れが正しいように1000文字程度の長さに分割してください。

    # 厳守ルール
    - 分割結果はJSON配列として返してください。
    - 例: ["最初のパケット...", "次のパケット...", "最後のパケット..."]
    - 説明文や余計な文字は出力しない。

    # 本文:
    {full_text}
    """.strip()

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )
        text = (response.text or "").strip()
        text = text.replace("```json", "").replace("```", "").strip()
        packets = json.loads(text)
        if isinstance(packets, list):
            return packets
        print("AI出力がJSON配列ではありません。")
        return []
    except Exception as e:
        print(f"AI分割エラー: {e}")
        return []


# --- 動作テスト ---
if __name__ == "__main__":
    sample_text = "これはテスト用の文章です。" * 10
    packets = get_packets_from_ai(sample_text)
    print("--- 分割結果 ---")
    print(packets)
