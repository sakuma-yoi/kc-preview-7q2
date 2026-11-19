// フローズンキューブ：商品の写真が描かれた3×3のキューブを、回して元にもどす

import { useEffect, useMemo, useRef, useState } from 'react'
import catalog from '#catalog'
import type { Product } from '../data/products'
import { CUBE, CUBE_SEC_BASE, CUBE_SEC_PER_MOVE, PACE } from '../data/levels'
import { sfx } from '../lib/sfx'
import { randInt, shuffle } from '../lib/util'
import { Stage, useRounds, type GameProps, type Grade } from './common'

type V = [number, number, number]
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k]
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const eq = (a: V, b: V) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]

/** 面：n＝外向きの向き、right・down＝外から見たときの右と下 */
type FaceDef = { n: V; right: V; down: V }
const FACES: FaceDef[] = [
  { n: [0, 1, 0], right: [1, 0, 0], down: [0, 0, 1] }, // 上
  { n: [0, 0, 1], right: [1, 0, 0], down: [0, -1, 0] }, // 左前
  { n: [1, 0, 0], right: [0, 0, -1], down: [0, -1, 0] }, // 右前
  { n: [0, -1, 0], right: [1, 0, 0], down: [0, 0, -1] },
  { n: [0, 0, -1], right: [-1, 0, 0], down: [0, -1, 0] },
  { n: [-1, 0, 0], right: [0, 0, 1], down: [0, -1, 0] },
]
/** 見えている3面（回せる面） */
const VISIBLE = [0, 1, 2]
const FACE_NAME = ['上の面', '左の面', '右の面']
/** 面の色。色で面を見分けられるように、はっきりした色にする */
const FACE_COLOR = ['#f2c14e', '#5cb85c', '#4a90d9', '#e8644a', '#9b6dd6', '#f4f1e8']

/** シール1枚：pos＝小さな立方体の位置、n＝向き、up＝絵の上の向き。face・r・c＝もとの面と、その面の中の場所 */
type Sticker = { pos: V; n: V; up: V; face: number; r: number; c: number }

function solved(): Sticker[] {
  const out: Sticker[] = []
  FACES.forEach((f, face) => {
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) out.push({ pos: add(add(f.n, mul(f.right, c - 1)), mul(f.down, r - 1)), n: f.n, up: mul(f.down, -1), face, r, c })
  })
  return out
}

/** 面を90°回す。cw＝外から見て右回し */
function turn(st: Sticker[], face: number, cw: boolean): Sticker[] {
  const n = FACES[face].n
  const rot = (v: V): V => add(mul(n, dot(n, v)), mul(cross(n, v), cw ? -1 : 1))
  return st.map((s) => (dot(s.pos, n) === 1 ? { ...s, pos: rot(s.pos), n: rot(s.n), up: rot(s.up) } : s))
}

const stateKey = (st: Sticker[]) => st.map((s) => `${s.pos}|${s.n}|${s.up}`).join(';')
/** そろっているか：どのシールも、もとの面の向きにある（絵は傾けずに描くので、向きまではくらべない） */
const isSolved = (st: Sticker[]) => st.every((s) => eq(s.n, FACES[s.face].n))
type Move = { face: number; cw: boolean }

/** いちばん少ない手数（3面だけを使う。崩した回数までさがす） */
function minMoves(st: Sticker[], limit: number) {
  let frontier = [st]
  const seen = new Set([stateKey(st)])
  for (let d = 0; d <= limit; d++) {
    if (frontier.some(isSolved)) return d
    const next: Sticker[][] = []
    for (const s of frontier)
      for (const face of VISIBLE)
        for (const cw of [true, false]) {
          const t = turn(s, face, cw)
          const k = stateKey(t)
          if (!seen.has(k)) (seen.add(k), next.push(t))
        }
    frontier = next
  }
  return limit
}

/** 斜め上から見た図（等角投影） */
const proj = (v: V): [number, number] => [(v[0] - v[2]) * 0.866, (v[0] + v[2]) * 0.5 - v[1]]

/** シール1枚に描く商品の小さな絵（写真があれば写真、なければ絵文字）。向きは傾けない */
function Mini({ p }: { p: Product }) {
  const url = catalog.icons[p.id] ?? catalog.images[p.id]
  return url ? (
    <image href={url} x={0.2} y={0.2} width={0.6} height={0.6} preserveAspectRatio="xMidYMid slice" clipPath="url(#cube-mini)" />
  ) : (
    <text x={0.5} y={0.53} fontSize={0.55} textAnchor="middle" dominantBaseline="central">
      {p.icon}
    </text>
  )
}

