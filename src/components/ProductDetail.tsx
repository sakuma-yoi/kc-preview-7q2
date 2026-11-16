import { useState } from 'react'
import { COUPONS, couponApplies, STAR_STEPS, starsOf } from '../data/config'
import { gameById } from '../data/games'
import { productById, purchaseStamps } from '../data/products'
import { Pack } from './Pack'
import { yen } from '../lib/util'
import { usableCoupons, useStore } from '../store'
import { Sheet } from './Sheet'

export function ProductDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { state } = useStore()
  const [linkNote, setLinkNote] = useState(false)
  const p = productById(id)
  const games = state.seen[id] ?? []
  const met = state.met[id] ?? 0
  const star = starsOf(met)
  const next = STAR_STEPS[star]
  const held = usableCoupons(state, p)
  const coupons = COUPONS.filter((c) => couponApplies(c, p))

  return (
    <Sheet title={p.name} onClose={onClose}>
      <p className="product-hero">
        <Pack id={p.id} alt={`${p.name}のパッケージ`} />
      </p>
      <p className="product-copy">
        {p.isNew && <em>NEW</em>}
        {p.copy}
      </p>
      <p className="note">{p.desc}</p>
      <dl className="spec">
        <dt>種類</dt>
        <dd>
          {p.type}・{p.genre}
        </dd>
        <dt>内容量</dt>
        <dd>{p.amount}</dd>
        <dt>調理方法</dt>
        <dd>{p.cook}</dd>
        <dt>価格の目安</dt>
        <dd>{yen(p.price)}（税込）</dd>
        <dt>購入スタンプ</dt>
        <dd>{purchaseStamps(p)}個</dd>
        <dt>図鑑の★</dt>
        <dd>
          {met === 0 ? (
            'まだ出会っていません'
          ) : (
            <>
              {'★'.repeat(star)}
              {'☆'.repeat(STAR_STEPS.length - star)}（{met}回出会った{next ? `・あと${next - met}回で★${star + 1}` : ''}）
            </>
          )}
        </dd>
        <dt>使えるクーポン</dt>
        <dd>
          {coupons.map((c) => (
            <span key={c.id} className={`coupon-tag ${held.includes(c) ? 'held' : ''}`}>
              {c.name}
              {held.includes(c) && '（持っています）'}
            </span>
          ))}
        </dd>
        <dt>見つけた脳トレ</dt>
        <dd>{games.length > 0 ? games.map((g) => gameById(g).name).join('、') : 'まだ出会っていません'}</dd>
      </dl>
      {p.buyUrl ? (
        <a className="btn play small" href={p.buyUrl} target="_blank" rel="noopener noreferrer">
          買えるお店を見る
        </a>
      ) : (
        <>
          <button className="btn play small" onClick={() => setLinkNote(true)}>
            買えるお店を見る
          </button>
          {linkNote && <p className="note center">この商品の購入ページは、まだ登録されていません。</p>}
        </>
      )}
    </Sheet>
  )
}
