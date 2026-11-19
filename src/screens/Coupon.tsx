import JsBarcode from 'jsbarcode'
import { useEffect, useRef, useState } from 'react'
import { TicketIcon } from '../components/Icons'
import { Sheet } from '../components/Sheet'
import { Thumb } from '../components/Pack'
import { CARD_SIZE, COUPON_DAYS, FREE_COUPON_ID, COUPON_SOON_DAYS, couponApplies, COUPONS, SEASON_MONTHS, seasonLabel, seasonOf, type CouponDef } from '../data/config'
import { PRODUCTS } from '../data/products'
import { sfx } from '../lib/sfx'
import { mdLabel } from '../lib/date'
import { canClaimFree, claimFree, daysLeft, exchange, ticketExpiries, today, useStore, type OwnedCoupon } from '../store'

const defOf = (c: OwnedCoupon) => COUPONS.find((d) => d.id === c.couponId)!
const jp = (key: string) => {
  const [, m, d] = key.split('-').map(Number)
  return `${m}月${d}日`
}

function Barcode({ code }: { code: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (ref.current) JsBarcode(ref.current, code, { format: 'CODE128', height: 80, margin: 10, fontSize: 16, width: 2 })
  }, [code])
  return <svg ref={ref} className="barcode" role="img" aria-label={`バーコード ${code}`} />
}

