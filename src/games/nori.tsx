// 海苔の切り絵：三角に折って切り込みを入れた海苔のうち、開くと完成品になるものを選ぶ（雪の結晶の切り絵）

import { useEffect, useMemo, useRef, useState } from 'react'
import { NORI, PACE } from '../data/levels'
import { sfx } from '../lib/sfx'
import { randInt, shuffle } from '../lib/util'
import { Stage, useRounds, type GameProps, type Grade } from './common'

/** 海苔のマス。0＝海苔、1＝穴、2〜5＝三角の穴（2＝左上、3＝右上、4＝右下、5＝左下の半分が穴） */
type Cell = 0 | 1 | 2 | 3 | 4 | 5
type Grid = Cell[][]
/** 海苔全体のマスの数（たて・よこ） */
const N = 12
const H2 = N / 2

/** 鏡に映したときの三角の向き：左右・上下・左上から右下の対角線・右上から左下の対角線 */
const FH: Cell[] = [0, 1, 3, 2, 5, 4]
const FV: Cell[] = [0, 1, 5, 4, 3, 2]
const DM: Cell[] = [0, 1, 2, 5, 4, 3]
const DA: Cell[] = [0, 1, 4, 3, 2, 5]

type T = (r: number, c: number, v: Cell) => [number, number, Cell]
const ID: T = (r, c, v) => [r, c, v]
const MH: T = (r, c, v) => [r, N - 1 - c, FH[v]]
const MV: T = (r, c, v) => [N - 1 - r, c, FV[v]]
const MDm: T = (r, c, v) => [c, r, DM[v]]
const MDa: T = (r, c, v) => [N - 1 - c, N - 1 - r, DA[v]]
const then =
  (a: T, b: T): T =>
  (r, c, v) =>
    b(...a(r, c, v))
/** 開いたときに重なっていた面の向き（折る回数で決まる） */
const GROUP: Record<4 | 8, T[]> = {
  4: [ID, MDm, MDa, then(MH, MV)],
  8: [ID, MH, MV, MDm, MDa, then(MH, MV), then(MH, MDm), then(MDm, MH)],
}

/** 折ったあとの三角に入るマスか。対角線の上のマスは半分だけ入る（その半分の向きを返す） */
function inWedge(fold: 4 | 8, r: number, c: number): Cell | 'all' | null {
  if (r < 0 || c < 0 || r >= N || c >= N) return null
  if (fold === 4) {
    if (r < c && r < N - 1 - c) return 'all'
    if (r === c && r < H2) return 3
    if (r === N - 1 - c && r < H2) return 2
    return null
  }
  if (r < c && c < H2) return 'all'
  if (r === c && c < H2) return 3
  return null
}
/** 折ったあとの三角の形（海苔全体の座標）と、折り目の線 */
const WEDGE: Record<4 | 8, { poly: [number, number][]; creases: [number, number, number, number][] }> = {
  4: {
    poly: [
      [0, 0],
      [N, 0],
      [H2, H2],
    ],
    creases: [
      [0, 0, H2, H2],
      [N, 0, H2, H2],
    ],
  },
  8: {
    poly: [
      [0, 0],
      [H2, 0],
      [H2, H2],
    ],
    creases: [
      [0, 0, H2, H2],
      [H2, 0, H2, H2],
    ],
  },
}

/** 切り込みの形（[行, 列, マス]） */
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

const blank = (): Grid => Array.from({ length: N }, () => Array<Cell>(N).fill(0))
const put = (g: Grid, r: number, c: number, v: Cell) => {
  const cur = g[r][c]
  g[r][c] = cur === 0 || cur === v ? v : 1
}
const key = (g: Grid) => g.map((r) => r.join('')).join('/')

/** 折った海苔（三角の中だけ）に切り込みを入れる */
function cut(fold: 4 | 8, stamps: Stamp[]): Grid {
  const g = blank()
  for (const s of stamps)
    for (const [dr, dc, v0] of STAMPS[s.shape]) {
      const r = s.r + dr
      const c = s.c + dc
      const v: Cell = STAMPS[s.shape].length === 1 && v0 === 2 ? s.tri : v0
      const w = inWedge(fold, r, c)
      if (!w) continue
      if (w === 'all') put(g, r, c, v)
      else if (v === 1 || v === w) put(g, r, c, w)
    }
  return g
}

/** 開いた海苔：重なっていた面すべてに、同じ切り込みが鏡写し・回転して入る */
function unfold(fold: 4 | 8, piece: Grid): Grid {
  const g = blank()
  piece.forEach((row, r) =>
    row.forEach((v, c) => {
      if (!v) return
      for (const t of GROUP[fold]) put(g, ...t(r, c, v))
    }),
  )
  return g
}

