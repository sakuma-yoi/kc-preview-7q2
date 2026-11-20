// 海苔の切り絵（紋切り）：扇形に折って切った海苔のうち、開くと完成品の模様になるものを選ぶ

import { useEffect, useMemo, useRef, useState } from 'react'
import { NORI, PACE } from '../data/levels'
import { sfx } from '../lib/sfx'
import { randInt, shuffle } from '../lib/util'
import { Stage, useRounds, type GameProps, type Grade } from './common'

/**
 * 紋切り：海苔を、角度 α＝180°/k の扇形に 2k 枚重ねて折る。
 * 両側の辺はどちらも折り目なので、開くと 2k 枚が鏡写しにつながり、k 回の回転対称の模様になる
 */
const R = 100
const deg = (rad: number) => (rad * 180) / Math.PI

/** 外形：t（0＝片方の折り目、1＝もう片方の折り目）での半径（R に対する割合）。sym＝t と 1−t で同じ形 */
const PROFILES: { sym: boolean; r: (t: number, a: number) => number }[] = [
  // 花びら：折り目の上が花びらの先（開くと k 枚の花びら）
  { sym: false, r: (t) => 0.5 + 0.48 * Math.pow((1 + Math.cos(Math.PI * t)) / 2, 0.7) },
  // 桜：花びらの先に切れこみ
  { sym: false, r: (t) => 0.5 + 0.48 * Math.pow((1 + Math.cos(Math.PI * t)) / 2, 0.7) - (t < 0.14 ? 0.16 * (1 - t / 0.14) : 0) },
  // 星：とがった先
  { sym: false, r: (t) => 0.42 + 0.56 * Math.pow(1 - t, 1.8) },
  // 多角形：開くと、折り目の数の2倍の角がある形（6枚重ねなら六角形、8枚重ねなら八角形）
  { sym: true, r: (t, a) => (0.97 * Math.cos(a / 2)) / Math.cos(t * a - a / 2) },
  // 多角形：開くと、角が半分の形（12枚重ねなら六角形、8枚重ねなら四角）。4枚重ねでは円にする
  { sym: false, r: (t, a) => (a > 1.2 ? 0.96 : (0.97 * Math.cos(a)) / Math.cos(t * a - a)) },
  // 波の円：小さな丸がぐるっと並ぶ
  { sym: true, r: (t) => 0.86 + 0.12 * Math.cos(2 * Math.PI * t) },
  // 円
  { sym: true, r: () => 0.96 },
]

/** 切り込み（穴）の形 */
type HoleKind = 'circle' | 'drop' | 'petal' | 'diamond' | 'slit'
const HOLE_KINDS: HoleKind[] = ['circle', 'drop', 'petal', 'diamond', 'slit']
/** rr＝中心からの距離（R に対する割合）、t＝扇の中の角度（0〜1）、s＝大きさ */
type Hole = { kind: HoleKind; rr: number; t: number; s: number }
/** k＝回転の数、profile＝外形、holes＝穴、center＝真ん中の丸い穴の大きさ（0＝なし） */
type Design = { k: number; profile: number; holes: Hole[]; center: number }

/** 扇の中の点（θ＝0 が真上、時計回り） */
const pt = (rr: number, th: number): [number, number] => [rr * R * Math.sin(th), -rr * R * Math.cos(th)]

