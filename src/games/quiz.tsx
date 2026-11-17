// 4択で答える脳トレ：お弁当の具材記憶・お会計チャレンジ・レンジ時間の計算・仲間はずれ探し

import { useEffect, useMemo, useState } from 'react'
import { PIcon } from '../components/PIcon'
import { ODDONE_LATE } from '../data/config'
import { shortName, type Product } from '../data/products'
import { sfx } from '../lib/sfx'
import { minSec, randInt, sample, shuffle, yen } from '../lib/util'
import { FREEZER, ODDONE, PACE, RANGE, REGISTER, REGISTER_SCAN_MS } from '../data/levels'
import { numberChoices, Stage, useRounds, type GameProps } from './common'

/** お弁当の箱：左にごはん、右に仕切られたおかず。closed でふたが閉まる */
function BentoBox({ items, closed }: { items: Product[]; closed: boolean }) {
  return (
    <div className={`bento ${closed ? 'closed' : ''}`}>
      <div className="bento-box">
        <div className="bento-rice" aria-hidden="true">
          <span className="ume" />
        </div>
        <div className={`bento-sides n${items.length}`}>
          {items.map((p) => (
            // 名前は出さず、絵だけで覚える（読み上げ用の名前だけ持たせる）
            <div key={p.id} className="bento-cell" role="img" aria-label={shortName(p)}>
              <span>
                <PIcon id={p.id} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="bento-lid" aria-hidden="true">
        <span className="lid-band" />
      </div>
    </div>
  )
}

/** お弁当の具材記憶（id は以前の「冷凍庫の中身記憶」のまま） */
export function Bento({ products, onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.freezer, FREEZER.length)
  const q = useMemo(() => {
    const lv = FREEZER[r.level]
    const pool = shuffle(products)
    const inside = pool.slice(0, lv.items)
    const outside = pool.slice(lv.items)
    const askInside = !lv.askOutside || Math.random() < 0.5
    const correct = askInside ? inside[0] : outside[0]
    const others = askInside ? outside.slice(0, lv.choices - 1) : inside.slice(0, lv.choices - 1)
    return { inside: shuffle(inside), askInside, correct, lookMs: lv.lookSec * 1000, choices: shuffle([correct, ...others]) }
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
          'お弁当の中身を覚えてください'
        ) : q.askInside ? (
          <>
            お弁当に<b>入っていた</b>のはどれ？
          </>
        ) : (
          <>
            お弁当に<b>入っていなかった</b>のはどれ？
          </>
        )
      }
    >
      {open && (
        <div className="timer" key={r.round}>
          <i style={{ animationDuration: `${q.lookMs}ms` }} />
        </div>
      )}
      <BentoBox items={q.inside} closed={!open} />
      {!open && (
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
              <span>
                <PIcon id={p.id} />
              </span>
              {shortName(p)}
            </button>
          ))}
        </div>
      )}
    </Stage>
  )
}

