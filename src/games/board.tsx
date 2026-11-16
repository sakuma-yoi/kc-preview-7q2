// 盤面を操作する脳トレ：間違い探し・商品神経衰弱・買い物リスト暗記・商品名の並べ替え

import { useEffect, useMemo, useState } from 'react'
import { PIcon } from '../components/PIcon'
import { shortName, type Product } from '../data/products'
import { sfx } from '../lib/sfx'
import { randInt, sample, shuffle } from '../lib/util'
import { Stage, useRounds, type GameProps } from './common'

/* ---------- 間違い探し ---------- */

type Cell = { p: Product; flip?: boolean }

function DiffRound({ products, level, onEnd }: { products: Product[]; level: number; onEnd: (found: number, ids: string[]) => void }) {
  const q = useMemo(() => {
    const cols = [3, 4, 4][level]
    const n = [9, 12, 16][level]
    const pool = sample(products, Math.min(6, products.length))
    const base: Cell[] = Array.from({ length: n }, () => ({ p: pool[randInt(pool.length)] }))
    const diffs = sample(
      base.map((_, i) => i),
      3,
    )
    const changed = base.map((c) => ({ ...c }))
    diffs.forEach((i, k) => {
      // 最後の問題では、1つだけ「さかさま」の違いを入れる
      if (level === 2 && k === 0) changed[i].flip = true
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
      if (next.length === 3) {
        setOver(true)
        onEnd(3, idsOf(next))
      } else sfx('ok')
    } else {
      const m = miss + 1
      setMiss(m)
      if (m >= 3) {
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
          見つけた <b>{found.length}</b> / 3
        </span>
        <span>
          おてつき <b>{miss}</b> / 3
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
  const r = useRounds(3, onDone, { fast: 8, slow: 35 })
  return (
    <Stage r={r} question="下の絵から、違うところを3つ見つけてください">
      <DiffRound
        key={r.round}
        products={products}
        level={r.round}
        onEnd={(found, ids) => r.answer((found * 100) / 9, found === 3, 1300, ids)}
      />
    </Stage>
  )
}

/* ---------- 商品神経衰弱 ---------- */

function PairsRound({ items, onEnd }: { items: Product[]; onEnd: (tries: number) => void }) {
  const cards = useMemo(() => shuffle([...items, ...items]), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [tries, setTries] = useState(0)
  const [lock, setLock] = useState(false)

  const flip = (i: number) => {
    if (lock || open.includes(i) || matched.includes(i)) return
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
      }, 850)
    }
  }

  return (
    <>
      <p className="hud">
        <span>
          そろえた <b>{matched.length / 2}</b> / {items.length}
        </span>
        <span>
          めくった回数 <b>{tries}</b>
        </span>
      </p>
      <div className="grid c4 pairs">
        {cards.map((p, i) => {
          const up = open.includes(i) || matched.includes(i)
          return (
            <button
              key={i}
              className={`card-btn ${up ? 'up' : ''} ${matched.includes(i) ? 'matched' : ''}`}
              onClick={() => flip(i)}
              aria-label={up ? shortName(p) : `カード ${i + 1}`}
            >
              {up ? <span><PIcon id={p.id} /></span> : <i>？</i>}
            </button>
          )
        })}
      </div>
    </>
  )
}

export function Pairs({ products, onDone }: GameProps) {
  const r = useRounds(2, onDone, { fast: 15, slow: 50 })
  const sets = useMemo(() => [sample(products, 4), sample(products, 6)], []) // eslint-disable-line react-hooks/exhaustive-deps
  const items = sets[r.round]
  useEffect(() => r.see(items.map((p) => p.id)), [r.round]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Stage r={r} question="同じ商品のペアをそろえてください">
      <PairsRound
        key={r.round}
        items={items}
        onEnd={(tries) => {
          const extra = Math.max(0, tries - items.length)
          r.answer(50 * Math.max(0.3, 1 - extra / (items.length * 2)), true, 1100)
        }}
      />
    </Stage>
  )
}

/* ---------- 買い物リスト暗記 ---------- */

function MemoRound({ products, n, onEnd, onReady }: { products: Product[]; n: number; onEnd: (correct: string[]) => void; onReady: () => void }) {
  const q = useMemo(() => {
    const pool = shuffle(products)
    const list = pool.slice(0, n)
    return { list, shelf: shuffle([...list, ...pool.slice(n, 9)]) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const lookMs = 2500 + n * 700
  const [look, setLook] = useState(true)
  const [picked, setPicked] = useState<string[]>([])
  const [over, setOver] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setLook(false)
      onReady()
    }, lookMs)
    return () => window.clearTimeout(t)
  }, [lookMs]) // eslint-disable-line react-hooks/exhaustive-deps

  if (look) {
    return (
      <div className="memo">
        <div className="timer">
          <i style={{ animationDuration: `${lookMs}ms` }} />
        </div>
        <p className="memo-head">買い物メモ</p>
        <ul>
          {q.list.map((p) => (
            <li key={p.id}>{shortName(p)}</li>
          ))}
        </ul>
      </div>
    )
  }

  const toggle = (id: string) => {
    if (over) return
    sfx('tap')
    setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : picked.length < n ? [...picked, id] : picked)
  }

  return (
    <>
      <p className="hud">
        <span>
          えらんだ数 <b>{picked.length}</b> / {n}
        </span>
      </p>
      <div className="grid c3 shelf">
        {q.shelf.map((p) => {
          const inList = q.list.includes(p)
          return (
            <button
              key={p.id}
              className={`tile small ${picked.includes(p.id) ? 'on' : ''} ${over && inList ? 'reveal' : ''}`}
              onClick={() => toggle(p.id)}
              aria-pressed={picked.includes(p.id)}
            >
              <span><PIcon id={p.id} /></span>
              {shortName(p)}
            </button>
          )
        })}
      </div>
      <button
        className="btn play"
        disabled={picked.length !== n || over}
        onClick={() => {
          setOver(true)
          onEnd(picked.filter((id) => q.list.some((p) => p.id === id)))
        }}
      >
        これで決定
      </button>
    </>
  )
}

export function Memo({ products, onDone }: GameProps) {
  const r = useRounds(4, onDone, { fast: 3, slow: 12 })
  const n = [3, 3, 4, 5][r.round]
  return (
    <Stage r={r} question="メモにあった商品を、全部えらんでください">
      <MemoRound
        key={r.round}
        products={products}
        n={n}
        onReady={r.startClock}
        onEnd={(ids) => r.answer((25 * ids.length) / n, ids.length === n, 1500, ids)}
      />
    </Stage>
  )
}

/* ---------- 商品名の並べ替え ---------- */

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
  const r = useRounds(5, onDone, { fast: 4, slow: 16 })
  const picks = useMemo(() => {
    const s = sample(products, 5)
    while (s.length < 5) s.push(products[randInt(products.length)])
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const product = picks[r.round]
  useEffect(() => r.see([product.id]), [r.round]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Stage r={r} question="文字を順番にタップして、商品名を作ってください">
      <AnagramRound key={r.round} product={product} onEnd={(pts, ok) => r.answer(pts, ok, ok ? 900 : 1700)} />
    </Stage>
  )
}
