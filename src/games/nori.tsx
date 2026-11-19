// 海苔の切り絵：折って切り込みを入れた海苔のうち、開くと完成品になるものを選ぶ

import { useEffect, useMemo, useRef, useState } from 'react'
import { NORI, PACE } from '../data/levels'
import { sfx } from '../lib/sfx'
import { randInt, shuffle } from '../lib/util'
import { Stage, useRounds, type GameProps, type Grade } from './common'

/** 海苔のマス。0＝海苔、1＝穴、2〜5＝三角の穴（2＝左上、3＝右上、4＝右下、5＝左下の半分が穴） */
type Cell = 0 | 1 | 2 | 3 | 4 | 5
type Grid = Cell[][]

const FLIP_H: Record<number, Cell> = { 0: 0, 1: 1, 2: 3, 3: 2, 4: 5, 5: 4 }
const FLIP_V: Record<number, Cell> = { 0: 0, 1: 1, 2: 5, 5: 2, 3: 4, 4: 3 }
/** 海苔全体のマスの数（たて・よこ）。折る数で割り切れるようにしている */
const SHEET = 12

/** 切り込みの形（[行, 列, マス]）。三角は向きをかえて使う */
const STAMPS: [number, number, Cell][][] = [
  [[0, 0, 1]],
  [[0, 0, 1], [0, 1, 1]],
  [[0, 0, 1], [1, 0, 1]],
  [[0, 0, 1], [1, 0, 1], [1, 1, 1]],
  [[0, 0, 4], [0, 1, 5], [1, 0, 3], [1, 1, 2]],
  [[0, 0, 2]],
  [[0, 0, 1], [1, 1, 1]],
  [[0, 0, 3], [0, 1, 1]],
]

type Stamp = { shape: number; r: number; c: number; tri: Cell }

const flipH = (g: Grid): Grid => g.map((row) => [...row].reverse().map((v) => FLIP_H[v]))
const flipV = (g: Grid): Grid => [...g].reverse().map((row) => row.map((v) => FLIP_V[v]))
const key = (g: Grid) => g.map((r) => r.join('')).join('/')

/** 切り込みの一覧から、折った海苔（いちばん上の1枚）のマスを作る */
function draw(stamps: Stamp[], w: number, h: number): Grid {
  const g: Grid = Array.from({ length: h }, () => Array<Cell>(w).fill(0))
  for (const s of stamps)
    for (const [dr, dc, v0] of STAMPS[s.shape]) {
      const r = s.r + dr
      const c = s.c + dc
      if (r < 0 || r >= h || c < 0 || c >= w) continue
      const v: Cell = STAMPS[s.shape].length === 1 && v0 === 2 ? s.tri : v0
      const cur = g[r][c]
      g[r][c] = cur === 0 || cur === v ? v : 1
    }
  return g
}

/** 開いた海苔。じゃばらに折っているので、となりの面は鏡写しになる */
function unfold(piece: Grid, fx: number, fy: number): Grid {
  const h = piece.length
  const w = piece[0].length
  const out: Grid = Array.from({ length: h * fy }, () => Array<Cell>(w * fx).fill(0))
  for (let py = 0; py < fy; py++)
    for (let px = 0; px < fx; px++) {
      let p = piece
      if (px % 2) p = flipH(p)
      if (py % 2) p = flipV(p)
      p.forEach((row, r) => row.forEach((v, c) => (out[py * h + r][px * w + c] = v)))
    }
  return out
}

const randStamp = (w: number, h: number): Stamp => ({ shape: randInt(STAMPS.length), r: randInt(h) - (randInt(3) === 0 ? 1 : 0), c: randInt(w) - (randInt(3) === 0 ? 1 : 0), tri: (2 + randInt(4)) as Cell })

/** 問題を作る：正解の折った海苔と、まちがいの折った海苔 */
function makeNori(level: number) {
  const lv = NORI[level]
  const w = SHEET / lv.fx
  const h = SHEET / lv.fy
  for (;;) {
    const stamps = Array.from({ length: lv.stamps }, () => randStamp(w, h))
    const piece = draw(stamps, w, h)
    const holes = piece.flat().filter((v) => v).length
    if (holes < 2 || holes > w * h * 0.45) continue
    const answerKey = key(unfold(piece, lv.fx, lv.fy))
    // まちがいの候補：裏返し・上下さかさま・切り込みを1つずらす／消す／形をかえる／ふやす
    const cands: Grid[] = [flipH(piece), flipV(piece), flipV(flipH(piece))]
    for (let k = 0; k < 24; k++) {
      const s = stamps.map((x) => ({ ...x }))
      const i = randInt(s.length)
      const t = randInt(4)
      if (t === 0) s[i].r += randInt(2) ? 1 : -1
      else if (t === 1) s[i].c += randInt(2) ? 1 : -1
      else if (t === 2) s[i].shape = randInt(STAMPS.length)
      else if (s.length > 1) s.splice(i, 1)
      else s.push(randStamp(w, h))
      cands.push(draw(s, w, h))
    }
    const seen = new Set([answerKey])
    const wrong: Grid[] = []
    // 裏返しのまちがいを1つは入れる（いちばんまぎらわしい）
    for (const g of [...cands.slice(0, 3), ...shuffle(cands.slice(3))]) {
      const k2 = key(unfold(g, lv.fx, lv.fy))
      if (seen.has(k2) || !g.flat().some((v) => v)) continue
      seen.add(k2)
      wrong.push(g)
      if (wrong.length === lv.options - 1) break
    }
    if (wrong.length < lv.options - 1) continue
    const options = shuffle([piece, ...wrong.slice(0, 1), ...shuffle(wrong.slice(1))])
    return { piece, options, answer: options.indexOf(piece), sheet: unfold(piece, lv.fx, lv.fy), fx: lv.fx, fy: lv.fy, w, h }
  }
}

