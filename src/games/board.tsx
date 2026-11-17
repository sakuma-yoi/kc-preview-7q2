// 盤面を操作する脳トレ：間違い探し・商品神経衰弱・買い物リスト暗記・商品名シャッフル

import { useEffect, useMemo, useState } from 'react'
import { GenericPack, PIcon } from '../components/PIcon'
import { SHELVES, shelfOf, type ShelfId } from '../data/shelves'
import { shortName, type Product } from '../data/products'
import { sfx } from '../lib/sfx'
import { randInt, sample, shuffle } from '../lib/util'
import { DIFF, DIFF_MISSES, MEMO, MEMO_LOOK_BASE_MS, MEMO_LOOK_PER_ITEM_MS, PACE, PAIRS, PAIRS_FLIP_BACK_MS } from '../data/levels'
import { Stage, useRounds, type GameProps } from './common'

/* ---------- 間違い探し ---------- */

type Cell = { p: Product; flip?: boolean }

function DiffRound({ products, level, onEnd }: { products: Product[]; level: number; onEnd: (found: number, ids: string[]) => void }) {
  const q = useMemo(() => {
    const lv = DIFF[level]
    const cols = lv.cols
    const pool = sample(products, Math.min(6, products.length))
    const base: Cell[] = Array.from({ length: lv.cells }, () => ({ p: pool[randInt(pool.length)] }))
    const diffs = sample(
      base.map((_, i) => i),
      lv.diffs,
    )
    const changed = base.map((c) => ({ ...c }))
    diffs.forEach((i, k) => {
      // 難しいレベルでは、1つだけ「さかさま」の違いを入れる
      if (lv.flip && k === 0) changed[i].flip = true
      else changed[i].p = sample(pool.filter((x) => x !== base[i].p), 1)[0]
    })
    return { cols, base, changed, diffs }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [found, setFound] = useState<number[]>([])
  const [miss, setMiss] = useState(0)
  const [over, setOver] = useState(false)

  // 見つけた場所にあった商品（おてほん側と、変わった側）
  const idsOf = (cells: number[]) => cells.flatMap((i) => [q.base[i].p.id, q.changed[i].p.id])

  const tap = (i: number) => {
    if (over || found.includes(i)) return
    if (q.diffs.includes(i)) {
      const next = [...found, i]
      setFound(next)
      if (next.length === q.diffs.length) {
        setOver(true)
        onEnd(next.length, idsOf(next))
      } else sfx('ok')
    } else {
      const m = miss + 1
      setMiss(m)
      if (m >= DIFF_MISSES) {
        setOver(true)
        onEnd(found.length, idsOf(found))
      } else sfx('ng')
    }
  }

  const grid = (cells: Cell[], tappable: boolean) => (
    <div className={`grid c${q.cols} diff`}>
      {cells.map((c, i) => {
        const cls = `cell ${found.includes(i) ? 'found' : ''} ${over && q.diffs.includes(i) && !found.includes(i) ? 'reveal' : ''}`
        const icon = <span style={c.flip ? { rotate: '180deg' } : undefined}><PIcon id={c.p.id} /></span>
        return tappable ? (
          <button key={i} className={cls} onClick={() => tap(i)} aria-label={`${i + 1}番目`}>
            {icon}
          </button>
        ) : (
          <div key={i} className={cls}>
            {icon}
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      <p className="hud">
        <span>
          見つけた <b>{found.length}</b> / {q.diffs.length}
        </span>
        <span>
          おてつき <b>{miss}</b> / {DIFF_MISSES}
        </span>
      </p>
      <p className="grid-label">おてほん</p>
      {grid(q.base, false)}
      <p className="grid-label tap">こちらをタップ</p>
      {grid(q.changed, true)}
    </>
  )
}

export function Diff({ products, onDone }: GameProps) {
  const r = useRounds(3, onDone, PACE.diff, DIFF.length)
  const diffs = DIFF[r.level].diffs
  return (
    <Stage
      r={r}
      question={`下の絵から、違うところを${diffs}つ見つけてください`}
      coach="上の「おてほん」と下の絵をくらべて、違うところを下の絵でタップします"
    >
      <DiffRound
        key={r.round}
        products={products}
        level={r.level}
        onEnd={(found, ids) =>
          r.answer((100 / 3) * (found / diffs), found === diffs, 1300, ids, found === diffs ? 'up' : found >= diffs - 1 ? 'keep' : 'miss')
        }
      />
    </Stage>
  )
}

/* ---------- 商品神経衰弱 ---------- */

function PairsRound({
  items,
  cols,
  previewMs,
  onReady,
  onEnd,
}: {
  items: Product[]
  cols: number
  previewMs: number
  onReady: () => void
  onEnd: (tries: number) => void
}) {
  const cards = useMemo(() => shuffle([...items, ...items]), []) // eslint-disable-line react-hooks/exhaustive-deps
  // 最初の数秒は、すべてのペアの片方だけを表にして見せる
  const shown = useMemo(() => items.map((p) => cards.indexOf(p)), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [preview, setPreview] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPreview(false)
      onReady()
    }, previewMs)
    return () => window.clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [tries, setTries] = useState(0)
  const [lock, setLock] = useState(false)

  const flip = (i: number) => {
    if (preview || lock || open.includes(i) || matched.includes(i)) return
    sfx('tap')
    const next = [...open, i]
    setOpen(next)
    if (next.length < 2) return
    const t = tries + 1
    setTries(t)
    if (cards[next[0]] === cards[next[1]]) {
      const m = [...matched, ...next]
      setMatched(m)
      setOpen([])
      if (m.length === cards.length) onEnd(t)
      else sfx('ok')
    } else {
      setLock(true)
      window.setTimeout(() => {
        setOpen([])
        setLock(false)
      }, PAIRS_FLIP_BACK_MS)
    }
  }

  return (
    <>
      {preview ? (
        <>
          <p className="hud">
            <span>表になっているカードを覚えてください</span>
          </p>
          <div className="timer">
            <i style={{ animationDuration: `${previewMs}ms` }} />
          </div>
        </>
      ) : (
        <p className="hud">
          <span>
            そろえた <b>{matched.length / 2}</b> / {items.length}
          </span>
          <span>
            めくった回数 <b>{tries}</b>
          </span>
        </p>
      )}
      <div className={`grid c${cols} pairs`}>
        {cards.map((p, i) => {
          const up = open.includes(i) || matched.includes(i) || (preview && shown.includes(i))
          return (
            <button
              key={i}
              className={`card-btn ${up ? 'up' : ''} ${matched.includes(i) ? 'matched' : ''}`}
              onClick={() => flip(i)}
              aria-label={up ? shortName(p) : `カード ${i + 1}`}
            >
              {up ? (
                <>
                  <span>
                    <PIcon id={p.id} />
                  </span>
                  <small className="card-name">{shortName(p)}</small>
                </>
              ) : (
                <i>？</i>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}

export function Pairs({ products, onDone }: GameProps) {
  const r = useRounds(3, onDone, PACE.pairs, PAIRS.length)
  const lv = PAIRS[r.level]
  const items = useMemo(() => sample(products, lv.pairs), [r.round]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => r.see(items.map((p) => p.id)), [r.round]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Stage r={r} question="同じ商品のペアをそろえてください" coach="最初に表になるカードの場所を覚えます。そのあと2枚ずつめくって、同じ商品をそろえます">
      <PairsRound
        key={r.round}
        items={items}
        cols={lv.cols}
        previewMs={lv.previewMs}
        onReady={r.startClock}
        onEnd={(tries) => {
          // 余分にめくった回数が少なければ、次はペアを増やす
          const extra = Math.max(0, tries - items.length)
          r.answer((100 / 3) * Math.max(0.3, 1 - extra / (items.length * 2)), true, 1100, undefined, extra <= items.length ? 'up' : 'keep')
        }}
      />
    </Stage>
  )
}

/* ---------- 買い物リスト暗記 ---------- */

type StoreItem = { key: string; name: string; shelf: ShelfId; productId?: string }

function MemoRound({
  products,
  n,
  perShelf,
  onEnd,
  onReady,
}: {
  products: Product[]
  n: number
  perShelf: number
  onEnd: (correctKeys: string[], productIds: string[]) => void
  onReady: () => void
}) {
  const q = useMemo(() => {
    // 呼び名が同じ商品（ふつうの袋と大袋など）は、どちらか1つだけ売り場に出す
    const names = new Set<string>()
    const promo: StoreItem[] = shuffle(products)
      .filter((p) => !names.has(shortName(p)) && !!names.add(shortName(p)))
      .map((p) => ({ key: p.id, name: shortName(p), shelf: shelfOf(p), productId: p.id }))
    const generic: StoreItem[] = SHELVES.flatMap((sh) => sh.generic.filter((g) => !names.has(g)).map((g) => ({ key: `g:${g}`, name: g, shelf: sh.id })))
    // メモの半分以上は販促商品にする
    const nPromo = Math.max(1, Math.ceil(n / 2))
    const list = shuffle([...sample(promo, nPromo), ...sample(generic, n - nPromo)])
    const shelves = Object.fromEntries(
      SHELVES.map((sh) => {
        const need = list.filter((x) => x.shelf === sh.id)
        const rest = shuffle([...promo, ...generic].filter((x) => x.shelf === sh.id && !need.includes(x)))
        return [sh.id, shuffle([...need, ...rest.slice(0, Math.max(0, perShelf - need.length))])]
      }),
    ) as Record<ShelfId, StoreItem[]>
    return { list, shelves }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const lookMs = MEMO_LOOK_BASE_MS + n * MEMO_LOOK_PER_ITEM_MS
  const [view, setView] = useState<'look' | 'map' | ShelfId>('look')
  const [cart, setCart] = useState<StoreItem[]>([])
  const [over, setOver] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setView('map')
      onReady()
    }, lookMs)
    return () => window.clearTimeout(t)
  }, [lookMs]) // eslint-disable-line react-hooks/exhaustive-deps

  if (view === 'look') {
    return (
      <div className="memo">
        <div className="timer">
          <i style={{ animationDuration: `${lookMs}ms` }} />
        </div>
        <p className="memo-head">買い物メモ</p>
        <ul>
          {q.list.map((x) => (
            <li key={x.key}>{x.name}</li>
          ))}
        </ul>
      </div>
    )
  }

  const inCart = (x: StoreItem) => cart.some((c) => c.key === x.key)
  const toggle = (x: StoreItem) => {
    if (over) return
    sfx('tap')
    setCart(inCart(x) ? cart.filter((c) => c.key !== x.key) : cart.length < n ? [...cart, x] : cart)
  }
  const checkout = () => {
    setOver(true)
    const ok = cart.filter((c) => q.list.some((x) => x.key === c.key))
    onEnd(
      ok.map((c) => c.key),
      ok.flatMap((c) => (c.productId ? [c.productId] : [])),
    )
  }
  const cartBar = (
    <div className="cart">
      <p>
        買い物かご <b>{cart.length}</b> / {n}
      </p>
      <ul>
        {cart.map((c) => (
          <li key={c.key}>
            <button onClick={() => toggle(c)} aria-label={`${c.name}をかごから出す`} disabled={over}>
              {c.name} ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )

  if (view === 'map') {
    // 売り場を上から見たところ：大きな冷凍庫が2列に並び、下にレジがある
    return (
      <>
        <div className="floor">
          <p className="floor-sign">冷凍・チルド売り場</p>
          <div className="cases">
            {SHELVES.map((sh) => {
              const count = cart.filter((c) => c.shelf === sh.id).length
              return (
                <button
                  key={sh.id}
                  className={`case ${sh.kind}`}
                  style={{ '--c': sh.color } as React.CSSProperties}
                  onClick={() => setView(sh.id)}
                  disabled={over}
                  aria-label={`${sh.name}の売り場`}
                >
                  <span className="case-sign">{sh.name}</span>
                  <span className="case-body">
                    <span className="case-glass">
                      {[0, 1, 2].map((k) => (
                        <span key={k} className="case-item">
                          <PIcon id={sh.icon} />
                        </span>
                      ))}
                    </span>
                  </span>
                  {count > 0 && <em>かごに{count}</em>}
                </button>
              )
            })}
          </div>
          <button className="checkout" disabled={cart.length !== n || over} onClick={checkout}>
            <span className="checkout-belt" aria-hidden="true" />
            <strong>レジへ進む</strong>
            <small>
              かご {cart.length} / {n}
            </small>
          </button>
        </div>
        {cartBar}
        {over && <p className="note center">メモ：{q.list.map((x) => x.name).join('、')}</p>}
      </>
    )
  }

  const shelf = SHELVES.find((sh) => sh.id === view)!
  return (
    <>
      <div className={`shelf-head ${shelf.kind}`} style={{ background: shelf.color }}>
        <button onClick={() => setView('map')} aria-label="売り場の一覧にもどる">
          ‹ 売り場
        </button>
        <strong>{shelf.name}</strong>
      </div>
      <div className="grid c3 shelf">
        {q.shelves[shelf.id].map((x) => (
          <button key={x.key} className={`tile small ${inCart(x) ? 'on' : ''}`} onClick={() => toggle(x)} aria-pressed={inCart(x)}>
            <span>{x.productId ? <PIcon id={x.productId} /> : <GenericPack color={shelf.color} />}</span>
            {x.name}
          </button>
        ))}
      </div>
      {cartBar}
      <button className="btn ghost" onClick={() => setView('map')}>
        売り場の一覧にもどる
      </button>
    </>
  )
}

export function Memo({ products, onDone }: GameProps) {
  const r = useRounds(4, onDone, PACE.memo, MEMO.length)
  const { items: n, perShelf } = MEMO[r.level]
  return (
    <Stage
      r={r}
      question="メモの商品を、売り場から探してかごに入れてください"
      coach="メモを覚えたら、冷凍庫をタップして中に入り、メモの商品をタップしてかごへ。全部入れたら「レジへ進む」"
    >
      <MemoRound
        key={r.round}
        products={products}
        n={n}
        perShelf={perShelf}
        onReady={r.startClock}
        onEnd={(keys, ids) =>
          r.answer((25 * keys.length) / n, keys.length === n, 2200, ids, keys.length === n ? 'up' : keys.length >= n - 1 && n >= 3 ? 'keep' : 'miss')
        }
      />
    </Stage>
  )
}

/* ---------- 商品名シャッフル ---------- */

function AnagramRound({ product, onEnd }: { product: Product; onEnd: (points: number, ok: boolean) => void }) {
  const chars = useMemo(() => {
    const original = [...shortName(product)]
    let s = shuffle(original)
    for (let i = 0; i < 10 && s.join('') === shortName(product); i++) s = shuffle(original)
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [picked, setPicked] = useState<number[]>([])
  const [tries, setTries] = useState(0)
  const [state, setState] = useState<'play' | 'wrong' | 'reveal' | 'done'>('play')

  const tap = (i: number) => {
    if (state !== 'play' || picked.includes(i)) return
    sfx('tap')
    const next = [...picked, i]
    setPicked(next)
    if (next.length < chars.length) return
    if (next.map((k) => chars[k]).join('') === shortName(product)) {
      setState('done')
      onEnd(tries === 0 ? 20 : 10, true)
    } else if (tries >= 1) {
      setState('reveal')
      onEnd(0, false)
    } else {
      setTries(1)
      setState('wrong')
      sfx('ng')
      window.setTimeout(() => {
        setPicked([])
        setState('play')
      }, 700)
    }
  }

  const shown = state === 'reveal' ? [...shortName(product)] : picked.map((k) => chars[k])

  return (
    <>
      <p className="hint">
        ヒント：{product.type}・{product.genre}
        {tries > 0 && <span className="hint-icon"><PIcon id={product.id} /></span>}
      </p>
      <div className={`slots-word st-${state}`}>
        {chars.map((_, i) => (
          <span key={i} className={shown[i] ? 'filled' : ''}>
            {shown[i] ?? ''}
          </span>
        ))}
      </div>
      <div className="letters">
        {chars.map((c, i) => (
          <button key={i} disabled={picked.includes(i) || state !== 'play'} onClick={() => tap(i)}>
            {c}
          </button>
        ))}
      </div>
      <button className="btn ghost" disabled={picked.length === 0 || state !== 'play'} onClick={() => setPicked(picked.slice(0, -1))}>
        1文字もどす
      </button>
      {tries > 0 && state === 'play' && <p className="note center">もう1回だけ挑戦できます</p>}
    </>
  )
}

export function Anagram({ products, onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.anagram)
  const picks = useMemo(() => {
    const s = sample(products, 5)
    while (s.length < 5) s.push(products[randInt(products.length)])
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const product = picks[r.round]
  useEffect(() => r.see([product.id]), [r.round]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Stage r={r} question="文字を順番にタップして、商品名を作ってください" coach="下の黄色い文字を、商品名の順にタップします。まちがえたら「1文字もどす」">
      <AnagramRound key={r.round} product={product} onEnd={(pts, ok) => r.answer(pts, ok, ok ? 900 : 1700)} />
    </Stage>
  )
}
