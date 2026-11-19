// 報酬の数値、くじ、クーポン、特集、バナーはここで調整する

import catalog from '#catalog'

/** スタンプカード1枚のマス数。いっぱいになると交換チケット1枚 */
export const CARD_SIZE = 10

/** 月〜日を毎日クリアしたときのボーナススタンプ */
export const WEEK_BONUS_STAMPS = 1

/** その月を毎日クリアしたときのボーナスチケット */
export const MONTH_BONUS_TICKETS = 1

/** はじめて今日の脳トレをクリアしたときのボーナススタンプ */
export const WELCOME_STAMPS = 2

/** 商品の購入でもらえるスタンプの、1週間の上限（仮） */
export const PURCHASE_STAMPS_PER_WEEK = 2

/** あたらしい脳トレが届く間隔（今日の脳トレをクリアした日数） */
export const NEW_GAME_EVERY = 3

export type Prize = { kind: 'stamp' | 'ticket'; amount: number; weight: number }

/** スタンプくじ（今日の脳トレをクリアすると1日1回）。weight は確率（%） */
export const LOTTERY: Prize[] = [
  { kind: 'stamp', amount: 1, weight: 75 },
  { kind: 'stamp', amount: 2, weight: 19 },
  { kind: 'stamp', amount: 3, weight: 5 },
  { kind: 'ticket', amount: 1, weight: 1 },
]

export type CouponDef = {
  id: string
  name: string
  cost: number
  /** どの商品に使えるか */
  target: 'frozen' | 'chilled' | 'new'
  targetLabel: string
}

/** 交換できるクーポン（仮） */
export const COUPONS: CouponDef[] = [
  { id: 'c20', name: '冷凍食品 20円引き', cost: 1, target: 'frozen', targetLabel: '冷凍の商品' },
  { id: 'c50', name: '冷凍食品 50円引き', cost: 2, target: 'frozen', targetLabel: '冷凍の商品' },
  { id: 'c100', name: 'チルド食品 100円引き', cost: 4, target: 'chilled', targetLabel: 'チルドの商品' },
  { id: 'chalf', name: 'NEW商品 半額', cost: 6, target: 'new', targetLabel: 'NEWの商品' },
]

/** そのクーポンが、その商品に使えるか */
export const couponApplies = (c: CouponDef, p: { type: string; isNew?: boolean }) =>
  c.target === 'frozen' ? p.type === '冷凍' : c.target === 'chilled' ? p.type === 'チルド' : !!p.isNew

/** クーポンの有効期限（交換からの日数） */
export const COUPON_DAYS = 30
/** 「まもなく期限」と表示する残り日数 */
export const COUPON_SOON_DAYS = 7

/**
 * 交換チケットのシーズン：3か月ごとに区切る（SEASON_FIRST_MONTH 月から始まる3か月が1シーズン）
 * あるシーズンにもらったチケットは、次のシーズンの終わりまで使える。それをすぎると消える
 */
export const SEASON_MONTHS = 3
export const SEASON_FIRST_MONTH = 1
/** 期限の何日前から「まもなく期限」と知らせるか */
export const TICKET_WARN_DAYS = 30

/** その日のシーズン番号 */
export const seasonOf = (d: Date) => Math.floor((d.getFullYear() * 12 + d.getMonth() - (SEASON_FIRST_MONTH - 1)) / SEASON_MONTHS)
/** シーズンの最初の日 */
export const seasonStart = (n: number) => {
  const m = n * SEASON_MONTHS + SEASON_FIRST_MONTH - 1
  return new Date(Math.floor(m / 12), m % 12, 1)
}
/** シーズンの最後の日 */
export const seasonEnd = (n: number) => {
  const d = seasonStart(n + 1)
  d.setDate(d.getDate() - 1)
  return d
}
/** 「10〜12月」のような呼び方 */
export const seasonLabel = (n: number) => `${seasonStart(n).getMonth() + 1}〜${seasonEnd(n).getMonth() + 1}月`

/** ホームのおすすめ商品バナー */
export const BANNER = catalog.banner

/** 図鑑の「今月の特集」。月（1〜12）ごとに3品。季節に合わせて入れ替える */
export const FEATURED_BY_MONTH: Record<number, string[]> = catalog.featuredByMonth
export const featuredFor = (d: Date) => FEATURED_BY_MONTH[d.getMonth() + 1]

/** 図鑑の★：出会った回数がこの数に届くと★1・★2・★3 */
export const STAR_STEPS = [1, 5, 15]
export const starsOf = (met: number) => STAR_STEPS.filter((n) => met >= n).length

/** 点数の内訳：正確さと速さの割合（合計1） */
export const SCORE_ACCURACY = 0.7
export const SCORE_SPEED = 0.3

/**
 * 仲間はずれ探しの後半の出し方
 *   'color' … 色だけ違う（商品の絵の色を変える）
 *   'flip'  … さかさまになっている（絵の色は変えない。メーカーの決まりで色を変えられないとき）
 */
export const ODDONE_LATE: 'color' | 'flip' = 'color'

/** 冷凍庫脳年齢 */
/** 冷凍庫脳年齢：100点で20歳、0点で55歳 */
export const brainAge = (score: number) => Math.round(20 + (100 - score) * 0.35)

export const APP_VERSION = '1.14.0'