/** お会計チャレンジ：レジで商品を1つずつ読み取り、合計を答える */
export function Register({ products, onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.register, REGISTER.length)
  const q = useMemo(() => {
    const lv = REGISTER[r.level]
    const items = sample(products, Math.min(lv.items, products.length))
    const total = items.reduce((s, p) => s + p.price, 0)
    if (lv.band) {
      // 「何百円台？」：正解を含む、となり合った4つの百円台
      const base = Math.floor(total / 100) * 100
      let start = base - 100 * randInt(4)
      while (start < 0) start += 100
      return { items, total, band: true, correct: base, choices: [0, 1, 2, 3].map((k) => start + k * 100) }
    }
    return { items, total, band: false, correct: total, choices: numberChoices(total, lv.gaps, 10) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.round])
  const [picked, setPicked] = useState<number | null>(null)
  const [scanned, setScanned] = useState(0)
  useEffect(() => {
    setPicked(null)
    setScanned(0)
    r.see(q.items.map((p) => p.id))
    let n = 0
    const t = window.setInterval(() => {
      n += 1
      setScanned(n)
      sfx('scan')
      if (n >= q.items.length) {
        window.clearInterval(t)
        r.startClock()
      }
    }, REGISTER_SCAN_MS)
    return () => window.clearInterval(t)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = scanned >= q.items.length
  const last = q.items[scanned - 1]
  const label = (c: number) => (q.band ? `${c.toLocaleString('ja-JP')}円台` : yen(c))

  return (
    <Stage r={r} question={!done ? 'レジに通しています…' : q.band ? '合計は、何円台？' : '合計はいくら？'}>
      <div className="register">
        <div className="reg-display" aria-live="polite">
          {last ? (
            <>
              <span>{shortName(last)}</span>
              <b>{yen(last.price)}</b>
            </>
          ) : (
            <span>いらっしゃいませ</span>
          )}
        </div>
        <div className="receipt">
          <p className="receipt-head">レシート</p>
          <ul>
            {q.items.slice(0, scanned).map((p) => (
              <li key={p.id} className="scan-in">
                <span>
                  <PIcon id={p.id} />
                </span>
                <em>{shortName(p)}</em>
                <b>{yen(p.price)}</b>
              </li>
            ))}
          </ul>
          <p className="receipt-total">
            合計 <b>{picked === null ? '？？？円' : yen(q.total)}</b>
          </p>
        </div>
      </div>
      {done && (
        <div className="choices two">
          {q.choices.map((c) => (
            <button
              key={c}
              className={`tile num ${picked !== null && c === q.correct ? 'reveal' : ''} ${picked === c && c !== q.correct ? 'miss' : ''}`}
              onClick={() => {
                if (picked !== null) return
                setPicked(c)
                r.answer(c === q.correct ? 20 : 0, c === q.correct, c === q.correct ? 1000 : 1800)
              }}
            >
              {label(c)}
            </button>
          ))}
        </div>
      )}
    </Stage>
  )
}

/** レンジ時間の計算：パッケージの W数と時間から、家のレンジの W数での時間を答える */
export function Range({ products, onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.range, RANGE.length)
  const q = useMemo(() => {
    const lv = RANGE[r.level]
    const pool = products.filter((p) => p.rangeSec)
    const p = sample(pool.length ? pool : products, 1)[0]
    const [from, to] = lv.watts[randInt(lv.watts.length)]
    // 答えが10秒単位になる時間だけを使う
    const times: number[] = []
    for (let t = 60; t <= 360; t += 10) if ((t * from) % (to * 10) === 0) times.push(t)
    const t1 = times.length ? times[randInt(times.length)] : 120
    const ans = Math.round((t1 * from) / to)
    return { p, from, to, t1, ans, hint: lv.hint, choices: numberChoices(ans, lv.gaps, 10) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.round])
  // 自分で時間を入れる。0分0秒から
  const [value, setValue] = useState(0)
  const [done, setDone] = useState(false)
  useEffect(() => {
    setValue(0)
    setDone(false)
    r.see([q.p.id])
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps
  const add = (d: number) => {
    if (done) return
    sfx('tap')
    setValue((v) => Math.min(30 * 60, Math.max(0, v + d)))
  }
  const ok = value === q.ans

  return (
    <Stage
      r={r}
      question={
        <>
          家のレンジは<b>{q.to}W</b>。何分何秒あたためる？
        </>
      }
    >
      <div className="range-pack">
        <span className="range-icon">
          <PIcon id={q.p.id} />
        </span>
        <div>
          <p className="range-name">{shortName(q.p)}</p>
          <p className="range-label">
            電子レンジ <b>{q.from}W</b> で <b>{minSec(q.t1)}</b>
          </p>
        </div>
      </div>
      {q.hint && <p className="hint">W数が大きいほど、あたためる時間は短くなります</p>}
      <div className={`timer-set ${done ? (ok ? 'right' : 'wrong') : ''}`}>
        <div className="ts-col">
          <button onClick={() => add(60)} aria-label="1分ふやす" disabled={done}>
            ＋
          </button>
          <p>
            <b>{Math.floor(value / 60)}</b>分
          </p>
          <button onClick={() => add(-60)} aria-label="1分へらす" disabled={done}>
            −
          </button>
        </div>
        <div className="ts-col">
          <button onClick={() => add(10)} aria-label="10秒ふやす" disabled={done}>
            ＋
          </button>
          <p>
            <b>{String(value % 60).padStart(2, '0')}</b>秒
          </p>
          <button onClick={() => add(-10)} aria-label="10秒へらす" disabled={done}>
            −
          </button>
        </div>
      </div>
      {done ? (
        <p className="note center">
          {minSec(q.t1)} × {q.from} ÷ {q.to} ＝ <b>{minSec(q.ans)}</b>
        </p>
      ) : (
        <button
          className="btn play"
          onClick={() => {
            setDone(true)
            r.answer(ok ? 20 : 0, ok, ok ? 1000 : 2200)
          }}
        >
          この時間であたためる
        </button>
      )}
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
