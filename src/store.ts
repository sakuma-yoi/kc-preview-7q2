// アプリのデータ（端末内に保存）と、報酬まわりのルール

import { createContext, useContext } from 'react'
import {
  CARD_SIZE,
  COUPON_DAYS,
  COUPONS,
  couponApplies,
  LOTTERY,
  MONTH_BONUS_TICKETS,
  NEW_GAME_EVERY,
  PURCHASE_STAMPS_PER_WEEK,
  WEEK_BONUS_STAMPS,
  brainAge,
  starsOf,
  WELCOME_STAMPS,
  type CouponDef,
  type Prize,
} from './data/config'
import { DEFAULT_GAME_PRODUCTS, GAMES, NEW_GAME_ORDER, gameById } from './data/games'
import { PRODUCTS, productById, purchaseStamps, type Product } from './data/products'
import { addDays, dateKey, daysInMonth, weekDays } from './lib/date'

export type GameRecord = { best: number; plays: number; last: number }
export type OwnedCoupon = { uid: string; couponId: string; issued: string; expires: string; used: boolean; code: string }

export type State = {
  v: 1
  tickets: number
  /** いまのスタンプカードに押してある数 */
  stamps: number
  /** 今日の脳トレをクリアした日 */
  clearedDays: string[]
  /** いつでも遊べる脳トレ */
  owned: string[]
  /** 今日の脳トレに届いている、まだクリアしていない新しい脳トレ */
  pendingNew: string | null
  daily: { date: string; gameId: string; isNew: boolean } | null
  records: Record<string, GameRecord>
  /** 商品ごとの、見つけた脳トレ */
  seen: Record<string, string[]>
  /** 商品ごとの、出会った回数（正解した問題に出てきた回数）。図鑑の★になる */
  met: Record<string, number>
  /** 図鑑でまだ見ていない、新しく見つけた商品 */
  fresh: string[]
  /** 日ごとの冷凍庫脳年齢（その日に遊んだ回の平均を出すための合計と回数） */
  ages: Record<string, { sum: number; n: number }>
  purchase: { week: string; count: number }
  coupons: OwnedCoupon[]
  weekBonus: string[]
  monthBonus: string[]
  gameProducts: Record<string, string[]>
  /** showLevel：脳トレ中にいまのレベルを出すか（試しに表示。省略時は出す） */
  settings: { big: boolean; sound: boolean; showLevel?: boolean }
  /** 試作用：日付をずらす日数 */
  dayOffset: number
}

const KEY = 'reitoko-noutore-v1'

export const initialState = (): State => ({
  v: 1,
  tickets: 0,
  stamps: 0,
  clearedDays: [],
  owned: GAMES.filter((g) => g.free).map((g) => g.id),
  pendingNew: null,
  daily: null,
  records: {},
  seen: {},
  met: {},
  fresh: [],
  ages: {},
  purchase: { week: '', count: 0 },
  coupons: [],
  weekBonus: [],
  monthBonus: [],
  gameProducts: {},
  settings: { big: false, sound: false, showLevel: true },
  dayOffset: 0,
})

export function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && s.v === 1) {
        const merged: State = { ...initialState(), ...s }
        // 以前の版のデータ：見つけた商品は「1回出会った」として引き継ぐ
        for (const id of Object.keys(merged.seen)) if (merged.seen[id].length > 0) merged.met[id] ??= 1
        return merged
      }
    }
  } catch {
    // 保存が使えない環境では、毎回はじめから
  }
  return initialState()
}

export function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // 保存できなくても遊べるようにする
  }
}

export const today = (s: State) => addDays(new Date(), s.dayOffset)
export const todayKey = (s: State) => dateKey(today(s))
export const clearedToday = (s: State) => s.clearedDays.includes(todayKey(s))
export const mondayKey = (d: Date) => dateKey(weekDays(d)[0])

