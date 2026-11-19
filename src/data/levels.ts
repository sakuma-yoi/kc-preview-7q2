// 脳トレの難しさ（レベル）。数字を変えれば、ゲームごとの難しさを調整できる
//
// 1回の脳トレの中で、レベルが上下する
//   ・1問目はいつもレベル0（いちばんやさしい）から始まる
//   ・正解すると、次の問題はレベルが1つ上がる
//   ・まちがえると同じレベルのまま。続けて MISSES_TO_DOWN 回まちがえると、1つ下がる
// 表の上の行がレベル0。行を足せば、上のレベルを増やせる

import catalog from '#catalog'

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
  memo: { fast: 10, slow: 35 },
  change: { fast: 10, slow: 40 },
  discount: { fast: 6, slow: 20 },
  value: { fast: 2, slow: 7 },
  anagram: { fast: 4, slow: 16 },
  sweeper: { fast: 25, slow: 100 },
  cups: { fast: 12, slow: 60 },
}

/** お弁当の具材記憶。items＝お弁当のおかずの数、lookSec＝見られる秒数、choices＝選択肢の数、askOutside＝「入っていなかったのは？」も出すか */
export const FREEZER = [
  { items: 3, lookSec: 5, choices: 3, askOutside: false },
  { items: 3, lookSec: 4, choices: 4, askOutside: false },
  { items: 4, lookSec: 4, choices: 4, askOutside: true },
  { items: 4, lookSec: 3.5, choices: 4, askOutside: true },
  { items: 5, lookSec: 3.5, choices: 4, askOutside: true },
]

/**
 * お会計チャレンジ。items＝レジを通る商品数
 * band＝true なら「合計は何百円台？」と、だいたいの金額を答える。false なら合計金額そのものを答える
 * gaps＝まちがいの選択肢と正解の差（円）。band のときは使わない
 */
export const REGISTER = [
  { items: 2, band: true, gaps: [] as number[] },
  { items: 3, band: true, gaps: [] as number[] },
  { items: 2, band: false, gaps: [50, 100] },
  { items: 3, band: false, gaps: [50, 100] },
  { items: 3, band: false, gaps: [20, 50, 100] },
]
/** レジで商品を1つ読み取る間隔（ミリ秒） */
export const REGISTER_SCAN_MS = 700

/**
 * レンジ時間の計算。パッケージに書いてある W数と時間から、ちがう W数での時間を答える
 * watts＝出題に使う［書いてある W数, 家のレンジの W数］の組み合わせ、gaps＝まちがいの選択肢と正解の差（秒）
 * hint＝「W数が大きいほど時間は短い」のヒントを出すか
 */
export const RANGE = [
  { watts: [[500, 1000], [1000, 500]], gaps: [30, 60], hint: true },
  { watts: [[600, 500], [500, 600]], gaps: [30, 60], hint: true },
  { watts: [[600, 500], [500, 600]], gaps: [10, 20, 30], hint: false },
  { watts: [[500, 700], [700, 500], [600, 700]], gaps: [10, 20, 30], hint: false },
  { watts: [[500, 700], [700, 600], [600, 1000], [1000, 700]], gaps: [10, 20], hint: false },
]

/**
 * 仲間はずれ探し。cells＝並ぶ数、cols＝横の数
 * subtle＝false なら違う商品、true なら同じ商品で色だけ違う（config.ts の ODDONE_LATE が 'flip' ならさかさま）
 * hue＝色の違いの大きさ（度）。大きいほど見つけやすい
 * similar＝見た目の似た商品どうしを組み合わせる（ODDONE_LOOKALIKE）
 * jitter＝全部の絵を少しずつ傾けたり大きさを変えたりして、本当の違いを目立たなくする
 */
export const ODDONE = [
  { cells: 9, cols: 3, subtle: false, hue: 0, similar: false, jitter: false },
  { cells: 12, cols: 4, subtle: false, hue: 0, similar: false, jitter: false },
  { cells: 16, cols: 4, subtle: false, hue: 0, similar: false, jitter: false },
  { cells: 12, cols: 4, subtle: false, hue: 0, similar: true, jitter: false },
  { cells: 9, cols: 3, subtle: true, hue: 100, similar: false, jitter: false },
  { cells: 16, cols: 4, subtle: false, hue: 0, similar: true, jitter: true },
  { cells: 16, cols: 4, subtle: true, hue: 60, similar: false, jitter: false },
  { cells: 20, cols: 4, subtle: true, hue: 60, similar: false, jitter: true },
]
/** 見た目の似た商品の組み合わせ（仲間はずれ探しで使う）。src/catalog/ に書く */
export const ODDONE_LOOKALIKE: [string, string][] = catalog.lookalike
/** バラつきの大きさ：傾き（度）と大きさ（倍） */
export const ODDONE_JITTER = { rotate: 14, scale: [0.82, 1.12] }

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

