// 脳トレの設定と、各ゲームに登場する商品の初期設定

import catalog from '#catalog'
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
  { id: 'freezer', name: 'お弁当の具材記憶', category: '記憶', summary: '数秒見たお弁当の中身を答える', rule: 'お弁当の中身を数秒だけ見せます。ふたが閉まったら、入っていたおかずを答えてください。正解が続くと、おかずが増えたり「入っていなかったおかず」を聞かれたりします。', questions: 5, minutes: 1, icon: '🍱', free: true, minProducts: 8 },
  { id: 'register', name: 'お会計チャレンジ', category: '計算', summary: 'レジの合計金額を暗算', rule: 'レジに通る商品の値段をたして、合計を答えます。はじめは「何百円台か」だけでOK。正解が続くと、合計金額そのものを答える問題になります。', questions: 5, minutes: 2, icon: '🧾', free: true, minProducts: 4 },
  { id: 'diff', name: '間違い探し', category: '観察', summary: '2枚の絵の違いを3つ探す', rule: '上の「おてほん」と下の絵をくらべて、違うところを下の絵から全部見つけてください。おてつきは4回までです。全部見つけると、次の絵は少し大きくなります。', questions: 3, minutes: 2, icon: '🔍', minProducts: 6 },
  { id: 'pairs', name: '商品神経衰弱', category: '記憶', summary: '商品のペアをそろえる', rule: '最初の数秒、ペアの片方だけが表になります。覚えたら、カードを2枚ずつめくって同じ商品のペアをそろえてください。少ない回数でそろえるほど高得点で、次はカードが増えます。', questions: 3, minutes: 2, icon: '🃏', minProducts: 6 },
  { id: 'memo', name: '買い物リスト暗記', category: '記憶', summary: 'メモを覚えて、売り場から探す', rule: '買い物メモを数秒で覚えます。メモが消えたら、冷凍・チルドの売り場をまわって、メモの商品を全部かごに入れてください。正解が続くと、メモの品数が増えます。', questions: 4, minutes: 2, icon: '📝', minProducts: 9 },
  { id: 'range', name: 'レンジ時間の計算', category: '計算', summary: 'W数がちがうときの温め時間を答える', rule: 'パッケージには「500Wで3分」のように書いてあります。家のレンジのW数だと何分何秒になるか、＋−ボタンで時間を合わせてください（秒は10秒ずつ）。', questions: 5, minutes: 1, icon: '⏲️', minProducts: 4 },
  { id: 'oddone', name: '仲間はずれ探し', category: '観察', summary: '1つだけ違う商品を探す', rule: '並んだ商品の中から、1つだけ違うものを見つけてください。2回まで押せます。正解が続くと数が増え、似た商品や、少しだけ違うものを探す問題になります。', questions: 8, minutes: 1, icon: '👀', minProducts: 4 },
  { id: 'change', name: 'お釣りマスター', category: '計算', summary: 'お釣りの枚数が少なくなるように払う', rule: 'レジの金額を見て、お金をタップして払います。出す枚数とお釣りの枚数が、合わせていちばん少なければ満点です。どのお金も何枚でも出せます。', questions: 5, minutes: 2, icon: '💴', minProducts: 4 },
  { id: 'discount', name: '割引計算', category: '計算', summary: '割引シールのあとのお値段を答える', rule: '値札と割引シール（半額・〇円引・〇%OFF・〇割引）を見て、割引のあとのお値段を4つの中から選んでください。正解が続くと、シールが2枚になることもあります。', questions: 5, minutes: 1, icon: '🏷️', minProducts: 4 },
  { id: 'value', name: '損得勘定', category: '計算', summary: '大きさと値段から、お得なほうを選ぶ', rule: '大きさと値段のちがう商品をくらべて、いちばんお得なものを、時間内にぱっと選んでください。答えたあとに100gあたりの値段が出ます。', questions: 5, minutes: 1, icon: '⚖️', minProducts: 1 },
  { id: 'sweeper', name: '霜とりスイーパー', category: '観察', summary: '数字をヒントに、霜の下の商品をよける', rule: '冷凍庫の霜の下に商品がかくれています。霜をタップして削ると、まわり8マスにかくれている商品の数が出ます。数字をヒントに、商品を割らないように霜だけを全部削ってください。商品がありそうなマスには印をつけられます。はじめからいくつかのマスは削ってあり、数字だけで最後まで解けるようになっています。', questions: 3, minutes: 3, icon: '⛏️', minProducts: 3 },
  { id: 'cups', name: '計量カップ', category: '計算', summary: '2つのカップで、鍋の水を決まった量にする', rule: '大きさのちがう2つのカップで水を量って、鍋の水をちょうど指定の量にしてください。カップをタップして選んでから、蛇口（水をいっぱいに入れる）・鍋（注ぐ）・もう1つのカップ（移す）・流し（捨てる）をタップします。1回動かすたびに、カップを選び直します。少ない手順で、目安の時間内に作れるほど高得点です。', questions: 5, minutes: 2, icon: '🥛', minProducts: 0 },
  { id: 'anagram', name: '商品名シャッフル', category: '言葉', summary: 'バラバラの文字を商品名に並べ替える', rule: 'バラバラになった文字を順番にタップして、商品の名前を作ってください。1問につき2回まで挑戦できます。', questions: 5, minutes: 2, icon: '🔤', minProducts: 5 },
]

export const gameById = (id: string) => GAMES.find((g) => g.id === id)!

/** あたらしい脳トレが届く順番（分類がかたよらないように並べる） */
export const NEW_GAME_ORDER = ['diff', 'anagram', 'discount', 'pairs', 'range', 'value', 'oddone', 'sweeper', 'change', 'memo', 'cups']

const all = PRODUCTS.map((p) => p.id)

/** ゲームごとの登場商品（初期設定）。運営メニューから変更できる */
export const DEFAULT_GAME_PRODUCTS: Record<string, string[]> = {
  // お弁当に入りそうな商品だけ（src/catalog/ に書く）
  freezer: catalog.bento,
  register: all,
  diff: all,
  pairs: all,
  memo: all,
  // レンジで温める商品だけ
  range: PRODUCTS.filter((p) => p.rangeSec).map((p) => p.id),
  oddone: all,
  change: all,
  discount: all,
  value: all,
  // 名前が6文字以下の商品だけ
  anagram: PRODUCTS.filter((p) => [...shortName(p)].length <= 6).map((p) => p.id),
  sweeper: all,
  // 商品を使わない
  cups: [],
}

/** そのゲームに登場させてよい商品か */
export const allowedInGame = (gameId: string, productId: string) =>
  gameId === 'range' || gameId === 'anagram' || gameId === 'freezer' ? DEFAULT_GAME_PRODUCTS[gameId].includes(productId) : true