function CubeView({ st, goods, spin }: { st: Sticker[]; goods: Product[]; spin: { face: number; angle: number } | null }) {
  return (
    <svg className="cube-svg" viewBox="-4.4 -4.9 8.8 9.4" aria-hidden="true">
      <defs>
        <clipPath id="cube-mini" clipPathUnits="userSpaceOnUse">
          <rect x={0.2} y={0.2} width={0.6} height={0.6} rx={0.14} />
        </clipPath>
      </defs>
      {/* 軸（見えている3面の真ん中を通る線） */}
      {VISIBLE.map((fi) => {
        const f = FACES[fi]
        const [x1, y1] = proj(mul(f.n, 1.5))
        const [x2, y2] = proj(mul(f.n, 3.4))
        return <line key={fi} x1={x1} y1={y1} x2={x2} y2={y2} className="cube-axis" />
      })}
      {VISIBLE.map((fi) => {
        const f = FACES[fi]
        const [ax, ay] = proj(f.right)
        const [bx, by] = proj(f.down)
        const [cx, cy] = proj(mul(f.n, 1.5))
        // 回している面は、その面の中で回して見せる
        let tf = ''
        if (spin && spin.face === fi) {
          const t = (spin.angle * Math.PI) / 180
          const cos = Math.cos(t)
          const sin = Math.sin(t)
          // 面の座標で回す（右＝a、下＝b）：M・R・M⁻¹
          const det = ax * by - bx * ay
          const inv = [by / det, -bx / det, -ay / det, ax / det]
          const m = [ax * cos + bx * sin, ay * cos + by * sin, -ax * sin + bx * cos, -ay * sin + by * cos]
          const A = m[0] * inv[0] + m[2] * inv[2]
          const B = m[1] * inv[0] + m[3] * inv[2]
          const C = m[0] * inv[1] + m[2] * inv[3]
          const D = m[1] * inv[1] + m[3] * inv[3]
          tf = `matrix(${A} ${B} ${C} ${D} ${cx - A * cx - C * cy} ${cy - B * cx - D * cy})`
        }
        return (
          <g key={fi} transform={tf}>
            <polygon
              points={[
                [-1.5, -1.5],
                [1.5, -1.5],
                [1.5, 1.5],
                [-1.5, 1.5],
              ]
                .map(([u, v]) => proj(add(add(mul(f.n, 1.5), mul(f.right, u)), mul(f.down, v))).join(','))
                .join(' ')}
              className="cube-face"
            />
            {st
              .filter((s) => eq(s.n, f.n))
              .map((s) => {
                const col = dot(s.pos, f.right) + 1
                const row = dot(s.pos, f.down) + 1
                const inset = 0.06
                const o = add(add(mul(f.n, 1.5), mul(f.right, col - 1.5 + inset)), mul(f.down, row - 1.5 + inset))
                const [ox, oy] = proj(o)
                const s1 = 1 - inset * 2
                return (
                  <g key={`${s.face}-${s.r}-${s.c}`} transform={`matrix(${ax * s1} ${ay * s1} ${bx * s1} ${by * s1} ${ox} ${oy})`}>
                    <rect x={0} y={0} width={1} height={1} rx={0.12} fill={FACE_COLOR[s.face]} />
                    <rect x={0.17} y={0.17} width={0.66} height={0.66} rx={0.17} fill="#fff" opacity={0.9} />
                    <Mini p={goods[s.face]} />
                  </g>
                )
              })}
          </g>
        )
      })}
    </svg>
  )
}

/** 回すボタンの置き場所（軸の先、％） */
const BTN_POS = VISIBLE.map((fi) => {
  const [x, y] = proj(mul(FACES[fi].n, 3.9))
  return { left: ((x + 4.4) / 8.8) * 100, top: ((y + 4.9) / 9.4) * 100 }
})

const DOWN: Record<Grade, Grade> = { great: 'good', good: 'fair', fair: 'bad', bad: 'bad' }