/** 海苔のマスを描く（穴は下の色が見える） */
function NoriCells({ g }: { g: Grid }) {
  return (
    <>
      {g.flatMap((row, r) =>
        row.map((v, c) => {
          if (!v) return null
          if (v === 1) return <rect key={`${r}-${c}`} x={c} y={r} width={1.02} height={1.02} className="nori-hole" />
          const pts = { 2: [[0, 0], [1, 0], [0, 1]], 3: [[0, 0], [1, 0], [1, 1]], 4: [[1, 0], [1, 1], [0, 1]], 5: [[0, 0], [1, 1], [0, 1]] }[v]
          return <polygon key={`${r}-${c}`} points={pts.map(([x, y]) => `${c + x},${r + y}`).join(' ')} className="nori-hole" />
        }),
      )}
    </>
  )
}

/** 完成品（広げた海苔） */
function Sheet({ g }: { g: Grid }) {
  const w = g[0].length
  const h = g.length
  return (
    <svg className="nori-sheet" viewBox={`-0.4 -0.4 ${w + 0.8} ${h + 0.8}`} aria-hidden="true">
      <rect x={0} y={0} width={w} height={h} rx={0.3} className="nori" />
      <NoriCells g={g} />
    </svg>
  )
}

/** 折った海苔。折り目の辺は点線で示す（じゃばら折りなので、3つ以上に折ると両側が折り目） */
function Folded({ g, fx, fy }: { g: Grid; fx: number; fy: number }) {
  const w = g[0].length
  const h = g.length
  const layers = Math.min(3, fx * fy - 1)
  return (
    <svg viewBox={`-0.6 -0.6 ${w + 1.6} ${h + 1.6}`} aria-hidden="true">
      {Array.from({ length: layers }, (_, i) => (
        <rect key={i} x={(layers - i) * 0.18} y={(layers - i) * 0.18} width={w} height={h} rx={0.2} className="nori back" />
      ))}
      <rect x={0} y={0} width={w} height={h} rx={0.2} className="nori" />
      <NoriCells g={g} />
      {fx > 1 && <line x1={w} y1={0} x2={w} y2={h} className="crease" />}
      {fx > 2 && <line x1={0} y1={0} x2={0} y2={h} className="crease" />}
      {fy > 1 && <line x1={0} y1={h} x2={w} y2={h} className="crease" />}
      {fy > 2 && <line x1={0} y1={0} x2={w} y2={0} className="crease" />}
    </svg>
  )
}

/** 正解の海苔が開いていく様子。折り目のところから、面が1つずつ開く */
function Unfolding({ piece, fx, fy }: { piece: Grid; fx: number; fy: number }) {
  const w = piece[0].length
  const h = piece.length
  const panels = []
  for (let py = 0; py < fy; py++)
    for (let px = 0; px < fx; px++) {
      let p = piece
      if (px % 2) p = flipH(p)
      if (py % 2) p = flipV(p)
      // 横に開く面は左の辺から、縦に開く面は上の辺から
      const dir = px > 0 ? 'x' : py > 0 ? 'y' : ''
      const delay = py * fx * 0 + (px + py * fx) * 0.18
      panels.push(
        <g key={`${px}-${py}`} className={`panel ${dir}`} style={{ animationDelay: `${delay}s`, transformOrigin: `${px * w}px ${py * h}px` }}>
          <rect x={px * w} y={py * h} width={w + 0.02} height={h + 0.02} className="nori" />
          <g transform={`translate(${px * w} ${py * h})`}>
            <NoriCells g={p} />
          </g>
        </g>,
      )
    }
  return (
    <svg className="nori-sheet" viewBox={`-0.4 -0.4 ${w * fx + 0.8} ${h * fy + 0.8}`} aria-hidden="true">
      {panels}
    </svg>
  )
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
      question={`海苔を ${q.fx * q.fy}枚に重ねて折り、切り込みを入れました。開くと上の形になるのはどれ？`}
      coach="点線は折り目です。折り目をはさんで、切り込みが鏡に映したように広がります。開いたときの形を思い浮かべて選んでください"
    >
      <div className="nori-target">{picked === null ? <Sheet g={q.sheet} /> : <Unfolding piece={q.piece} fx={q.fx} fy={q.fy} />}</div>
      <p className="nori-cap">{picked === null ? '完成品（開いた海苔）' : '正解の海苔を開くと…'}</p>
      <div className={`nori-opts n${q.options.length}`}>
        {q.options.map((g, i) => (
          <button
            key={i}
            className={`nori-opt ${picked !== null && i === q.answer ? 'right' : ''} ${picked === i && i !== q.answer ? 'wrong' : ''}`}
            onClick={() => choose(i)}
            disabled={picked !== null}
            aria-label={`${i + 1}番の海苔`}
          >
            <Folded g={g} fx={q.fx} fy={q.fy} />
          </button>
        ))}
      </div>
    </Stage>
  )
}
