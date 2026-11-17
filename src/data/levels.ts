// 脳トレの難しさ（レベル）。数字を変えれば、ゲームごとの難しさを調整できる
//
// 1回の脳トレの中で、レベルが上下する
//   ・1問目はいつもレベル0（いちばんやさしい）から始まる
//   ・正解すると、次の問題はレベルが1つ上がる
//   ・まちがえると同じレベルのまま。続けて MISSES_TO_DOWN 回まちがえると、1つ下がる
// 表の上の行がレベル0。行を足せば、上のレベルを増やせる

/** 続けて何回まちがえると、レベルが1つ下がるか */
export const MISSES_TO_DOWN = 2

/** 速さの点の基準（秒）。fast 以内なら速さ満点、slow を超えると速さ0点。覚えている時間は数えない */
export const PACE = {
  freezer: { fast: 3, slow: 10 },
  register: { fast: 6, slow: 20 },
  range: { fast: 6, slow: 20 },
  oddone: { fast: 2.5, slow: 10 },
  diff: { fast: 12, slow: 50 },
  pairs: { fast: 20, slow: 70 },
  memo: { fast: 5, slow: 18 },
  anagram: { fast: 4, slow: 16 },
}

/** 冷凍庫の中身記憶。items＝冷凍庫の商品数、lookSec＝見られる秒数、choices＝選択肢の数、askOutside＝「入っていなかったのは？」も出すか */
export const FREEZER = [
  { items: 3, lookSec: 5, choices: 3, askOutside: false },
  { items: 3, lookSec: 4, choices: 4, askOutside: false },
  { items: 4, lookSec: 4, choices: 4, askOutside: true },
  { items: 4, lookSec: 3.5, choices: 4, askOutside: true },
  { items: 5, lookSec: 3.5, choices: 4, askOutside: true },
]

/** お会計チャレンジ。items＝レシートの商品数、gaps＝まちがいの選択肢と正解の差（円） */
export const REGISTER = [
  { items: 2, gaps: [100, 200] },
  { items: 2, gaps: [50, 100] },
  { items: 3, gaps: [50, 100] },
  { items: 3, gaps: [20, 50] },
  { items: 4, gaps: [10, 20, 50] },
]

/** レンジ時間の計算。items＝温める商品数、gaps＝まちがいの選択肢と正解の差（秒） */
export const RANGE = [
  { items: 2, gaps: [60, 120] },
  { items: 2, gaps: [30, 60] },
  { items: 2, gaps: [20, 30] },
  { items: 3, gaps: [30, 60] },
  { items: 3, gaps: [10, 20, 30] },
]

/**
 * 仲間はずれ探し。cells＝並ぶ数、cols＝横の数
 * subtle＝false なら違う商品、true なら同じ商品で色だけ違う（config.ts の ODDONE_LATE が 'flip' ならさかさま）
 * hue＝色の違いの大きさ（度）。大きいほど見つけやすい
 */
export const ODDONE = [
  { cells: 9, cols: 3, subtle: false, hue: 0 },
  { cells: 12, cols: 4, subtle: false, hue: 0 },
  { cells: 16, cols: 4, subtle: false, hue: 0 },
  { cells: 9, cols: 3, subtle: true, hue: 100 },
  { cells: 16, cols: 4, subtle: true, hue: 60 },
]

/** 間違い探し。cells＝絵の中の数、cols＝横の数、diffs＝違いの数、flip＝違いの1つを「さかさま」にするか */
export const DIFF = [
  { cells: 9, cols: 3, diffs: 2, flip: false },
  { cells: 9, cols: 3, diffs: 3, flip: false },
  { cells: 12, cols: 4, diffs: 3, flip: false },
  { cells: 16, cols: 4, diffs: 3, flip: false },
  { cells: 16, cols: 4, diffs: 3, flip: true },
]
/** 間違い探しの、おてつきできる回数 */
export const DIFF_MISSES = 4

/** 商品神経衰弱。pairs＝ペアの数、cols＝横の数 */
export const PAIRS = [
  { pairs: 3, cols: 3 },
  { pairs: 4, cols: 4 },
  { pairs: 5, cols: 5 },
  { pairs: 6, cols: 4 },
]
/** 神経衰弱で、そろわなかったカードを裏に戻すまでの時間（ミリ秒） */
export const PAIRS_FLIP_BACK_MS = 1100

/** 買い物リスト暗記。items＝メモの品数、shelf＝売り場に並ぶ数 */
export const MEMO = [
  { items: 2, shelf: 6 },
  { items: 3, shelf: 6 },
  { items: 3, shelf: 9 },
  { items: 4, shelf: 9 },
  { items: 5, shelf: 9 },
]
/** メモを見られる時間＝ MEMO_LOOK_BASE_MS ＋ 品数 × MEMO_LOOK_PER_ITEM_MS */
export const MEMO_LOOK_BASE_MS = 3500
export const MEMO_LOOK_PER_ITEM_MS = 900
