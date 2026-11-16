import { useState } from 'react'
import { addDays, dateKey } from '../lib/date'
import { today, useStore } from '../store'

const W = 320
const H = 150
const PAD = { l: 34, r: 30, t: 14, b: 24 }
const MIN = 20
const MAX = 70

/** 冷凍庫脳年齢の推移（その日に遊んだ回の平均）。週＝7日、月＝30日 */
export function AgeChart() {
  const { state } = useStore()
  const [span, setSpan] = useState<7 | 30>(7)
  const [sel, setSel] = useState<number | null>(null)

  const now = today(state)
  const days = Array.from({ length: span }, (_, i) => {
    const d = addDays(now, i - (span - 1))
    const rec = state.ages[dateKey(d)]
    return { d, age: rec ? Math.round(rec.sum / rec.n) : null }
  })
  const points = days.map((p, i) => ({ ...p, i })).filter((p) => p.age !== null) as { d: Date; age: number; i: number }[]

  const x = (i: number) => PAD.l + (i / (span - 1)) * (W - PAD.l - PAD.r)
  const y = (age: number) => PAD.t + ((MAX - Math.min(MAX, Math.max(MIN, age))) / (MAX - MIN)) * (H - PAD.t - PAD.b)
  const label = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`

  const last = points[points.length - 1]
  const shown = points.find((p) => p.i === sel) ?? last

  return (
    <section className="chart-card" aria-label="冷凍庫脳年齢のきろく">
      <div className="chart-head">
        <h3>冷凍庫脳年齢のきろく</h3>
        <div className="seg mini" role="group" aria-label="期間">
          <button className={span === 7 ? 'on' : ''} onClick={() => (setSpan(7), setSel(null))}>
            週
          </button>
          <button className={span === 30 ? 'on' : ''} onClick={() => (setSpan(30), setSel(null))}>
            月
          </button>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="chart-empty">脳トレで遊ぶと、ここに脳年齢の記録が出ます</p>
      ) : (
        <>
          <p className="chart-now">
            {label(shown.d)}
            <b>{shown.age}</b>歳<small>（低いほど若い）</small>
          </p>
          <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`直近${span}日の冷凍庫脳年齢。最新は${last.age}歳`}>
            {[20, 45, 70].map((v) => (
              <g key={v}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="grid-line" />
                <text x={PAD.l - 6} y={y(v) + 4} textAnchor="end" className="axis">
                  {v}
                </text>
              </g>
            ))}
            <text x={PAD.l} y={H - 5} className="axis">
              {label(days[0].d)}
            </text>
            <text x={W - PAD.r} y={H - 5} textAnchor="end" className="axis">
              今日
            </text>
            {points.length > 1 && <polyline points={points.map((p) => `${x(p.i)},${y(p.age)}`).join(' ')} className="line" />}
            {shown && <line x1={x(shown.i)} x2={x(shown.i)} y1={PAD.t} y2={H - PAD.b} className="cross" />}
            {points.map((p) => (
              <g key={p.i}>
                <circle cx={x(p.i)} cy={y(p.age)} r={p === shown ? 6 : 4} className="dot" />
                <circle cx={x(p.i)} cy={y(p.age)} r={Math.max(9, 140 / span)} fill="transparent" onClick={() => setSel(p.i)} />
              </g>
            ))}
          </svg>
          <details className="chart-table">
            <summary>数字で見る</summary>
            <ul>
              {[...points].reverse().map((p) => (
                <li key={p.i}>
                  <span>{label(p.d)}</span>
                  <b>{p.age}歳</b>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  )
}