/** あたらしい脳トレが届くまでの、あと何日クリアが必要か（もう届かないときは null） */
export function daysToNewGame(s: State): number | null {
  const locked = NEW_GAME_ORDER.filter((id) => !s.owned.includes(id))
  if (locked.length === 0) return null
  if (s.pendingNew) return 0
  const got = s.owned.length - GAMES.filter((g) => g.free).length
  const need = NEW_GAME_EVERY - 1 + NEW_GAME_EVERY * got
  return Math.max(0, need - s.clearedDays.length)
}

/** 今日の脳トレを決める（1日1回）。新しい脳トレは、クリアするまで出続ける */
export function ensureDaily(s: State) {
  const key = todayKey(s)
  if (s.daily?.date === key) return
  const locked = NEW_GAME_ORDER.filter((id) => !s.owned.includes(id))
  if (!s.pendingNew && locked.length > 0 && daysToNewGame(s) === 0) s.pendingNew = locked[0]
  if (s.pendingNew) {
    s.daily = { date: key, gameId: s.pendingNew, isNew: true }
    return
  }
  let h = 0
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0
  let pool = s.owned
  if (pool.length > 1 && s.daily) pool = pool.filter((id) => id !== s.daily!.gameId)
  s.daily = { date: key, gameId: pool[h % pool.length], isNew: false }
}

/** そのゲームに登場する商品 */
export function productsFor(s: State, gameId: string): Product[] {
  const custom = s.gameProducts[gameId]
  const ids = custom && custom.length >= gameById(gameId).minProducts ? custom : DEFAULT_GAME_PRODUCTS[gameId]
  return PRODUCTS.filter((p) => ids.includes(p.id))
}

/** スタンプを押す。カードがいっぱいになったら交換チケットに変える。もらったチケット数を返す */
export function addStamps(s: State, n: number): number {
  s.stamps += n
  let got = 0
  while (s.stamps >= CARD_SIZE) {
    s.stamps -= CARD_SIZE
    s.tickets += 1
    got += 1
  }
  return got
}

export type PlayResult = { isBest: boolean; newProducts: string[]; starUps: string[] }

/** 1回遊んだ結果を記録する。learned は正解した問題に出てきた商品（出会った回数ぶん重複あり） */
export function recordPlay(s: State, gameId: string, score: number, learned: string[]): PlayResult {
  const r = s.records[gameId] ?? { best: 0, plays: 0, last: 0 }
  const isBest = r.plays > 0 && score > r.best
  s.records[gameId] = { best: Math.max(r.best, score), plays: r.plays + 1, last: score }
  const key = todayKey(s)
  const day = (s.ages[key] ??= { sum: 0, n: 0 })
  day.sum += brainAge(score)
  day.n += 1

  const newProducts: string[] = []
  const starUps: string[] = []
  for (const id of learned) {
    const before = s.met[id] ?? 0
    s.met[id] = before + 1
    if (before === 0) {
      newProducts.push(id)
      s.fresh.push(id)
    } else if (starsOf(before + 1) > starsOf(before) && !starUps.includes(id)) starUps.push(id)
    const list = (s.seen[id] ??= [])
    if (!list.includes(gameId)) list.push(gameId)
  }
  return { isBest, newProducts, starUps }
}

export function drawPrize(): Prize {
  let r = Math.random() * LOTTERY.reduce((sum, p) => sum + p.weight, 0)
  for (const p of LOTTERY) {
    r -= p.weight
    if (r < 0) return p
  }
  return LOTTERY[0]
}

export type Reward = { text: string; kind: 'stamp' | 'ticket' | 'game' }

