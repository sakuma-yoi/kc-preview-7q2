// 商品の追加・変更はこのファイルで行う（手順は README.md の「商品を差し替える」）
//
// 画像はファイルを置くだけで反映される（ファイル名を商品の id にする）
//   パッケージ画像      src/assets/products/<id>.png （webp・jpg も可）… 図鑑・商品詳細・バナー・クーポンに出る
//   脳トレ用の小さい絵  src/assets/icons/<id>.svg    （png・webp も可）… 脳トレの中に出る。なければ PIcon.tsx の絵

export type ProductType = '冷凍' | 'チルド'
export type Genre = 'ごはん' | 'おかず' | '麺' | '軽食' | 'デザート'

export type Product = {
  id: string
  /** 正式な商品名（図鑑・商品詳細・レシートに出る） */
  name: string
  /** 脳トレの中で使う短い呼び名。正式名が長いときに書く（並べ替えは6文字以下が目安） */
  shortName?: string
  /** 絵がないときに出す絵文字 */
  icon: string
  type: ProductType
  genre: Genre
  isNew?: boolean
  copy: string
  desc: string
  amount: string
  cook: string
  /** 価格の目安（円・税込） */
  price: number
  /** 電子レンジの温め時間（秒）。レンジ調理しない商品は書かない */
  rangeSec?: number
  /** 購入ページのURL。書くと商品詳細の「買えるお店を見る」がリンクになる */
  buyUrl?: string
  /** 買い物リスト暗記で並ぶ棚（shelves.ts）。書かなければジャンルから決まる */
  shelf?: 'veg' | 'side' | 'meal' | 'snack' | 'ice' | 'deli'
}

export const GENRES: Genre[] = ['ごはん', 'おかず', '麺', '軽食', 'デザート']

export const PRODUCTS: Product[] = [
  { id: 'gyoza', name: '羽根つき餃子', icon: '🥟', type: '冷凍', genre: 'おかず', isNew: true, copy: 'パリッと羽根が、フライパンひとつで。', desc: '油も水もいらず、並べて焼くだけで羽根ができる餃子です。', amount: '12個入り', cook: 'フライパンで約5分', price: 280 },
  { id: 'karaage', name: 'からあげ', icon: '🍗', type: '冷凍', genre: 'おかず', copy: 'お弁当にも夕食にも、ジューシーな定番。', desc: 'しょうゆとにんにくで下味をつけた、やわらかい若鶏のからあげです。', amount: '300g', cook: 'レンジで2分30秒', price: 350, rangeSec: 150 },
  { id: 'ebifry', name: 'えびフライ', icon: '🍤', type: '冷凍', genre: 'おかず', copy: 'サクサク衣に、ぷりっとしたえび。', desc: 'レンジで温めるだけで、揚げたてのような食感になります。', amount: '6尾入り', cook: 'レンジで1分40秒', price: 380, rangeSec: 100 },
  { id: 'onigiri', name: '焼きおにぎり', icon: '🍙', type: '冷凍', genre: 'ごはん', copy: '香ばしいしょうゆの香り。', desc: '二度づけ焼きで、中までしっかり味がしみた焼きおにぎりです。', amount: '6個入り', cook: 'レンジで2分', price: 260, rangeSec: 120 },
  { id: 'ramen', name: 'みそラーメン', icon: '🍜', type: '冷凍', genre: '麺', copy: '具もスープも入って、お鍋ひとつ。', desc: 'コクのあるみそスープに、野菜とチャーシューが入っています。', amount: '1食', cook: 'お鍋で約6分', price: 300 },
  { id: 'pizza', name: 'ミックスピザ', icon: '🍕', type: '冷凍', genre: '軽食', copy: 'チーズたっぷり、休日のお昼に。', desc: 'サラミ・ピーマン・コーンをのせた、もっちり生地のピザです。', amount: '1枚', cook: 'トースターで約7分', price: 330 },
  { id: 'pasta', name: 'ミートパスタ', icon: '🍝', type: '冷凍', genre: '麺', copy: 'トレーのまま、レンジで一皿。', desc: 'じっくり煮込んだミートソースと、もちもちの麺です。', amount: '1食', cook: 'レンジで5分', price: 250, rangeSec: 300 },
  { id: 'chahan', name: 'チャーハン', icon: '🍚', type: '冷凍', genre: 'ごはん', copy: 'パラッと仕上がる、焼豚入り。', desc: '強火で炒めた香ばしさをそのまま冷凍しました。', amount: '450g', cook: 'レンジで4分30秒', price: 320, rangeSec: 270 },
  { id: 'curry', name: 'ビーフカレー', icon: '🍛', type: 'チルド', genre: 'ごはん', copy: '牛肉の旨みが溶けこんだ中辛。', desc: '炒めたまねぎの甘みと、スパイスの香りが楽しめるカレーです。', amount: '1食 200g', cook: 'レンジで1分30秒', price: 240, rangeSec: 90 },
  { id: 'potato', name: 'フライドポテト', icon: '🍟', type: '冷凍', genre: '軽食', copy: 'おやつにも、おつまみにも。', desc: '皮つきのまま太めにカットした、ほくほくのポテトです。', amount: '400g', cook: 'トースターで約8分', price: 220 },
  { id: 'takoyaki', name: 'たこ焼き', icon: '🐙', type: '冷凍', genre: '軽食', copy: '外はふんわり、中はとろり。', desc: '大きめのたこが入った、だしの効いたたこ焼きです。', amount: '20個入り', cook: 'レンジで3分', price: 290, rangeSec: 180 },
  { id: 'broccoli', name: 'ブロッコリー', icon: '🥦', type: '冷凍', genre: 'おかず', shelf: 'veg', copy: '使いたい分だけ、彩りをプラス。', desc: '下ゆで済みなので、お弁当やサラダにすぐ使えます。', amount: '250g', cook: 'レンジで1分10秒', price: 200, rangeSec: 70 },
  { id: 'hamburg', name: 'ハンバーグ', icon: '🍖', type: 'チルド', genre: 'おかず', copy: 'ふっくら、デミグラスソース仕立て。', desc: '牛と豚の合いびき肉を、じっくり焼き上げました。', amount: '2個入り', cook: 'レンジで2分20秒', price: 300, rangeSec: 140 },
  { id: 'oden', name: 'おでん', icon: '🍢', type: 'チルド', genre: 'おかず', copy: 'だしがしみた、7種の具材。', desc: '大根・たまご・ちくわなどを、かつおと昆布のだしで煮込みました。', amount: '1袋 2人前', cook: 'お鍋で約5分', price: 360 },
  { id: 'ice', name: 'バニラアイス', icon: '🍨', type: '冷凍', genre: 'デザート', copy: 'ミルクのコクと、やさしい甘さ。', desc: '北海道産の生クリームを使った、なめらかなアイスです。', amount: '6個入り', cook: 'そのまま', price: 270 },
  { id: 'potesala', name: 'ポテトサラダ', icon: '🥔', type: 'チルド', genre: 'おかず', copy: 'もう一品ほしいときに。', desc: 'じゃがいもの食感を残した、マヨネーズ控えめのサラダです。', amount: '180g', cook: 'そのまま', price: 190 },
]

/** 脳トレの中で使う呼び名 */
export const shortName = (p: Product) => p.shortName ?? p.name

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)!

/** 購入でもらえるスタンプ数（仮：通常1個、NEW商品2個） */
export const purchaseStamps = (p: Product) => (p.isNew ? 2 : 1)
