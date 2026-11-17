// 商品データの型。中身は src/catalog/ にある（README.md の「商品を差し替える」）

export type ProductType = '冷凍' | 'チルド'
export type Genre = 'ごはん' | 'おかず' | '麺' | '軽食' | 'デザート' | 'やさい' | 'くだもの'
export type ShelfId = 'veg' | 'side' | 'meal' | 'snack' | 'ice' | 'deli' | 'fruit'

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
  /** 大袋（もりもりパックなど）のとき、ふつうの袋の商品の id。図鑑に「大袋」「大袋あり」と出る */
  bigOf?: string
  /** 買い物リスト暗記で並ぶ棚。書かなければジャンルから決まる */
  shelf?: ShelfId
}

/** 買い物リスト暗記の棚。icon＝売り場の冷凍庫に描く代表の商品（PIcon の id）、kind＝冷凍庫か冷蔵ケースか、generic＝販促商品ではない一般の商品 */
export type Shelf = { id: ShelfId; name: string; color: string; icon: string; kind: 'freezer' | 'fridge'; generic: string[] }

/** 損得勘定の商品。unit は「100gあたり」の g や ml、per100 は100gあたりのだいたいの値段（円）、sizes は売っている大きさ */
export type ValueKind = { name: string; icon: string; unit: 'g' | 'ml'; per100: number; sizes: number[] }

/** 商品まわりの設定ひとまとめ。src/catalog/sample.ts（仮の商品）か、src/catalog/private.ts（本物の商品・公開しない）のどちらかが使われる */
export type Catalog = {
  products: Product[]
  /** 図鑑の絞りこみに出すジャンル（並び順） */
  genres: Genre[]
  /** ホームのおすすめ商品バナー */
  banner: { productId: string; label: string }
  /** 図鑑の「今月の特集」。月（1〜12）ごとに3品 */
  featuredByMonth: Record<number, string[]>
  /** お弁当の具材記憶に出す商品 */
  bento: string[]
  /** 見た目の似た商品の組み合わせ（仲間はずれ探し） */
  lookalike: [string, string][]
  shelves: Shelf[]
  valueKinds: ValueKind[]
  /** パッケージ画像（id → URL）。商品詳細に出る。src/assets/products/ の画像より優先 */
  images: Record<string, string>
  /** 小さく出すときの絵（id → URL）。脳トレ・図鑑の一覧・バナー・クーポンに出る。中身の写真を正方形に切り抜いたものなど。src/assets/icons/ の画像より優先 */
  icons: Record<string, string>
}