/** そのクーポンが使える商品。図鑑で見つけた商品だけ絵を出す */
function Targets({ def, onProduct }: { def: CouponDef; onProduct: (id: string) => void }) {
  const { state } = useStore()
  const list = PRODUCTS.filter((p) => couponApplies(def, p))
  return (
    <div className="targets">
      <p>
        使える商品：{def.targetLabel}（{list.length}品）
      </p>
      <ul>
        {list.map((p) =>
          (state.met[p.id] ?? 0) > 0 ? (
            <li key={p.id}>
              <button onClick={() => onProduct(p.id)} aria-label={p.name}>
                <Thumb id={p.id} />
              </button>
            </li>
          ) : (
            <li key={p.id}>
              <div aria-label="まだ見つけていない商品">？</div>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}

export function Coupon({ onProduct }: { onProduct: (id: string) => void }) {
  const { state, update, toast } = useStore()
  const [tab, setTab] = useState<'get' | 'mine'>('get')
  const [confirm, setConfirm] = useState<CouponDef | null>(null)
  const [show, setShow] = useState<string | null>(null)

  const status = (c: OwnedCoupon) => (c.used ? 'used' : daysLeft(state, c) < 0 ? 'expired' : 'ok')
  const usable = state.coupons.filter((c) => status(c) === 'ok').sort((a, b) => a.expires.localeCompare(b.expires))
  const done = state.coupons.filter((c) => status(c) !== 'ok').sort((a, b) => b.issued.localeCompare(a.issued))
  const showing = state.coupons.find((c) => c.uid === show)

  const doExchange = () => {
    if (!confirm) return
    const ok = update((s) => exchange(s, confirm))
    setConfirm(null)
    if (ok) {
      sfx('win')
      setTab('mine')
      toast(`「${confirm.name}」と交換しました`)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>クーポン</h2>
      </div>

      <section className="wallet">
        <p className="wallet-count">
          <TicketIcon size={28} />
          交換チケット <b>{state.tickets}</b>枚
        </p>
        <div className="bar">
          <i style={{ width: `${(state.stamps / CARD_SIZE) * 100}%` }} />
        </div>
        <p className="wallet-next">あと{CARD_SIZE - state.stamps}スタンプで次の1枚</p>
        {ticketExpiries(state).length > 0 && (
          <ul className="ticket-expiry">
            {ticketExpiries(state).map((x) => (
              <li key={x.until.getTime()} className={x.warn ? 'warn' : ''}>
                <b>{x.n}枚</b>：{mdLabel(x.until)}まで{x.warn && `（あと${x.daysLeft}日）`}
              </li>
            ))}
          </ul>
        )}
        <p className="wallet-rule">
          いまは{seasonLabel(seasonOf(today(state)))}のシーズンです。チケットは、もらったシーズン（{SEASON_MONTHS}か月ごと）と、その次のシーズンの終わりまで使えます。スタンプは期限なしで持ちこせます。
        </p>
      </section>

      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === 'get'} className={tab === 'get' ? 'on' : ''} onClick={() => setTab('get')}>
          交換する
        </button>
        <button role="tab" aria-selected={tab === 'mine'} className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>
          持っているクーポン{usable.length > 0 && <b>{usable.length}</b>}
        </button>
      </div>

      {tab === 'get' ? (
        <ul className="coupon-list">
          {/* 月に1回の無料クーポン */}
          <li className={`coupon free ${canClaimFree(state) ? '' : 'got'}`}>
            <div className="coupon-main">
              <strong>🎁 今月の無料クーポン</strong>
              <span>
                {COUPONS.find((c) => c.id === FREE_COUPON_ID)!.name}・チケットなしで月に1回・{COUPON_DAYS}日間有効
              </span>
            </div>
            <button
              className="coupon-btn"
              disabled={!canClaimFree(state)}
              onClick={() =>
                update((s) => {
                  if (claimFree(s)) {
                    sfx('coin')
                    toast('無料クーポンをもらいました。「持っているクーポン」から使えます')
                  }
                })
              }
            >
              {canClaimFree(state) ? 'もらう' : '来月また'}
            </button>
          </li>
          {/* 使える商品がないクーポンは出さない（チルドの商品がないときなど） */}
          {COUPONS.filter((c) => PRODUCTS.some((p) => couponApplies(c, p))).map((c) => {
            const short = c.cost - state.tickets
            return (
              <li key={c.id} className="coupon">
                <div className="coupon-main">
                  <strong>{c.name}</strong>
                  <span>
                    チケット {c.cost}枚・{c.targetLabel}に使える・{COUPON_DAYS}日間有効
                  </span>
                </div>
                <button className="coupon-btn" disabled={short > 0} onClick={() => setConfirm(c)}>
                  {short > 0 ? `あと${short}枚` : '交換する'}
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <>
          {state.coupons.length === 0 && (
            <p className="empty">
              まだクーポンはありません。
              <br />
              スタンプを10個ためると、交換チケットが1枚もらえます。
            </p>
          )}
          <ul className="coupon-list">
            {usable.map((c) => {
              const left = daysLeft(state, c)
              return (
                <li key={c.uid} className="coupon mine">
                  <div className="coupon-main">
                    <strong>{defOf(c).name}</strong>
                    <span className={left <= COUPON_SOON_DAYS ? 'soon' : ''}>
                      {jp(c.expires)}まで
                      {left <= COUPON_SOON_DAYS && `・まもなく期限（${left === 0 ? '今日まで' : `あと${left}日`}）`}
                    </span>
                  </div>
                  <button className="coupon-btn" onClick={() => setShow(c.uid)}>
                    使う
                  </button>
                </li>
              )
            })}
          </ul>
          {done.length > 0 && (
            <>
              <h3 className="sub-head">使用済み・期限切れ</h3>
              <ul className="coupon-list">
                {done.map((c) => (
                  <li key={c.uid} className="coupon over">
                    <div className="coupon-main">
                      <strong>{defOf(c).name}</strong>
                      <span>{c.used ? '使用済み' : `期限切れ（${jp(c.expires)}まで）`}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {confirm && (
        <Sheet title="交換しますか？" onClose={() => setConfirm(null)}>
          <p className="note">
            チケット<b>{confirm.cost}</b>枚を使って「{confirm.name}」と交換します。
            <br />
            のこり {state.tickets}枚 → <b>{state.tickets - confirm.cost}</b>枚
            <br />
            <small>期限の近いチケットから使います</small>
          </p>
          <Targets def={confirm} onProduct={onProduct} />
          <button className="btn play" onClick={doExchange}>
            交換する
          </button>
          <button className="btn ghost" onClick={() => setConfirm(null)}>
            やめる
          </button>
        </Sheet>
      )}

      {showing && (
        <Sheet title={defOf(showing).name} onClose={() => setShow(null)}>
          <p className="note center">レジでこのバーコードを見せてください</p>
          <div className="barcode-box">
            <Barcode code={showing.code} />
          </div>
          <p className="note center">{jp(showing.expires)}まで有効</p>
          <Targets def={defOf(showing)} onProduct={onProduct} />
          <button
            className="btn ghost"
            onClick={() => {
              update((s) => void (s.coupons.find((c) => c.uid === showing.uid)!.used = true))
              setShow(null)
              toast('使用済みにしました')
            }}
          >
            使用済みにする
          </button>
          <p className="note center">
            <small>本番ではレジの読み取りで自動的に使用済みになります。</small>
          </p>
        </Sheet>
      )}
    </div>
  )
}