/** 三角の中で、折り目と外の辺を入れかえた形（いちばんまぎらわしいまちがい） */
function swapEdges(fold: 4 | 8, piece: Grid): Grid {
  const g = blank()
  piece.forEach((row, r) =>
    row.forEach((v, c) => {
      if (!v) return
      const [r2, c2, v2] = fold === 4 ? MH(r, c, v) : ([H2 - 1 - c, H2 - 1 - r, DA[v]] as [number, number, Cell])
      put(g, r2, c2, v2)
    }),
  )
  return g
}

const randStamp = (fold: 4 | 8): Stamp => {
  // 三角の中かその近く（はみ出したぶんは切れない）
  for (;;) {
    const r = randInt(H2) - (randInt(4) === 0 ? 1 : 0)
    const c = randInt(N)
    if (inWedge(fold, r, c) || inWedge(fold, r + 1, c + 1)) return { shape: randInt(STAMPS.length), r, c, tri: (2 + randInt(4)) as Cell }
  }
}

function makeNori(level: number) {
  const lv = NORI[level]
  const fold = lv.fold
  for (;;) {
    const stamps = Array.from({ length: lv.stamps }, () => randStamp(fold))
    const piece = cut(fold, stamps)
    const holes = piece.flat().filter((v) => v).length
    if (holes < 2) continue
    const sheet = unfold(fold, piece)
    const answerKey = key(sheet)
    const cands: Grid[] = [swapEdges(fold, piece)]
    for (let k = 0; k < 30; k++) {
      const s = stamps.map((x) => ({ ...x }))
      const i = randInt(s.length)
      const t = randInt(4)
      if (t === 0) s[i].r += randInt(2) ? 1 : -1
      else if (t === 1) s[i].c += randInt(2) ? 1 : -1
      else if (t === 2) s[i].shape = randInt(STAMPS.length)
      else if (s.length > 1) s.splice(i, 1)
      else s.push(randStamp(fold))
      cands.push(cut(fold, s))
    }
    const seen = new Set([answerKey])
    const wrong: Grid[] = []
    // 折り目と外の辺を入れかえたまちがいを1つは入れる
    for (const g of [cands[0], ...shuffle(cands.slice(1))]) {
      const k2 = key(unfold(fold, g))
      if (seen.has(k2) || !g.flat().some((v) => v)) continue
      seen.add(k2)
      wrong.push(g)
      if (wrong.length === lv.options - 1) break
    }
    if (wrong.length < lv.options - 1) continue
    const options = shuffle([piece, ...wrong])
    return { fold, piece, sheet, options, answer: options.indexOf(piece) }
  }
}

/** 穴を描く */
function Holes({ g }: { g: Grid }) {
  return (
    <>
      {g.flatMap((row, r) =>
        row.map((v, c) => {
          if (!v) return null
          if (v === 1) return <rect key={`${r}-${c}`} x={c - 0.01} y={r - 0.01} width={1.02} height={1.02} className="nori-hole" />
          const pts = { 2: [[0, 0], [1, 0], [0, 1]], 3: [[0, 0], [1, 0], [1, 1]], 4: [[1, 0], [1, 1], [0, 1]], 5: [[0, 0], [1, 1], [0, 1]] }[v]
          return <polygon key={`${r}-${c}`} points={pts.map(([x, y]) => `${c + x},${r + y}`).join(' ')} className="nori-hole" />
        }),
      )}
    </>
  )
}

const pts = (p: [number, number][]) => p.map((q) => q.join(',')).join(' ')

/** 完成品（広げた海苔） */
function Sheet({ g }: { g: Grid }) {
  return (
    <svg className="nori-sheet" viewBox={`-0.4 -0.4 ${N + 0.8} ${N + 0.8}`} aria-hidden="true">
      <rect x={0} y={0} width={N} height={N} rx={0.3} className="nori" />
      <Holes g={g} />
    </svg>
  )
}

/** 折った海苔（三角）。折り目の辺は点線 */
function Folded({ g, fold, id }: { g: Grid; fold: 4 | 8; id: string }) {
  const w = WEDGE[fold]
  const xs = w.poly.map((p) => p[0])
  const ys = w.poly.map((p) => p[1])
  const x0 = Math.min(...xs)
  const y0 = Math.min(...ys)
  const vw = Math.max(...xs) - x0
  const vh = Math.max(...ys) - y0
  return (
    <svg viewBox={`${x0 - 0.6} ${y0 - 0.6} ${vw + 1.4} ${vh + 1.4}`} aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <polygon points={pts(w.poly)} />
        </clipPath>
      </defs>
      <polygon points={pts(w.poly.map(([x, y]) => [x + 0.25, y + 0.25]))} className="nori back" />
      <polygon points={pts(w.poly)} className="nori" />
      <g clipPath={`url(#${id})`}>
        <Holes g={g} />
      </g>
      {w.creases.map(([a, b, c, d], i) => (
        <line key={i} x1={a} y1={b} x2={c} y2={d} className="crease" />
      ))}
    </svg>
  )
}

