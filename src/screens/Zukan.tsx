import { useEffect, useState } from 'react'
import { Pack } from '../components/Pack'
import { PIcon } from '../components/PIcon'
import { Sheet } from '../components/Sheet'
import { featuredFor, STAR_STEPS, starsOf } from '../data/config'
import { GAMES } from '../data/games'
import { GENRES, PRODUCTS, productById, shortName, type Genre, type Product, type ProductType } from '../data/products'
import { productsFor, today, useStore } from '../store'

type Props = { onProduct: (id: string) => void }

/** ★の数（3つのうちいくつ光っているか） */
export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`★${n}`}>
      {STAR_STEPS.map((_, i) => (
        <i key={i} className={i < n ? 'on' : ''}>
          ★
        </i>
      ))}
    </span>
  )
}

export function Zukan({ onProduct }: Props) {
  const { state, update, toast } = useStore()
  const [type, setType] = useState<ProductType | 'すべて'>('すべて')
  const [genre, setGenre] = useState<Genre | 'すべて'>('すべて')
  const [hint, setHint] = useState<Product | null>(null)
  // 開いたときに「新しく見つけた商品」を覚えておき、印をつける
  const [fresh] = useState(() => [...state.fresh])

  useEffect(() => {
    if (state.fresh.length > 0) update((s) => void (s.fresh = []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isFound = (id: string) => (state.met[id] ?? 0) > 0
  const stars = PRODUCTS.reduce((sum, p) => sum + starsOf(state.met[p.id] ?? 0), 0)
  const maxStars = PRODUCTS.length * STAR_STEPS.length
  const now = today(state)
  const foundCount = PRODUCTS.filter((p) => isFound(p.id)).length
  const list = PRODUCTS.filter((p) => (type === 'すべて' || p.type === type) && (genre === 'すべて' || p.genre === genre))

  const hintGames = (p: Product) =>
    GAMES.filter((g) => state.owned.includes(g.id) && productsFor(state, g.id).includes(p)).map((g) => g.name)

  return (
    <div className="page">
      <div className="page-head">
        <h2>商品図鑑</h2>
        <p>
          見つけた <b>{foundCount}</b> / {PRODUCTS.length}　★ <b>{stars}</b> / {maxStars}
        </p>
      </div>
      <div className="bar">
        <i style={{ width: `${(stars / maxStars) * 100}%` }} />
      </div>

      <section className="featured">
        <h3>{now.getMonth() + 1}月の特集</h3>
        <ul>
          {featuredFor(now).map((id) => {
            const p = productById(id)
            const ok = isFound(id)
            return (
              <li key={id}>
                <button onClick={() => (ok ? onProduct(id) : setHint(p))}>
                  <span className={ok ? '' : 'shadow'} aria-hidden="true">
                    {ok ? <Pack id={p.id} /> : <PIcon id={p.id} />}
                  </span>
                  <strong>{ok ? shortName(p) : 'この商品を探そう！'}</strong>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="filter" role="group" aria-label="種類でしぼる">
        {(['すべて', '冷凍', 'チルド'] as const).map((t) => (
          <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="filter small" role="group" aria-label="ジャンルでしぼる">
        {(['すべて', ...GENRES] as const).map((g) => (
          <button key={g} className={genre === g ? 'on' : ''} onClick={() => setGenre(g)}>
            {g}
          </button>
        ))}
      </div>

      <ul className="zukan-grid">
        {list.map((p) => {
          const ok = isFound(p.id)
          const isNew = fresh.includes(p.id)
          return (
            <li key={p.id}>
              <button
                className={`zukan-item ${ok ? '' : 'locked'} ${isNew ? 'unlock' : ''}`}
                onClick={() => (ok ? onProduct(p.id) : toast('まだ見つけていません。脳トレで出会うと登録されます'))}
              >
                {isNew && <em>はっけん！</em>}
                <span aria-hidden="true">{ok ? <Pack id={p.id} /> : '🔒'}</span>
                <strong>{ok ? shortName(p) : '？？？'}</strong>
                {ok && <Stars n={starsOf(state.met[p.id] ?? 0)} />}
              </button>
            </li>
          )
        })}
      </ul>
      {list.length === 0 && <p className="note center">この条件の商品はありません</p>}

      {hint && (
        <Sheet title="この商品を探そう！" onClose={() => setHint(null)}>
          <p className="product-hero shadow" aria-hidden="true">
            <PIcon id={hint.id} />
          </p>
          <p className="note">
            ヒント：<b>{hint.type}</b>の<b>{hint.genre}</b>です。
          </p>
          <p className="note">
            {hintGames(hint).length > 0
              ? `出会えるかもしれない脳トレ：${hintGames(hint).join('、')}`
              : 'これから届く脳トレで出会えるかもしれません'}
          </p>
        </Sheet>
      )}
    </div>
  )
}