export function Cube({ products, onDone }: GameProps) {
  const r = useRounds(3, onDone, PACE.cube, CUBE.length)
  const lv = CUBE[r.level]
  const q = useMemo(() => {
    const pool = shuffle(products)
    const goods = Array.from({ length: 6 }, (_, i) => pool[i % pool.length])
    for (;;) {
      let st = solved()
      const moves: Move[] = []
      while (moves.length < lv.scramble) {
        const m = { face: VISIBLE[randInt(3)], cw: !!randInt(2) }
        const last = moves[moves.length - 1]
        // すぐ元にもどる回し方はしない
        if (last && last.face === m.face && last.cw !== m.cw) continue
        moves.push(m)
        st = turn(st, m.face, m.cw)
      }
      const best = minMoves(st, lv.scramble)
      if (best === lv.scramble) return { goods, start: st, best }
    }
  }, [r.round]) // eslint-disable-line react-hooks/exhaustive-deps

  const [st, setSt] = useState(q.start)
  const [steps, setSteps] = useState(0)
  const [spin, setSpin] = useState<{ face: number; angle: number } | null>(null)
  const [result, setResult] = useState<null | { grade: Grade; sec: number; slow: boolean; gaveUp: boolean }>(null)
  const started = useRef(performance.now())
  const busy = useRef(false)
  useEffect(() => {
    setSt(q.start)
    setSteps(0)
    setResult(null)
    setSpin(null)
    busy.current = false
    started.current = performance.now()
  }, [q])

  const guide = q.best * CUBE_SEC_PER_MOVE + CUBE_SEC_BASE

  const finish = (used: number, gaveUp: boolean) => {
    const sec = Math.round((performance.now() - started.current) / 1000)
    const extra = used - q.best
    // 手数：いちばん少ないなら◎、+1〜2手で○、+3〜4手で△、それ以上か「あきらめる」で✕。目安の時間をこえたら1段階下げる
    let grade: Grade = gaveUp ? 'bad' : extra <= 0 ? 'great' : extra <= 2 ? 'good' : extra <= 4 ? 'fair' : 'bad'
    const slow = !gaveUp && sec > guide
    if (slow) grade = DOWN[grade]
    setResult({ grade, sec, slow, gaveUp })
    const base = Math.round(100 / r.total)
    const pts = { great: base, good: Math.round(base * 0.75), fair: Math.round(base * 0.5), bad: gaveUp ? 0 : Math.round(base * 0.15) }[grade]
    r.answer(pts, grade, 3200, [])
  }

  const rotate = (face: number, cw: boolean) => {
    if (result || busy.current) return
    busy.current = true
    sfx('tap')
    const t0 = performance.now()
    const dur = 260
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / dur)
      setSpin({ face, angle: (cw ? 90 : -90) * (1 - Math.pow(1 - p, 2)) })
      if (p < 1) return void requestAnimationFrame(tick)
      setSpin(null)
      const next = turn(st, face, cw)
      setSt(next)
      const used = steps + 1
      setSteps(used)
      busy.current = false
      if (isSolved(next)) finish(used, false)
    }
    requestAnimationFrame(tick)
  }

  return (
    <Stage
      r={r}
      question={`キューブが ${q.best}回 回されています。回して、6つの面の色をそろえてください`}
      coach="軸の先の矢印ボタンで、その面を回します。↻は右回し、↺は左回しです。回された向きと反対に回すと元にもどります"
    >
      <div className="cube-wrap">
        <CubeView st={st} goods={q.goods} spin={spin} />
        {VISIBLE.map((fi, k) => (
          <div key={fi} className="cube-btns" style={{ left: `${BTN_POS[k].left}%`, top: `${BTN_POS[k].top}%` }}>
            <button className="cube-btn" onClick={() => rotate(fi, false)} disabled={!!result} aria-label={`${FACE_NAME[k]}を左に回す`}>
              ↺
            </button>
            <button className="cube-btn" onClick={() => rotate(fi, true)} disabled={!!result} aria-label={`${FACE_NAME[k]}を右に回す`}>
              ↻
            </button>
          </div>
        ))}
      </div>
      <p className="cube-steps">
        回した回数 <b>{steps}</b>回
      </p>
      {result ? (
        <div className="change-result">
          <p>
            {result.gaveUp ? 'あきらめました' : `${steps}回で元にもどりました`}（いちばん少ないのは {q.best}回）・時間 {result.sec}秒（目安 {guide}秒）
            {result.slow && '：目安をこえたので1段階下がりました'}
          </p>
        </div>
      ) : (
        <div className="ops-pair">
          <button
            className="btn ghost"
            disabled={steps === 0}
            onClick={() => {
              // 回された直後にもどす（回した回数は続きから数える）
              setSt(q.start)
            }}
          >
            はじめから
          </button>
          <button className="btn ghost" onClick={() => finish(steps, true)}>
            あきらめる
          </button>
        </div>
      )}
    </Stage>
  )
}