/** 折り方の図：正方形 →（ななめに折る）→ 三角 →（半分に折る）→ … */
function HowToFold({ fold }: { fold: 4 | 8 }) {
  const shapes: { poly: [number, number][]; line?: [number, number, number, number] }[] = [
    {
      poly: [
        [0, 0],
        [N, 0],
        [N, N],
        [0, N],
      ],
      line: [0, 0, N, N],
    },
    {
      poly: [
        [0, 0],
        [N, 0],
        [N, N],
      ],
      line: [N, 0, H2, H2],
    },
    {
      poly: [
        [0, 0],
        [N, 0],
        [H2, H2],
      ],
      line: fold === 8 ? [H2, 0, H2, H2] : undefined,
    },
  ]
  if (fold === 8)
    shapes.push({
      poly: [
        [0, 0],
        [H2, 0],
        [H2, H2],
      ],
    })
  return (
    <div className="nori-how" aria-label={fold === 8 ? 'ななめに半分、もう一度半分、さらに半分に折る' : 'ななめに半分、もう一度半分に折る'}>
      {shapes.map((s, i) => (
        <span key={i} className="nori-step">
          {i > 0 && <i aria-hidden="true">→</i>}
          <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} aria-hidden="true">
            <polygon points={pts(s.poly)} className="nori" />
            {s.line && <line x1={s.line[0]} y1={s.line[1]} x2={s.line[2]} y2={s.line[3]} className="crease how" />}
            {i === shapes.length - 1 && (
              <text x={N - 1} y={N - 1} fontSize={6} textAnchor="end">
                ✂️
              </text>
            )}
          </svg>
        </span>
      ))}
    </div>
  )
}

/** 正解の海苔が開いていく様子：三角が1つずつ広がる */
function Unfolding({ fold, sheet }: { fold: 4 | 8; sheet: Grid }) {
  const C: [number, number] = [H2, H2]
  const corners: [number, number][] = [
    [0, 0],
    [H2, 0],
    [N, 0],
    [N, H2],
    [N, N],
    [H2, N],
    [0, N],
    [0, H2],
  ]
  // 4枚なら上・右・下・左の三角、8枚ならその半分ずつ
  const sectors: [number, number][][] =
    fold === 4
      ? [
          [corners[0], corners[2], C],
          [corners[2], corners[4], C],
          [corners[4], corners[6], C],
          [corners[6], corners[0], C],
        ]
      : corners.map((p, i) => [p, corners[(i + 1) % 8], C])
  return (
    <svg className="nori-sheet" viewBox={`-0.4 -0.4 ${N + 0.8} ${N + 0.8}`} aria-hidden="true">
      <defs>
        {sectors.map((s, i) => (
          <clipPath key={i} id={`sec${i}`}>
            <polygon points={pts(s)} />
          </clipPath>
        ))}
      </defs>
      {sectors.map((s, i) => (
        <g key={i} className="sector" style={{ animationDelay: `${i * 0.14}s` }}>
          <polygon points={pts(s)} className="nori" />
          <g clipPath={`url(#sec${i})`}>
            <Holes g={sheet} />
          </g>
        </g>
      ))}
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
      question={`海苔を三角に ${q.fold}枚重ねて折り、切り込みを入れました。開くと上の形になるのはどれ？`}
      coach="点線は折り目です。折り目をはさんで、切り込みが鏡に映したように広がります。折り方の図を見て、開いたときの形を思い浮かべてください"
    >
      <div className="nori-target">{picked === null ? <Sheet g={q.sheet} /> : <Unfolding fold={q.fold} sheet={q.sheet} />}</div>
      <HowToFold fold={q.fold} />
      <div className={`nori-opts n${q.options.length} f${q.fold}`}>
        {q.options.map((g, i) => (
          <button
            key={i}
            className={`nori-opt ${picked !== null && i === q.answer ? 'right' : ''} ${picked === i && i !== q.answer ? 'wrong' : ''}`}
            onClick={() => choose(i)}
            disabled={picked !== null}
            aria-label={`${i + 1}番の海苔`}
          >
            <Folded g={g} fold={q.fold} id={`nori-${r.round}-${i}`} />
          </button>
        ))}
      </div>
    </Stage>
  )
}
