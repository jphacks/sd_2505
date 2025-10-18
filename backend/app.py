from flask import Flask, jsonify, request
from flask_cors import CORS
from ai_splitter import get_packets_from_ai # 変更なし
import os

app = Flask(__name__)
CORS(app) 

@app.route("/")
def hello():
    return "隙間時間読書アプリ バックエンド"

# APIを「POST」メソッドで「/api/split」に変更
@app.route("/api/split", methods=['POST'])
def split_book_text():
    """
    フロントエンドから本の全文テキストを受け取り、
    AIで分割した結果の「境界線の文字数リスト」を返すAPI
    """
    
    # 1. フロントエンドから送信されたJSONから 'text' を取り出す
    data = request.json
    full_text = data.get('text')

    if not full_text:
        return jsonify({"error": "本文テキスト ('text') がありません"}), 400

    # 2. AIを使って、テキストを文字列のリストに分割する (ai_splitter.py を呼ぶ)
    packet_strings = get_packets_from_ai(full_text)
    
    if not packet_strings:
        return jsonify({"error": "AIによるテキストの分割に失敗しました"}), 500

    # 3. AIが返した「文字列リスト」を、要求仕様の
    #    「境界線リスト [100, 200, 300]」に変換する
    boundaries = []
    current_char_index = 0
    
    for text_chunk in packet_strings:
        current_char_index += len(text_chunk)
        boundaries.append(current_char_index)

    # 4. 境界線リストをフロントエンドに返す
    return jsonify({"boundaries": boundaries})

# サーバーを起動
if __name__ == '__main__':
    # ハッカソン中は、チームメンバーがアクセスできるように host='0.0.0.0' を指定
    app.run(debug=True, host='0.0.0.0', port=3000)
