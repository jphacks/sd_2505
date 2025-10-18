import { Book } from "@/types/book";
export const mockBooks: Book[] = [
  {
    id: "1",
    title: "走れメロス",
    author: "太宰治",
    description: `友人を信じて走り続けるメロスの姿を描く、人間の誠実さと信頼の物語。メロスは激怒した。必ず、かの邪智暴虐の王を除かなければならぬと決意した。メロスには政治がわからぬ。メロスは、村の牧人である。笛を吹き、羊と遊んで暮して来た…（以下略）
    これがプレビューの右ページ分となる想定で、文章が続いていきます。
    改行をいくつか入れて、見た目のボリュームを調整します。

    ここから左ページ相当の内容。実装上は半分付近で切って表示します。
    読書方向は右→左なので、左矢印で進む・右矢印で戻る UI を実装します。`,
    textFileUrl: "",
    imageUrl: "/mock/img/hashire_merosu.jpg",
    progress: "10%"
  },
  {
    id: "2",
    title: "坊っちゃん",
    author: "夏目漱石",
    description: "正義感の強い青年教師が田舎の学校で奮闘する痛快な学園小説。",
    textFileUrl: "",
    imageUrl: "/mock/img/botchan.jpg",
  },
  {
    id: "3",
    title: "こころ",
    author: "夏目漱石",
    description: "「先生」と「私」の交流を通して、人間の孤独と罪を描いた名作。",
    textFileUrl: "",
    imageUrl: "/mock/img/kokoro.jpg",
  },
  {
    id: "4",
    title: "銀河鉄道の夜",
    author: "宮沢賢治",
    description: "ジョバンニとカンパネルラが銀河を旅しながら、命と幸福の意味を見つめる幻想的な物語。",
    textFileUrl: "",
    imageUrl: "/mock/img/ginga.jpg",
  },
  {
    id: "5",
    title: "吾輩は猫である",
    author: "夏目漱石",
    description: "「吾輩は猫である」で始まる、人間社会を風刺したユーモア文学の傑作。",
    textFileUrl: "",
    imageUrl: "/mock/img/neko.jpg",
  },
  {
    id: "6",
    title: "羅生門",
    author: "芥川龍之介",
    description: "荒廃した京都を舞台に、人間のエゴと生への執念を描く短編。",
    textFileUrl: "",
    imageUrl: "/mock/img/rashomon.jpg",
  },
  {
    id: "7",
    title: "雪国",
    author: "川端康成",
    description: "雪深い温泉街での男女の儚い恋を、美しい描写で描いた日本文学の名作。",
    textFileUrl: "",
    imageUrl: "/mock/img/yukiguni.jpg",
  },
  {
    id: "8",
    title: "人間失格",
    author: "太宰治",
    description: "自分を「人間失格」と語る主人公の告白を通して、人間の弱さを突きつける問題作。",
    textFileUrl: "",
    imageUrl: "/mock/img/shikkaku.jpg",
  },
  {
    id: "9",
    title: "雨ニモマケズ",
    author: "宮沢賢治",
    description: "宮沢賢治が理想とした“強く優しい人間像”を詩的に表現した代表作。",
    textFileUrl: "",
    imageUrl: "/mock/img/amenimo.jpg",
  },
  {
    id: "10",
    title: "斜陽",
    author: "太宰治",
    description: "没落貴族の娘を通して、戦後日本の価値観の変化を描いた社会小説。",
    textFileUrl: "",
    imageUrl: "/mock/img/shayou.jpg",
  },
];