/** 商品神経衰弱。pairs＝ペアの数、cols＝横の数、previewMs＝最初にペアの片方を表で見せる時間（ミリ秒） */
export const PAIRS = [
  { pairs: 3, cols: 3, previewMs: 3500 },
  { pairs: 4, cols: 4, previewMs: 4000 },
  { pairs: 5, cols: 5, previewMs: 4500 },
  { pairs: 6, cols: 4, previewMs: 4500 },
]
/** 神経衰弱で、そろわなかったカードを裏に戻すまでの時間（ミリ秒） */
export const PAIRS_FLIP_BACK_MS = 1100

/** 買い物リスト暗記。items＝メモの品数、perShelf＝1つの棚に並ぶ商品の数（売り場は src/data/shelves.ts） */
export const MEMO = [
  { items: 2, perShelf: 5 },
  { items: 3, perShelf: 6 },
  { items: 3, perShelf: 7 },
  { items: 4, perShelf: 8 },
  { items: 5, perShelf: 8 },
]
/** メモを見られる時間＝ MEMO_LOOK_BASE_MS ＋ 品数 × MEMO_LOOK_PER_ITEM_MS */
export const MEMO_LOOK_BASE_MS = 3500
export const MEMO_LOOK_PER_ITEM_MS = 900

/**
 * お釣りマスター。items＝レジを通る商品数、tax＝税込み（8%、1円未満切り捨て）にするか
 * 「出す枚数＋お釣りの枚数」がいちばん少なければ満点。1枚多いごとに CHANGE_PENALTY 点引く
 */
export const CHANGE = [
  { items: 1, tax: false },
  { items: 2, tax: false },
  { items: 2, tax: true },
  { items: 3, tax: true },
  { items: 4, tax: true },
]
export const CHANGE_PENALTY = 5

/**
 * 割引計算。kinds＝出る割引の種類
 *   half＝半額、yen＝円引き、pct＝％引き、wari＝割引、double＝％引きのあとさらに円引き
 * gaps＝まちがいの選択肢と正解の差（円）
 */
export const DISCOUNT = [
  { kinds: ['half', 'yen'], yen: [50, 100], pct: [] as number[], gaps: [50, 100] },
  { kinds: ['half', 'yen', 'wari'], yen: [30, 50, 100], pct: [10, 20], gaps: [30, 50] },
  { kinds: ['pct', 'wari', 'yen'], yen: [30, 50], pct: [10, 20, 30], gaps: [20, 30, 50] },
  { kinds: ['pct', 'wari'], yen: [], pct: [15, 25, 30, 40], gaps: [10, 20, 30] },
  { kinds: ['pct', 'double'], yen: [20, 30, 50], pct: [10, 20, 30], gaps: [10, 20] },
]

/**
 * 損得勘定。options＝くらべる商品の数、gap＝いちばんお得な商品と次の商品の、100gあたりの値段の差（割合）
 * timeSec＝答えられる時間（秒）。時間切れは不正解
 */
export const VALUE = [
  { options: 2, gap: [0.35, 0.5], timeSec: 10 },
  { options: 2, gap: [0.2, 0.3], timeSec: 9 },
  { options: 2, gap: [0.1, 0.18], timeSec: 8 },
  { options: 3, gap: [0.12, 0.2], timeSec: 9 },
  { options: 3, gap: [0.05, 0.1], timeSec: 8 },
]

/** 霜とりスイーパー。rows×cols のマスに、items 個の商品がかくれている（最初に削るマスとそのまわりには置かない） */
export const SWEEPER = [
  { rows: 4, cols: 4, items: 2 },
  { rows: 5, cols: 5, items: 3 },
  { rows: 5, cols: 5, items: 4 },
  { rows: 6, cols: 6, items: 5 },
  { rows: 6, cols: 6, items: 7 },
]
/** 霜とりスイーパー：商品を1つ割るごとに引く点 */
export const SWEEPER_PENALTY = 10

/**
 * 計量カップ。caps＝カップの大きさ（ml）の組み合わせの候補、steps＝いちばん少ない手順の数の範囲
 * kind：add＝カップで量って鍋に足すだけで作れる問題、move＝カップの間で水を移さないと作れない問題
 */
export const CUPS: { kind: 'add' | 'move'; caps: number[][]; steps: [number, number] }[] = [
  { kind: 'add', caps: [[200, 500], [100, 300], [200, 300]], steps: [2, 4] },
  { kind: 'add', caps: [[300, 500], [200, 700], [300, 800]], steps: [4, 6] },
  { kind: 'move', caps: [[300, 500], [200, 500], [300, 700]], steps: [3, 6] },
  { kind: 'move', caps: [[300, 500], [400, 700], [300, 800], [500, 800]], steps: [5, 8] },
  { kind: 'move', caps: [[300, 700], [500, 900], [400, 900], [300, 1100]], steps: [7, 10] },
]
/** 計量カップ：目安の時間（秒）＝いちばん少ない手順の数 × CUPS_SEC_PER_STEP ＋ CUPS_SEC_BASE。こえると判定が1段階下がる */
export const CUPS_SEC_PER_STEP = 6
export const CUPS_SEC_BASE = 8
