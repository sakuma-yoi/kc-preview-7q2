// 仮の商品（公開版で使う）。本物の商品は src/catalog/private.ts に書く（公開しないファイル）
// 画像はファイルを置くだけで反映される（ファイル名を商品の id にする）
//   パッケージ画像      src/assets/products/<id>.png （webp・jpg も可）… 図鑑・商品詳細・バナー・クーポンに出る
//   脳トレ用の小さい絵  src/assets/icons/<id>.svg    （png・webp も可）… 脳トレの中に出る。なければ PIcon.tsx の絵

import type { Catalog, Product, Shelf, ValueKind } from '../data/types'

const products: Product[] = [
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

// 買い物リスト暗記の棚
const shelves: Shelf[] = [
  { id: 'veg', name: '冷凍野菜', color: '#3d8c3d', icon: 'broccoli', kind: 'freezer', generic: ['ほうれん草', 'かぼちゃ', 'ミックスベジタブル', '枝豆', 'コーン', 'いんげん', '里いも'] },
  { id: 'side', name: '冷凍おかず', color: '#c46a1b', icon: 'karaage', kind: 'freezer', generic: ['コロッケ', '春巻き', '焼売', '白身フライ', '肉だんご', 'ささみフライ', 'いかフライ'] },
  { id: 'meal', name: '冷凍ごはん・麺', color: '#b8860b', icon: 'ramen', kind: 'freezer', generic: ['焼きうどん', 'ピラフ', 'オムライス', 'ざるそば', 'ナポリタン', '五目ごはん', 'ドリア'] },
  { id: 'snack', name: '冷凍スナック', color: '#c9372c', icon: 'pizza', kind: 'freezer', generic: ['お好み焼き', '今川焼き', 'アメリカンドッグ', '大学いも', 'ナゲット', 'フレンチトースト', 'ホットケーキ'] },
  { id: 'ice', name: 'アイス', color: '#1f86b8', icon: 'ice', kind: 'freezer', generic: ['チョコアイス', 'いちごアイス', '抹茶アイス', 'かき氷', 'ソーダバー', 'モナカアイス', 'チョコミント'] },
  { id: 'deli', name: 'チルドのお惣菜', color: '#2f8a50', icon: 'oden', kind: 'fridge', generic: ['肉じゃが', '筑前煮', '卵焼き', 'マカロニサラダ', '煮魚', 'ひじき煮', 'きんぴら'] },
]

// 損得勘定に出る商品。icon は PIcon の絵の id（販促商品の id か、g- で始まる一般の商品の絵）
const valueKinds: ValueKind[] = [
  { name: 'お米', icon: 'g-rice', unit: 'g', per100: 45, sizes: [2000, 5000, 10000] },
  { name: 'しょうゆ', icon: 'g-soy', unit: 'ml', per100: 40, sizes: [500, 1000, 1800] },
  { name: 'マヨネーズ', icon: 'g-mayo', unit: 'g', per100: 70, sizes: [300, 450, 700] },
  { name: 'みそ', icon: 'g-miso', unit: 'g', per100: 60, sizes: [375, 750, 1000] },
  { name: 'からあげ', icon: 'karaage', unit: 'g', per100: 120, sizes: [300, 500, 1000] },
  { name: 'フライドポテト', icon: 'potato', unit: 'g', per100: 55, sizes: [400, 1000, 1500] },
  { name: 'ブロッコリー', icon: 'broccoli', unit: 'g', per100: 80, sizes: [250, 500, 800] },
]

const featuredByMonth: Record<number, string[]> = {
  1: ['oden', 'ramen', 'gyoza'],
  2: ['oden', 'curry', 'hamburg'],
  3: ['karaage', 'ebifry', 'broccoli'],
  4: ['karaage', 'onigiri', 'potesala'],
  5: ['pizza', 'potato', 'takoyaki'],
  6: ['pasta', 'chahan', 'broccoli'],
  7: ['ice', 'takoyaki', 'potato'],
  8: ['ice', 'pizza', 'chahan'],
  9: ['curry', 'hamburg', 'pasta'],
  10: ['hamburg', 'onigiri', 'karaage'],
  11: ['gyoza', 'oden', 'ramen'],
  12: ['oden', 'pizza', 'ice'],
}

const lookalike: [string, string][] = [
  ['karaage', 'takoyaki'],
  ['pizza', 'onigiri'],
  ['pasta', 'chahan'],
  ['curry', 'hamburg'],
  ['ice', 'potesala'],
  ['ebifry', 'potato'],
  ['gyoza', 'onigiri'],
  ['chahan', 'potesala'],
]

const catalog: Catalog = {
  products,
  genres: ['ごはん', 'おかず', '麺', '軽食', 'デザート'],
  banner: { productId: 'gyoza', label: 'NEW' },
  featuredByMonth,
  // お弁当に入りそうな商品だけ
  bento: ['karaage', 'ebifry', 'gyoza', 'onigiri', 'broccoli', 'hamburg', 'potesala', 'takoyaki', 'potato'],
  lookalike,
  shelves,
  valueKinds,
  images: {},
  icons: {},
}
export default catalog
