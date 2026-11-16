// 脳トレの設定と、各ゲームに登場する商品の初期設定

import { PRODUCTS, shortName } from './products'

export type Category = '記憶' | '計算' | '観察' | '言葉'
export const CATEGORIES: Category[] = ['記憶', '計算', '観察', '言葉']

export type Game = {
  id: string
  name: string
  category: Category
  summary: string
  rule: string
  questions: number
  minutes: number
  icon: string
  /** 最初から遊べるか */
  free?: boolean
  /** 遊ぶのに必要な商品の数 */
  minProducts: number
}

export const GAMES: Game[] = [
  { id: 'freezer', name: '冷凍庫の中身記憶', category: '記憶', summary: '3秒見た冷凍庫の中身を答える', rule: '冷凍庫の中を3秒だけ見せます。とびらが閉まったら、入っていた商品・入っていなかった商品を答えてください。', questions: 5, minutes: 1, icon: '🧊', free: true, minProducts: 8 },
  { id: 'register', name: 'お会計チャレンジ', category: '計算', summary: 'レシートの合計金額を暗算', rule: 'レシートの商品を全部たして、合計金額を4つの中から選んでください。', questions: 5, minutes: 2, icon: '🧾', free: true, minProducts: 4 },
  { id: 'diff', name: '間違い探し', category: '観察', summary: '2枚の絵の違いを3つ探す', rule: '上の「おてほん」と下の絵をくらべて、違うところを下の絵から3つ見つけてください。おてつきは3回までです。', questions: 3, minutes: 2, icon: '🔍', minProducts: 6 },
  { id: 'pairs', name: '商品神経衰弱', category: '記憶', summary: '商品のペアをそろえる', rule: 'カードを2枚ずつめくって、同じ商品のペアをそろえてください。少ない回数でそろえるほど高得点です。', questions: 2, minutes: 2, icon: '🃏', minProducts: 6 },
  { id: 'memo', name: '買い物リスト暗記', category: '記憶', summary: 'メモを覚えて売り場で選ぶ', rule: '買い物メモを数秒で覚えます。メモが消えたら、売り場からメモにあった商品を全部選んでください。', questions: 4, minutes: 2, icon: '📝', minProducts: 9 },
  { id: 'range', name: 'レンジ時間の計算', category: '計算', summary: '温め時間の合計を答える', rule: '商品を順番に温めます。レンジの時間を全部たすと何分何秒になるか、4つの中から選んでください。', questions: 5, minutes: 1, icon: '⏲️', minProducts: 4 },
  { id: 'oddone', name: '仲間はずれ探し', category: '観察', summary: '1つだけ違う商品を探す', rule: 'たくさん並んだ商品の中から、1つだけ違うものを見つけてください。後半は、少しだけ違うものを探します。2回まで押せます。', questions: 5, minutes: 1, icon: '👀', minProducts: 4 },
  { id: 'anagram', name: '商品名の並べ替え', category: '言葉', summary: 'バラバラの文字を商品名に並べ替える', rule: 'バラバラになった文字を順番にタップして、商品の名前を作ってください。1問につき2回まで挑戦できます。', questions: 5, minutes: 2, icon: '🔤', minProducts: 5 },
]

export const gameById = (id: string) => GAMES.find((g) => g.id === id)!

/** あたらしい脳トレが届く順番（分類がかたよらないように並べる） */
export const NEW_GAME_ORDER = ['diff', 'anagram', 'pairs', 'range', 'oddone', 'memo']

const all = PRODUCTS.map((p) => p.id)

/** ゲームごとの登場商品（初期設定）。運営メニューから変更できる */
export const DEFAULT_GAME_PRODUCTS: Record<string, string[]> = {
  freezer: all,
  register: all,
  diff: all,
  pairs: all,
  memo: all,
  // レンジで温める商品だけ
  range: PRODUCTS.filter((p) => p.rangeSec).map((p) => p.id),
  oddone: all,
  // 名前が6文字以下の商品だけ
  anagram: PRODUCTS.filter((p) => [...shortName(p)].length <= 6).map((p) => p.id),
}

/** そのゲームに登場させてよい商品か */
export const allowedInGame = (gameId: string, productId: string) =>
  gameId === 'range' || gameId === 'anagram' ? DEFAULT_GAME_PRODUCTS[gameId].includes(productId) : true
