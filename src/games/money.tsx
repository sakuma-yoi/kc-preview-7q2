// お金を使う脳トレ：お釣りマスター・割引計算・損得勘定

import { useEffect, useMemo, useRef, useState } from 'react'
import { PIcon } from '../components/PIcon'
import { CHANGE, CHANGE_PENALTY, DISCOUNT, PACE, VALUE } from '../data/levels'
import { PRODUCTS, shortName } from '../data/products'
import { amountLabel, VALUE_KINDS } from '../data/value'
import { sfx } from '../lib/sfx'
import { randInt, sample, shuffle, yen } from '../lib/util'
import { numberChoices, Stage, useRounds, type GameProps } from './common'

/* ---------- お釣りマスター ---------- */

const DENOMS = [5000, 1000, 500, 100, 50, 10, 5, 1]

/** その金額を、いちばん少ない枚数で表したときの内訳 */
function breakdown(amount: number): number[] {
  const out: number[] = []
  let a = amount
  for (const d of DENOMS) {
    while (a >= d) {
      out.push(d)
      a -= d
    }
  }
  return out
}

/** 「出す枚数＋お釣りの枚数」がいちばん少なくなる払い方 */
function bestPay(price: number) {
  let best = { pay: price, total: Infinity }
  for (let pay = price; pay < price + 10000; pay++) {
    const total = breakdown(pay).length + breakdown(pay - price).length
    if (total < best.total) best = { pay, total }
  }
  return best
}

const money = (d: number) => (d >= 1000 ? `${d / 1000}千円` : `${d}円`)

