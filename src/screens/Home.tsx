import BRAND from '#brand'
import { useState } from 'react'
import { Thumb } from '../components/Pack'
import { PIcon } from '../components/PIcon'
import { QrIcon, Snow, TicketIcon } from '../components/Icons'
import { Sheet } from '../components/Sheet'
import { BANNER, CARD_SIZE, MONTH_BONUS_TICKETS, WEEK_BONUS_STAMPS } from '../data/config'
import { gameById } from '../data/games'
import { PRODUCTS, productById, purchaseStamps } from '../data/products'
import { dateKey, daysInMonth, jpDate, WEEK_LABELS, weekDays } from '../lib/date'
import { sfx } from '../lib/sfx'
import { clearedToday, purchase, purchaseLeft, today, todayKey, useStore } from '../store'

const TILT = [-8, 5, -3, 9, -6, 4, -10, 7, -4, 0]

type Props = {
  /** 押したばかりのスタンプの数（押す動きを見せる） */
  fresh: number
  onFresh: (n: number) => void
  onPlay: (gameId: string, daily: boolean) => void
  onProduct: (id: string) => void
}

export function Home({ fresh, onFresh, onPlay, onProduct }: Props) {
  const { state, update, toast } = useStore()
  const [buying, setBuying] = useState(false)

  const now = today(state)
  const key = todayKey(state)
  const daily = state.daily!
  const game = gameById(daily.gameId)
  const cleared = clearedToday(state)
  const banner = productById(BANNER.productId)

  const week = weekDays(now)
  const weekLeft = week.filter((d) => !state.clearedDays.includes(dateKey(d))).length
  // 今週・今月すでに逃した日があるか。始めたばかりの人には「来週から」「来月から」と案内する
  const firstDay = [...state.clearedDays].sort()[0] ?? key
  const weekMissed = week.some((d) => dateKey(d) < key && !state.clearedDays.includes(dateKey(d)))
  const startedThisWeek = firstDay >= dateKey(week[0])
  const startedThisMonth = firstDay >= `${key.slice(0, 7)}-01`
  const month = key.slice(0, 7)
  const monthCleared = state.clearedDays.filter((k) => k.startsWith(month)).length
  const monthTotal = daysInMonth(now)
  const monthMissed = now.getDate() - 1 - (monthCleared - (cleared ? 1 : 0)) > 0
  const left = purchaseLeft(state)

  const buy = (id: string) => {
    const got = update((s) => purchase(s, id))
    setBuying(false)
    if (got.stamps === 0) return
    sfx('stamp')
    onFresh(got.stamps)
    toast(got.tickets > 0 ? 'カードがいっぱい！交換チケットを1枚もらいました' : `スタンプを${got.stamps}個押しました`)
  }

  return (
    <div className="home">
      <p className="date">
        {jpDate(now)}
        <span>{cleared ? BRAND.doneGreeting : BRAND.greeting}</span>
      </p>

      {/* 今日の脳トレ：冷凍庫のとびら */}
      <section className="door" aria-label="今日の脳トレ">
        <span className="pop-tag">今日の脳トレ</span>
        <div className="door-body">
          <div className="door-text">
            <p className="chips">
              <span className={`chip cat-${game.category}`}>{game.category}</span>
              {daily.isNew && <span className="chip new">あたらしい脳トレ</span>}
            </p>
            <h2>{game.name}</h2>
            <p className="meta">
              {game.summary}
              <br />全{game.questions}問・約{game.minutes}分
            </p>
          </div>
          <div className="door-icon" aria-hidden="true">
            {game.icon}
            {cleared && <span className="done-mark">クリア</span>}
          </div>
        </div>
        {cleared ? (
          <>
            <button className="btn ghost" onClick={() => onPlay(game.id, true)}>
              もう一度あそぶ
            </button>
            <p className="door-note">スタンプくじは、あした また引けます</p>
          </>
        ) : (
          <>
            <button className="btn play" onClick={() => onPlay(game.id, true)}>
              あそぶ
            </button>
            <p className="door-note">
              {daily.isNew ? 'クリアすると、いつでも遊べるようになります' : 'クリアすると スタンプくじ が1回引けます'}
            </p>
          </>
        )}
        <span className="handle" aria-hidden="true" />
      </section>

      {/* スタンプカード */}
      <section className="card" aria-label="スタンプカード">
        <div className="card-head">
          <h3>スタンプカード</h3>
          <p>
            あと<b>{CARD_SIZE - state.stamps}</b>個でチケット1枚
          </p>
        </div>
        <ol className="slots">
          {Array.from({ length: CARD_SIZE }, (_, i) => {
            const filled = i < state.stamps
            const isFresh = filled && i >= state.stamps - fresh
            const last = i === CARD_SIZE - 1
            return (
              <li key={i} className={last ? 'goal' : ''}>
                {filled ? (
                  <span
                    className={`ink ${isFresh ? 'fresh' : ''}`}
                    style={{
                      rotate: `${TILT[i]}deg`,
                      animationDelay: isFresh ? `${(i - (state.stamps - fresh)) * 0.22 + 0.2}s` : undefined,
                    }}
                  >
                    <Snow size={22} />
                  </span>
                ) : last ? (
                  <TicketIcon size={24} />
                ) : (
                  <span className="num">{i + 1}</span>
                )}
              </li>
            )
          })}
        </ol>

        <div className="streak">
          <ul className="week" aria-label="今週の記録">
            {week.map((d, i) => {
              const k = dateKey(d)
              return (
                <li key={k} className={`${state.clearedDays.includes(k) ? 'hit' : ''} ${k === key ? 'today' : ''}`}>
                  <span>{WEEK_LABELS[i]}</span>
                  <i />
                </li>
              )
            })}
          </ul>
          <p>
            {weekLeft === 0
              ? '今週は毎日クリア！'
              : weekMissed
                ? startedThisWeek
                  ? `来週から 毎日でスタンプ+${WEEK_BONUS_STAMPS}`
                  : '毎日ボーナスは来週また挑戦'
                : `あと${weekLeft}日で スタンプ+${WEEK_BONUS_STAMPS}`}
          </p>
        </div>
        <div className="month">
          <div className="bar">
            <i style={{ width: `${(monthCleared / monthTotal) * 100}%` }} />
          </div>
          <p>
            今月 <b>{monthCleared}</b>/{monthTotal}日
            {monthMissed
              ? startedThisMonth
                ? `　来月から 毎日つづけるとチケット+${MONTH_BONUS_TICKETS}`
                : '　毎日ボーナスは来月また挑戦'
              : `　毎日つづけるとチケット+${MONTH_BONUS_TICKETS}`}
          </p>
        </div>

        <button className="btn qr" onClick={() => setBuying(true)}>
          <QrIcon size={22} />
          商品を買ったらスタンプ
          <small>今週あと{left}個</small>
        </button>
      </section>

      {/* おすすめ商品 */}
      <button className="banner" onClick={() => onProduct(banner.id)}>
        <span className="banner-icon" aria-hidden="true">
          <Thumb id={banner.id} />
        </span>
        <span className="banner-text">
          <em>{BANNER.label}</em>
          <strong>{banner.name}</strong>
          <span>{banner.copy}</span>
        </span>
        <span className="arrow" aria-hidden="true">
          ›
        </span>
      </button>

      {buying && (
        <Sheet title="買った商品をえらぶ" onClose={() => setBuying(false)}>
          <p className="note">
            {left > 0 ? (
              <>
                今週あと<b>{left}</b>個もらえます。
              </>
            ) : (
              '今週の分は受け取り済みです。来週の月曜日からまたもらえます。'
            )}
            <br />
            <small>本番ではカメラでQRコードを読み取ります（試作版は一覧からえらびます）。</small>
          </p>
          <ul className="buy-list">
            {PRODUCTS.map((p) => (
              <li key={p.id}>
                <button disabled={left === 0} onClick={() => buy(p.id)}>
                  <span aria-hidden="true"><PIcon id={p.id} /></span>
                  {p.name}
                  <b>+{Math.min(purchaseStamps(p), Math.max(left, 1))}</b>
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </div>
  )
}