function HolePath({ h, a }: { h: Hole; a: number }) {
  const th = h.t * a
  const [cx, cy] = pt(h.rr, th)
  const s = h.s * R
  let d: string
  if (h.kind === 'circle') d = `M ${-s} 0 a ${s} ${s} 0 1 0 ${2 * s} 0 a ${s} ${s} 0 1 0 ${-2 * s} 0`
  else if (h.kind === 'drop') d = `M 0 ${-s * 1.6} Q ${s * 1.1} ${-s * 0.2} 0 ${s} Q ${-s * 1.1} ${-s * 0.2} 0 ${-s * 1.6} Z`
  else if (h.kind === 'petal') d = `M 0 ${-s * 1.5} Q ${s} 0 0 ${s * 1.5} Q ${-s} 0 0 ${-s * 1.5} Z`
  else if (h.kind === 'diamond') d = `M 0 ${-s * 1.3} L ${s * 0.8} 0 L 0 ${s * 1.3} L ${-s * 0.8} 0 Z`
  else d = `M ${-s * 1.4} ${-s * 0.28} L ${s * 1.4} ${-s * 0.28} L ${s * 1.4} ${s * 0.28} L ${-s * 1.4} ${s * 0.28} Z`
  return <path d={d} transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(${deg(th).toFixed(2)})`} className="nori-hole" />
}

/** 扇の外形（折った海苔の形） */
function wedgePoints(d: Design) {
  const a = Math.PI / d.k
  const p = PROFILES[d.profile]
  const out: [number, number][] = [[0, 0]]
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    out.push(pt(p.r(t, a), t * a))
  }
  return out.map((q) => q.map((v) => v.toFixed(2)).join(',')).join(' ')
}

/** 扇1枚ぶん（海苔と穴）。穴は扇の中だけを切る。part で海苔だけ・穴だけも描ける */
function Wedge({ d, id, part = 'both' }: { d: Design; id: string; part?: 'both' | 'nori' | 'holes' }) {
  const a = Math.PI / d.k
  // 穴を切る範囲：扇より少しだけ広げる（となりの扇の穴とすき間なくつながるように）
  const e = 0.012
  const [sx, sy] = pt(1.3, -e)
  const [ex, ey] = pt(1.3, a + e)
  const [bx, by] = pt(-0.02, a / 2)
  const fan = `M ${bx.toFixed(2)} ${by.toFixed(2)} L ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R * 1.3} ${R * 1.3} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z`
  if (part === 'nori') return <polygon points={wedgePoints(d)} className="nori" />
  return (
    <>
      {part === 'both' && <polygon points={wedgePoints(d)} className="nori" />}
      <clipPath id={id}>
        <path d={fan} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        {d.holes.map((h, i) => (
          <HolePath key={i} h={h} a={a} />
        ))}
        {d.center > 0 && <circle cx={0} cy={0} r={d.center * R} className="nori-hole" />}
      </g>
    </>
  )
}

/** 開いた海苔：扇を鏡写しにしながら一周ならべる。animate で1枚ずつ広がる */
function Opened({ d, id, animate = false }: { d: Design; id: string; animate?: boolean }) {
  const a = deg(Math.PI / d.k)
  const copies: { tf: string; i: number }[] = []
  for (let m = 0; m < d.k; m++) {
    copies.push({ tf: `rotate(${2 * m * a})`, i: 2 * m })
    copies.push({ tf: `rotate(${2 * m * a}) scale(-1 1)`, i: 2 * m + 1 })
  }
  return (
    <svg className="nori-sheet" viewBox={`${-R * 1.05} ${-R * 1.05} ${R * 2.1} ${R * 2.1}`} aria-hidden="true">
      {/* 先に海苔を全部描いてから穴を描く（となりの扇の縁取りで、折り目の上の穴がふさがらないように） */}
      {(['nori', 'holes'] as const).map((part) =>
        copies.map((c) => (
          <g key={`${part}-${c.i}`} transform={c.tf}>
            <g className={animate ? 'sector' : ''} style={animate ? { animationDelay: `${c.i * 0.07}s` } : undefined}>
              <Wedge d={d} id={`${id}-${c.i}`} part={part} />
            </g>
          </g>
        )),
      )}
    </svg>
  )
}

/** 折った海苔（扇）。先を下にして立てる。両側の辺は折り目（点線） */
function Folded({ d, id }: { d: Design; id: string }) {
  const a = Math.PI / d.k
  const [ex, ey] = pt(1.02, a)
  const w = Math.max(0.35, Math.sin(a / 2)) * R * 1.1
  return (
    <svg viewBox={`${-w} ${-R * 1.06} ${w * 2} ${R * 1.14}`} aria-hidden="true">
      <g transform={`rotate(${(-deg(a) / 2).toFixed(2)})`}>
        <polygon points={wedgePoints(d)} className="nori back" transform="translate(2.5 2.5)" />
        <Wedge d={d} id={id} />
        <line x1={0} y1={0} x2={0} y2={-R * 1.02} className="crease" />
        <line x1={0} y1={0} x2={ex} y2={ey} className="crease" />
      </g>
    </svg>
  )
}

/** 折り方の図：円い海苔に折り目の線。色の濃いところが、折ったあとの扇 */
function HowToFold({ k }: { k: number }) {
  const a = Math.PI / k
  const [ex, ey] = pt(1, a)
  const fan = `M 0 0 L 0 ${-R} A ${R} ${R} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z`
  return (
    <div className="nori-how">
      <svg viewBox={`${-R * 1.1} ${-R * 1.1} ${R * 2.2} ${R * 2.2}`} aria-hidden="true">
        <circle cx={0} cy={0} r={R} className="nori light" />
        <path d={fan} className="nori" />
        {Array.from({ length: k }, (_, i) => {
          const [x, y] = pt(1, i * a)
          return <line key={i} x1={-x} y1={-y} x2={x} y2={y} className="crease how" />
        })}
      </svg>
      <p>
        点線で <b>{2 * k}枚</b>に重ねて、
        <br />
        濃いところの扇の形に折って切る
      </p>
    </div>
  )
}

/** 穴が真ん中の穴や外にはみ出していないか（ざっくり） */
function valid(d: Design) {
  const a = Math.PI / d.k
  const p = PROFILES[d.profile]
  return d.holes.every((h) => h.rr - h.s * 1.6 > d.center + 0.04 && h.rr + h.s * 1.7 < p.r(h.t, a) - 0.03)
}

const randHole = (): Hole => ({
  kind: HOLE_KINDS[randInt(HOLE_KINDS.length)],
  rr: 0.3 + Math.random() * 0.45,
  // 3割は折り目の上（開くと、となりの穴とつながって1つの形になる）
  t: Math.random() < 0.3 ? (randInt(2) ? 0 : 1) : Math.random(),
  s: 0.06 + Math.random() * 0.06,
})

const designKey = (d: Design) => JSON.stringify([d.profile, d.center.toFixed(2), d.holes.map((h) => [h.kind, h.rr.toFixed(2), h.t.toFixed(2), h.s.toFixed(2)].join()).sort()])

function makeNori(level: number) {
  const lv = NORI[level]
  for (;;) {
    const d: Design = {
      k: lv.k,
      profile: randInt(PROFILES.length),
      holes: Array.from({ length: lv.holes }, randHole),
      center: Math.random() < 0.35 ? 0.08 + Math.random() * 0.06 : 0,
    }
    if (!valid(d)) continue
    // まちがいの候補：穴を1つ反対側の折り目のほうへ／中心から近く・遠く／形をかえる／消す、外形をかえる、真ん中の穴をつける・消す
    const cands: Design[] = []
    for (let n = 0; n < 60; n++) {
      const x: Design = { ...d, holes: d.holes.map((h) => ({ ...h })) }
      const i = randInt(x.holes.length)
      const h = x.holes[i]
      const t = randInt(6)
      if (t === 0) {
        // 全体を鏡に映しただけ（回すと同じ模様）になる形はさける
        if (Math.abs(h.t - 0.5) < 0.2 || (x.holes.length === 1 && PROFILES[x.profile].sym)) continue
        h.t = 1 - h.t
      } else if (t === 1) h.rr += (randInt(2) ? 1 : -1) * (0.13 + Math.random() * 0.08)
      else if (t === 2) h.kind = HOLE_KINDS.filter((k) => k !== h.kind)[randInt(HOLE_KINDS.length - 1)]
      else if (t === 3) {
        if (x.holes.length < 2) continue
        x.holes.splice(i, 1)
      } else if (t === 4) x.profile = [...PROFILES.keys()].filter((p) => p !== x.profile)[randInt(PROFILES.length - 1)]
      else x.center = x.center ? 0 : 0.1
      if (valid(x)) cands.push(x)
    }
    const seen = new Set([designKey(d)])
    const wrong: Design[] = []
    for (const c of shuffle(cands)) {
      const key = designKey(c)
      if (seen.has(key)) continue
      seen.add(key)
      wrong.push(c)
      if (wrong.length === lv.options - 1) break
    }
    if (wrong.length < lv.options - 1) continue
    const options = shuffle([d, ...wrong])
    return { d, options, answer: options.indexOf(d) }
  }
}

export function Nori({ onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.nori, NORI.length)
  const q = useMemo(() => makeNori(r.level), [r.round]) // eslint-disable-line react-hooks/exhaustive-deps
  const [picked, setPicked] = useState<number | null>(null)
  const started = useRef(performance.now())
  useEffect(() => {
    setPicked(null)
    started.current = performance.now()
  }, [q])

  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    const sec = (performance.now() - started.current) / 1000
    // 正解で早ければ◎、時間がかかれば○、まちがいは✕
    const grade: Grade = i === q.answer ? (sec <= NORI[r.level].fastSec ? 'great' : 'good') : 'bad'
    sfx(i === q.answer ? 'ok' : 'ng')
    const base = Math.round(100 / r.total)
    r.answer(grade === 'great' ? base : grade === 'good' ? Math.round(base * 0.75) : 0, grade, 3200, [])
  }

  return (
    <Stage
      r={r}
      question={`海苔を ${2 * q.d.k}枚に重ねて折って切りました。開くと上の模様になるのはどれ？`}
      coach="両側の点線は折り目です。折り目をはさんで、切った形が鏡に映したように広がり、ぐるっと一周つながります。開いたときの模様を思い浮かべて選んでください"
    >
      <div className="nori-target">{picked === null ? <Opened d={q.d} id={`t${r.round}`} /> : <Opened d={q.d} id={`u${r.round}`} animate />}</div>
      <HowToFold k={q.d.k} />
      <div className={`nori-opts n${q.options.length}`}>
        {q.options.map((d, i) => (
          <button
            key={i}
            className={`nori-opt ${picked !== null && i === q.answer ? 'right' : ''} ${picked === i && i !== q.answer ? 'wrong' : ''}`}
            onClick={() => choose(i)}
            disabled={picked !== null}
            aria-label={`${i + 1}番の海苔`}
          >
            <Folded d={d} id={`o${r.round}-${i}`} />
          </button>
        ))}
      </div>
    </Stage>
  )
}