export function Change({ products, onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.change, CHANGE.length)
  const q = useMemo(() => {
    const lv = CHANGE[r.level]
    const items = sample(products, Math.min(lv.items, products.length))
    const sum = items.reduce((s, p) => s + p.price, 0)
    const price = lv.tax ? Math.floor(sum * 1.08) : sum
    return { items, price, tax: lv.tax, best: bestPay(price) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.round])
  const [tray, setTray] = useState<number[]>([])
  const [result, setResult] = useState<null | { given: number; change: number; total: number }>(null)
  useEffect(() => {
    setTray([])
    setResult(null)
    r.see(q.items.map((p) => p.id))
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const paid = tray.reduce((s, d) => s + d, 0)
  const counts = DENOMS.map((d) => [d, tray.filter((x) => x === d).length] as const).filter(([, n]) => n > 0)

  const pay = () => {
    const change = breakdown(paid - q.price).length
    const total = tray.length + change
    const extra = total - q.best.total
    setResult({ given: tray.length, change, total })
    // いちばん少ない枚数と同じなら◎、1枚多いと○、2枚で△、それ以上は✕
    const grade = extra === 0 ? 'great' : extra === 1 ? 'good' : extra === 2 ? 'fair' : 'bad'
    r.answer(Math.max(5, 20 - CHANGE_PENALTY * extra), grade, 2800)
  }

  return (
    <Stage r={r} question="出す枚数とお釣りの枚数が、合わせていちばん少なくなるように払ってください">
      <div className="reg-display big">
        <span>
          お会計{q.tax && <small>（税込）</small>}
        </span>
        <b>{yen(q.price)}</b>
      </div>
      <p className="items-line">
        {q.items.map((p) => (
          <span key={p.id}>
            <PIcon id={p.id} />
            {shortName(p)}
          </span>
        ))}
      </p>

      <div className="tray" aria-label="出すお金">
        {counts.length === 0 ? (
          <span className="tray-empty">下のお金をタップして出します</span>
        ) : (
          counts.map(([d, n]) => (
            <button key={d} className={`money ${d >= 1000 ? 'bill' : 'coin'} m${d}`} onClick={() => !result && setTray(tray.filter((x, i) => !(x === d && i === tray.lastIndexOf(d))))} aria-label={`${d}円を1枚もどす`}>
              {money(d)}
              {n > 1 && <em>×{n}</em>}
            </button>
          ))
        )}
      </div>
      <p className="hud">
        <span>
          出した金額 <b>{yen(paid)}</b>（{tray.length}枚）
        </span>
        <span>{paid < q.price ? `あと${yen(q.price - paid)}` : `お釣り ${yen(paid - q.price)}`}</span>
      </p>

      {result ? (
        <div className="change-result">
          <p>
            出した {result.given}枚 ＋ お釣り {result.change}枚 ＝ <b>{result.total}枚</b>
          </p>
          <p>
            いちばん少ないのは <b>{q.best.total}枚</b>：{yen(q.best.pay)}出して、お釣り{yen(q.best.pay - q.price)}
          </p>
        </div>
      ) : (
        <>
          <div className="wallet-grid">
            {DENOMS.map((d) => (
              <button
                key={d}
                className={`money ${d >= 1000 ? 'bill' : 'coin'} m${d}`}
                onClick={() => {
                  sfx('coin')
                  setTray([...tray, d])
                }}
              >
                {money(d)}
              </button>
            ))}
          </div>
          <div className="ops-pair">
            <button className="btn ghost" disabled={tray.length === 0} onClick={() => setTray([])}>
              やり直す
            </button>
            <button className="btn play" disabled={paid < q.price} onClick={pay}>
              これで払う
            </button>
          </div>
        </>
      )}
    </Stage>
  )
}

/* ---------- 割引計算 ---------- */

type Sticker = { text: string; color: 'red' | 'yellow' }

export function Discount({ products, onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.discount, DISCOUNT.length)
  const q = useMemo(() => {
    const lv = DISCOUNT[r.level]
    for (let tries = 0; tries < 50; tries++) {
      const p = sample(products, 1)[0]
      const kind = lv.kinds[randInt(lv.kinds.length)]
      const price = p.price
      const stickers: Sticker[] = []
      const mistakes: number[] = []
      let ans: number
      if (kind === 'half') {
        ans = price / 2
        stickers.push({ text: '半額', color: 'red' })
        mistakes.push(price - 50)
      } else if (kind === 'yen') {
        const y = lv.yen[randInt(lv.yen.length)]
        ans = price - y
        stickers.push({ text: `${y}円引`, color: 'yellow' })
      } else {
        const pcts = kind === 'wari' ? lv.pct.filter((x) => x % 10 === 0) : lv.pct
        if (!pcts.length) continue
        const x = pcts[randInt(pcts.length)]
        if ((price * x) % 100 !== 0) continue
        ans = (price * (100 - x)) / 100
        stickers.push({ text: kind === 'wari' ? `${x / 10}割引` : `${x}%OFF`, color: 'red' })
        mistakes.push(price - x, (price * x) / 100)
        if (kind === 'double') {
          const y = lv.yen[randInt(lv.yen.length)]
          ans -= y
          stickers.push({ text: `さらに${y}円引`, color: 'yellow' })
          mistakes.push(price - y - x)
        }
      }
      if (ans <= 0) continue
      // よくあるまちがい（割引額そのもの、％を円と読む など）を1つ混ぜる
      const trap = mistakes.find((m) => m > 0 && m !== ans)
      let choices = numberChoices(ans, lv.gaps, 10)
      if (trap !== undefined && !choices.includes(trap)) choices = shuffle([...choices.filter((c) => c !== ans).slice(0, 2), trap, ans])
      return { p, price, ans, stickers, choices }
    }
    const p = products[0]
    return { p, price: p.price, ans: p.price / 2, stickers: [{ text: '半額', color: 'red' as const }], choices: numberChoices(p.price / 2, [50, 100], 10) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.round])
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => {
    setPicked(null)
    r.see([q.p.id])
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Stage r={r} question="割引のあとのお値段は？">
      <div className="sale-card">
        <div className="sale-pic">
          <PIcon id={q.p.id} />
          <div className="stickers">
            {q.stickers.map((s) => (
              <span key={s.text} className={`sticker ${s.color}`}>
                {s.text}
              </span>
            ))}
          </div>
        </div>
        <div className="price-tag">
          <span>{shortName(q.p)}</span>
          <b>{yen(q.price)}</b>
        </div>
      </div>
      <p className="note center">
        <small>1円未満は出ません</small>
      </p>
      <div className="choices two">
        {q.choices.map((c) => (
          <button
            key={c}
            className={`tile num ${picked !== null && c === q.ans ? 'reveal' : ''} ${picked === c && c !== q.ans ? 'miss' : ''}`}
            onClick={() => {
              if (picked !== null) return
              setPicked(c)
              r.answer(c === q.ans ? 20 : 0, c === q.ans, c === q.ans ? 900 : 1800)
            }}
          >
            {yen(c)}
          </button>
        ))}
      </div>
    </Stage>
  )
}

/* ---------- 損得勘定 ---------- */

const PROMO_IDS = new Set(PRODUCTS.map((p) => p.id))
const per100 = (price: number, size: number) => (price * 100) / size

export function Value({ onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.value, VALUE.length)
  const q = useMemo(() => {
    const lv = VALUE[r.level]
    for (let tries = 0; tries < 60; tries++) {
      const kind = VALUE_KINDS[randInt(VALUE_KINDS.length)]
      const sizes = sample(kind.sizes, lv.options).sort((a, b) => a - b)
      const gap = lv.gap[0] + Math.random() * (lv.gap[1] - lv.gap[0])
      const bestUnit = kind.per100 * (0.85 + Math.random() * 0.25)
      const units = [bestUnit, bestUnit * (1 + gap), bestUnit * (1 + gap) * (1.08 + Math.random() * 0.25)].slice(0, lv.options)
      const order = shuffle(sizes.map((_, i) => i)) // どの大きさがいちばんお得か
      const opts = sizes.map((size, i) => {
        const raw = (units[order[i]] * size) / 100
        const price = Math.max(98, Math.round(raw / 10) * 10 - 2) // 〇〇8円にする
        return { size, price, unit: per100(price, size) }
      })
      const sorted = [...opts].sort((a, b) => a.unit - b.unit)
      if (sorted[1].unit / sorted[0].unit - 1 < lv.gap[0] * 0.7) continue
      return { kind, opts, best: sorted[0], timeMs: lv.timeSec * 1000 }
    }
    const kind = VALUE_KINDS[0]
    const opts = [
      { size: 2000, price: 1298, unit: per100(1298, 2000) },
      { size: 5000, price: 1998, unit: per100(1998, 5000) },
    ]
    return { kind, opts, best: opts[1], timeMs: 10000 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.round])
  const [picked, setPicked] = useState<number | null>(null)
  const [timeUp, setTimeUp] = useState(false)
  const answered = useRef(false)
  useEffect(() => {
    setPicked(null)
    setTimeUp(false)
    answered.current = false
    if (PROMO_IDS.has(q.kind.icon)) r.see([q.kind.icon])
    // 時間切れは不正解
    const t = window.setTimeout(() => {
      if (answered.current) return
      answered.current = true
      setTimeUp(true)
      r.answer(0, false, 2600)
    }, q.timeMs)
    return () => window.clearTimeout(t)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const unitWord = q.kind.unit === 'g' ? '100g' : '100ml'
  const done = picked !== null || timeUp

  return (
    <Stage r={r} question="どれがいちばんお得？">
      <div className="timer" key={r.round}>
        <i style={{ animationDuration: `${q.timeMs}ms`, animationPlayState: done ? 'paused' : 'running' }} />
      </div>
      <div className={`value-row n${q.opts.length}`}>
        {q.opts.map((o, i) => {
          const isBest = o === q.best
          return (
            <button
              key={o.size}
              className={`value-card ${done && isBest ? 'reveal' : ''} ${picked === i && !isBest ? 'miss' : ''}`}
              onClick={() => {
                if (done || answered.current) return
                answered.current = true
                setPicked(i)
                r.answer(isBest ? 20 : 0, isBest, 2600)
              }}
            >
              <span className="value-icon" style={{ fontSize: `${36 + i * 8}px` }}>
                <PIcon id={q.kind.icon} />
              </span>
              <strong>{q.kind.name}</strong>
              <span className="value-size">{amountLabel(o.size, q.kind.unit)}</span>
              <span className="value-price">{yen(o.price)}</span>
              {done && (
                <span className="value-unit">
                  {unitWord}あたり
                  <b>{o.unit.toFixed(1)}円</b>
                </span>
              )}
            </button>
          )
        })}
      </div>
      {timeUp && <p className="note center">時間切れ！</p>}
    </Stage>
  )
}