/** 今日の脳トレをクリアして、くじの景品を受け取る */
export function claimDaily(s: State, prize: Prize): { rewards: Reward[]; stampsAdded: number; first: boolean } {
  const d = today(s)
  const key = dateKey(d)
  const rewards: Reward[] = []
  if (s.clearedDays.includes(key)) return { rewards, stampsAdded: 0, first: false }
  const first = s.clearedDays.length === 0
  s.clearedDays.push(key)

  let stamps = 0
  if (prize.kind === 'stamp') {
    stamps += prize.amount
    rewards.push({ kind: 'stamp', text: `くじ：スタンプ ${prize.amount}個` })
  } else {
    s.tickets += prize.amount
    rewards.push({ kind: 'ticket', text: `くじ：交換チケット ${prize.amount}枚` })
  }
  if (first) {
    stamps += WELCOME_STAMPS
    rewards.push({ kind: 'stamp', text: `はじめてボーナス：スタンプ ${WELCOME_STAMPS}個` })
  }
  const wk = mondayKey(d)
  if (!s.weekBonus.includes(wk) && weekDays(d).every((x) => s.clearedDays.includes(dateKey(x)))) {
    s.weekBonus.push(wk)
    stamps += WEEK_BONUS_STAMPS
    rewards.push({ kind: 'stamp', text: `1週間毎日ボーナス：スタンプ ${WEEK_BONUS_STAMPS}個` })
  }
  const month = key.slice(0, 7)
  if (!s.monthBonus.includes(month) && s.clearedDays.filter((k) => k.startsWith(month)).length === daysInMonth(d)) {
    s.monthBonus.push(month)
    s.tickets += MONTH_BONUS_TICKETS
    rewards.push({ kind: 'ticket', text: `1か月毎日ボーナス：交換チケット ${MONTH_BONUS_TICKETS}枚` })
  }
  const full = addStamps(s, stamps)
  if (full > 0) rewards.push({ kind: 'ticket', text: `カードがいっぱい：交換チケット ${full}枚` })

  if (s.daily?.isNew && s.pendingNew === s.daily.gameId) {
    s.owned.push(s.pendingNew)
    rewards.push({ kind: 'game', text: `「${gameById(s.pendingNew).name}」がいつでも遊べるようになりました` })
    s.pendingNew = null
  }
  return { rewards, stampsAdded: stamps, first }
}

/** 今週あと何個、購入スタンプをもらえるか */
export function purchaseLeft(s: State) {
  const used = s.purchase.week === mondayKey(today(s)) ? s.purchase.count : 0
  return PURCHASE_STAMPS_PER_WEEK - used
}

/** 商品を買ったときのスタンプ。押した数と、もらったチケット数を返す */
export function purchase(s: State, productId: string) {
  const left = purchaseLeft(s)
  const n = Math.min(purchaseStamps(productById(productId)), left)
  if (n <= 0) return { stamps: 0, tickets: 0 }
  s.purchase = { week: mondayKey(today(s)), count: PURCHASE_STAMPS_PER_WEEK - left + n }
  return { stamps: n, tickets: addStamps(s, n) }
}

/** 交換チケットをクーポンに換える */
export function exchange(s: State, def: CouponDef) {
  if (s.tickets < def.cost) return false
  s.tickets -= def.cost
  const d = today(s)
  const code = String(Math.floor(1e11 + Math.random() * 9e11))
  s.coupons.push({
    uid: `${Date.now()}-${code.slice(-4)}`,
    couponId: def.id,
    issued: dateKey(d),
    expires: dateKey(addDays(d, COUPON_DAYS)),
    used: false,
    code,
  })
  return true
}

/** 期限までの残り日数（今日が期限なら0、過ぎていたらマイナス） */
export function daysLeft(s: State, c: OwnedCoupon) {
  const [y, m, d] = c.expires.split('-').map(Number)
  const t = today(s)
  const a = new Date(y, m - 1, d).getTime()
  const b = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()
  return Math.round((a - b) / 86400000)
}

/** その商品に使える、持っている（まだ使える）クーポン */
export function usableCoupons(s: State, p: Product): CouponDef[] {
  return s.coupons
    .filter((c) => !c.used && daysLeft(s, c) >= 0)
    .map((c) => COUPONS.find((d) => d.id === c.couponId)!)
    .filter((d) => couponApplies(d, p))
}

export type Store = {
  state: State
  /** データを書き換えて保存する。fn の戻り値をそのまま返す */
  update: <T>(fn: (draft: State) => T) => T
  /** 画面の下に短いお知らせを出す */
  toast: (msg: string) => void
}

export const StoreContext = createContext<Store>(null as unknown as Store)
export const useStore = () => useContext(StoreContext)
