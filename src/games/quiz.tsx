// 4択で答える脳トレ：冷凍庫の中身記憶・お会計チャレンジ・レンジ時間の計算・仲間はずれ探し

import { useEffect, useMemo, useState } from 'react'
import { PIcon } from '../components/PIcon'
import { ODDONE_LATE } from '../data/config'
import { shortName } from '../data/products'
import { sfx } from '../lib/sfx'
import { minSec, randInt, sample, shuffle, yen } from '../lib/util'
import { FREEZER, ODDONE, PACE, RANGE, REGISTER } from '../data/levels'
import { numberChoices, Stage, useRounds, type GameProps } from './common'

/** 冷凍庫の中身記憶 */
export function Freezer({ products, onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.freezer, FREEZER.length)
  const q = useMemo(() => {
    const lv = FREEZER[r.level]
    const pool = shuffle(products)
    const inside = pool.slice(0, lv.items)
    const outside = pool.slice(lv.items)
    const askInside = !lv.askOutside || Math.random() < 0.5
    const correct = askInside ? inside[0] : outside[0]
    const others = askInside ? outside.slice(0, lv.choices - 1) : inside.slice(0, lv.choices - 1)
    return { inside, askInside, correct, lookMs: lv.lookSec * 1000, choices: shuffle([correct, ...others]) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.round])
  const [open, setOpen] = useState(true)
  const [picked, setPicked] = useState<string | null>(null)

  useEffect(() => {
    setOpen(true)
    setPicked(null)
    r.see([q.correct.id])
    const t = window.setTimeout(() => {
      setOpen(false)
      r.startClock()
    }, q.lookMs)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <Stage
      r={r}
      question={
        open ? (
          '冷凍庫の中身を覚えてください'
        ) : q.askInside ? (
          <>
            冷凍庫に<b>入っていた</b>のはどれ？
          </>
        ) : (
          <>
            冷凍庫に<b>入っていなかった</b>のはどれ？
          </>
        )
      }
    >
      {open ? (
        <div className="fz">
          <div className="timer" key={r.round}>
            <i style={{ animationDuration: `${q.lookMs}ms` }} />
          </div>
          <ul className={`fz-items n${q.inside.length}`}>
            {q.inside.map((p) => (
              <li key={p.id}>
                <span><PIcon id={p.id} /></span>
                {shortName(p)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="fz closed" aria-hidden="true">
            <span className="fz-handle" />
          </div>
          <div className="choices two">
            {q.choices.map((p) => (
              <button
                key={p.id}
                className={`tile ${picked && p === q.correct ? 'reveal' : ''} ${picked === p.id && p !== q.correct ? 'miss' : ''}`}
                onClick={() => {
                  if (picked) return
                  setPicked(p.id)
                  r.answer(p === q.correct ? 20 : 0, p === q.correct, p === q.correct ? 900 : 1700)
                }}
              >
                <span><PIcon id={p.id} /></span>
                {shortName(p)}
              </button>
            ))}
          </div>
        </>
      )}
    </Stage>
  )
}

/** お会計チャレンジ */
export function Register({ products, onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.register, REGISTER.length)
  const q = useMemo(() => {
    const lv = REGISTER[r.level]
    const items = sample(products, Math.min(lv.items, products.length))
    const total = items.reduce((s, p) => s + p.price, 0)
    return { items, total, choices: numberChoices(total, lv.gaps, 10) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.round])
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => {
    setPicked(null)
    r.see(q.items.map((p) => p.id))
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Stage r={r} question="合計はいくら？">
      <div className="receipt">
        <p className="receipt-head">レシート</p>
        <ul>
          {q.items.map((p) => (
            <li key={p.id}>
              <span><PIcon id={p.id} /></span>
              <em>{shortName(p)}</em>
              <b>{yen(p.price)}</b>
            </li>
          ))}
        </ul>
        <p className="receipt-total">
          合計 <b>{picked === null ? '？？？円' : yen(q.total)}</b>
        </p>
      </div>
      <div className="choices two">
        {q.choices.map((c) => (
          <button
            key={c}
            className={`tile num ${picked !== null && c === q.total ? 'reveal' : ''} ${picked === c && c !== q.total ? 'miss' : ''}`}
            onClick={() => {
              if (picked !== null) return
              setPicked(c)
              r.answer(c === q.total ? 20 : 0, c === q.total, c === q.total ? 900 : 1700)
            }}
          >
            {yen(c)}
          </button>
        ))}
      </div>
    </Stage>
  )
}

/** レンジ時間の計算 */
export function Range({ products, onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.range, RANGE.length)
  const q = useMemo(() => {
    const lv = RANGE[r.level]
    const pool = products.filter((p) => p.rangeSec)
    const items = sample(pool, Math.min(lv.items, pool.length))
    const total = items.reduce((s, p) => s + (p.rangeSec ?? 0), 0)
    return { items, total, choices: numberChoices(total, lv.gaps, 10) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.round])
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => {
    setPicked(null)
    r.see(q.items.map((p) => p.id))
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Stage r={r} question="温め時間は、全部で何分何秒？">
      <ul className="range-list">
        {q.items.map((p) => (
          <li key={p.id}>
            <span><PIcon id={p.id} /></span>
            <em>{shortName(p)}</em>
            <b>{minSec(p.rangeSec ?? 0)}</b>
          </li>
        ))}
      </ul>
      <div className="choices two">
        {q.choices.map((c) => (
          <button
            key={c}
            className={`tile num ${picked !== null && c === q.total ? 'reveal' : ''} ${picked === c && c !== q.total ? 'miss' : ''}`}
            onClick={() => {
              if (picked !== null) return
              setPicked(c)
              r.answer(c === q.total ? 20 : 0, c === q.total, c === q.total ? 900 : 1700)
            }}
          >
            {minSec(c)}
          </button>
        ))}
      </div>
    </Stage>
  )
}

/** 仲間はずれ探し */
export function OddOne({ products, onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.oddone, ODDONE.length)
  const q = useMemo(() => {
    const lv = ODDONE[r.level]
    const [a, b] = sample(products, 2)
    return { a, b, colorOnly: lv.subtle, hue: lv.hue, cells: lv.cells, cols: lv.cols, odd: randInt(lv.cells) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.round])
  useEffect(() => r.see(q.colorOnly ? [q.a.id] : [q.a.id, q.b.id]), [q]) // eslint-disable-line react-hooks/exhaustive-deps
  // 2回まで押せる。2回目の正解は半分の点
  const [wrong, setWrong] = useState<number[]>([])
  const [over, setOver] = useState(false)
  useEffect(() => {
    setWrong([])
    setOver(false)
  }, [r.round])

  return (
    <Stage
      r={r}
      question={!q.colorOnly ? '1つだけ違う商品はどれ？' : ODDONE_LATE === 'color' ? '色が1つだけ違います。どれ？' : '1つだけ さかさまです。どれ？'}
    >
      <p className="hud">
        <span>{wrong.length > 0 && !over ? 'おしい！もう1回だけ押せます' : '2回まで押せます'}</span>
      </p>
      <div className={`grid c${q.cols}`}>
        {Array.from({ length: q.cells }, (_, i) => {
          const odd = i === q.odd
          return (
            <button
              key={i}
              className={`cell ${over && odd ? 'reveal' : ''} ${wrong.includes(i) ? 'miss' : ''}`}
              aria-label={`${i + 1}番目`}
              onClick={() => {
                if (over || wrong.includes(i)) return
                if (odd) {
                  setOver(true)
                  // 2回目で正解したときは、レベルはそのまま
                  r.answer(wrong.length > 0 ? 10 : 20, true, 900, undefined, wrong.length > 0 ? 'keep' : 'up')
                } else if (wrong.length > 0) {
                  setWrong([...wrong, i])
                  setOver(true)
                  r.answer(0, false, 1700)
                } else {
                  setWrong([i])
                  sfx('ng')
                }
              }}
            >
              <span
                style={
                  odd && q.colorOnly
                    ? ODDONE_LATE === 'color'
                      ? { filter: `hue-rotate(${q.hue}deg) saturate(1.3)` }
                      : { rotate: '180deg' }
                    : undefined
                }
              >
                <PIcon id={odd && !q.colorOnly ? q.b.id : q.a.id} />
              </span>
            </button>
          )
        })}
      </div>
    </Stage>
  )
}
