// 逆算シャッフル：入れかわった冷蔵庫の、元の場所を当てる

import { useEffect, useMemo, useRef, useState } from 'react'
import { PIcon } from '../components/PIcon'
import type { Product } from '../data/products'
import { PACE, UNSHUFFLE } from '../data/levels'
import { sfx } from '../lib/sfx'
import { randInt, shuffle } from '../lib/util'
import { Stage, useRounds, type GameProps, type Grade } from './common'

/** 入れかえ1回：行（row）か列（col）の a 番目と b 番目 */
type Swap = { kind: 'row' | 'col'; a: number; b: number }

/** 入れかえの手順を作る。同じ入れかえを続けて（元にもどるように）出さない */
function makeSwaps(size: number, count: number) {
  const out: Swap[] = []
  while (out.length < count) {
    const kind = randInt(2) ? 'row' : 'col'
    const [a, b] = shuffle(Array.from({ length: size }, (_, i) => i)).slice(0, 2).sort((x, y) => x - y)
    const last = out[out.length - 1]
    if (last && last.kind === kind && last.a === a && last.b === b) continue
    out.push({ kind, a, b })
  }
  return out
}

/** order[表示の位置] ＝ 最初の位置。入れかえを1回あてる */
function applySwap(rows: number[], cols: number[], s: Swap) {
  const r = [...rows]
  const c = [...cols]
  const o = s.kind === 'row' ? r : c
  ;[o[s.a], o[s.b]] = [o[s.b], o[s.a]]
  return { rows: r, cols: c }
}

type Phase = 'ready' | 'shuffle' | 'open' | 'answer' | 'result'

const DOWN: Record<Grade, Grade> = { great: 'good', good: 'fair', fair: 'bad', bad: 'bad' }

export function Unshuffle({ products, onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.unshuffle, UNSHUFFLE.length)
  const lv = UNSHUFFLE[r.level]
  const N = lv.size

  // 問題：最初の並び（goods[最初の位置]）・入れかえの手順・聞く商品
  const q = useMemo(() => {
    for (;;) {
      const pool = shuffle(products)
      const goods: Product[] = Array.from({ length: N * N }, (_, i) => pool[i % pool.length])
      const swaps = makeSwaps(N, lv.swaps)
      let rows = Array.from({ length: N }, (_, i) => i)
      let cols = [...rows]
      for (const s of swaps) ({ rows, cols } = applySwap(rows, cols, s))
      // 聞く商品：1つしかない商品で、行も列も最初と変わっているもの（なければ、どちらかが変わっているもの）
      const unique = (i: number) => goods.filter((g) => g.id === goods[i].id).length === 1
      const finalPos = (orig: number) => ({ r: rows.indexOf(Math.floor(orig / N)), c: cols.indexOf(orig % N) })
      const moved = (i: number, both: boolean) => {
        const f = finalPos(i)
        const dr = f.r !== Math.floor(i / N)
        const dc = f.c !== i % N
        return both ? dr && dc : dr || dc
      }
      const cand = Array.from({ length: N * N }, (_, i) => i).filter((i) => unique(i))
      const pick = shuffle(cand.filter((i) => moved(i, true)))[0] ?? shuffle(cand.filter((i) => moved(i, false)))[0]
      if (pick === undefined) continue
      return { goods, swaps, rows, cols, target: pick }
    }
  }, [r.round]) // eslint-disable-line react-hooks/exhaustive-deps

  const [phase, setPhase] = useState<Phase>('ready')
  const [order, setOrder] = useState({ rows: [0], cols: [0] })
  /** いま動いている行・列（持ち上げて見せる） */
  const [moving, setMoving] = useState<Swap | null>(null)
  const [replayed, setReplayed] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [result, setResult] = useState<{ grade: Grade; sec: number } | null>(null)
  const asked = useRef(0)
  const timers = useRef<number[]>([])
  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  const later = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms))

  /** 最初の並びから入れかえを見せて、扉を開けるところまで */
  const play = (again: boolean) => {
    clear()
    const id = Array.from({ length: N }, (_, i) => i)
    setOrder({ rows: id, cols: id })
    setMoving(null)
    setPhase('ready')
    let t = 900
    let cur = { rows: id, cols: id }
    later(t, () => setPhase('shuffle'))
    for (const s of q.swaps) {
      later(t, () => {
        setMoving(s)
        sfx('tap')
      })
      t += 120
      cur = applySwap(cur.rows, cur.cols, s)
      const next = cur
      later(t, () => setOrder(next))
      t += lv.ms
      later(t, () => setMoving(null))
      t += 260
    }
    later(t + 200, () => {
      setPhase('open')
      sfx('soft')
      if (!again) {
        r.see(q.goods.map((g) => g.id))
        asked.current = performance.now()
      }
    })
    // 少し見せたら、最初の並びの盤（扉は閉じている）に切りかえて答えてもらう
    later(t + 200 + 1600, () => setPhase('answer'))
  }

  useEffect(() => {
    setReplayed(false)
    setPicked(null)
    setResult(null)
    play(false)
    return clear
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (i: number) => {
    if (phase !== 'answer') return
    clear()
    const sec = (performance.now() - asked.current) / 1000
    const sameRow = Math.floor(i / N) === Math.floor(q.target / N)
    const sameCol = i % N === q.target % N
    // 場所がぴったりで早ければ◎、時間がかかれば○。行か列の片方だけ合っていれば△、両方ちがえば✕。見直したら1段階下げる
    let grade: Grade = i === q.target ? (sec <= lv.fastSec ? 'great' : 'good') : sameRow || sameCol ? 'fair' : 'bad'
    if (replayed) grade = DOWN[grade]
    setPicked(i)
    setResult({ grade, sec: Math.round(sec) })
    setPhase('result')
    const base = Math.round(100 / r.total)
    const pts = { great: base, good: Math.round(base * 0.75), fair: Math.round(base * 0.4), bad: 0 }[grade]
    r.answer(pts, grade, 2600, grade === 'bad' ? [] : [q.goods[q.target].id])
  }

  const target = q.goods[q.target]
  // 盤に出す並び：答える前は入れかえたあと、答えるときと答えたあとは最初の並び
  const original = phase === 'answer' || phase === 'result'
  const doorsOpen = phase === 'open' || phase === 'result'

  return (
    <Stage
      r={r}
      question={
        phase === 'ready' || phase === 'shuffle' ? (
          '冷蔵庫の入れかわりを、よく見ていてください'
        ) : (
          <>
            <b>{target.shortName ?? target.name}</b> は、最初どこにあった？
          </>
        )
      }
      coach="冷蔵庫が行や列ごとに入れかわります。動きを目で追って、最後に聞かれる商品が最初どこにあったかを、最初の並びの盤でタップしてください"
    >
      <p className="un-caption">{phase === 'answer' ? '最初の並び：元の場所をタップ' : phase === 'result' ? '最初の並び' : phase === 'open' ? '扉が開きました' : ' '}</p>
      <div className={`un-board ${original ? 'original' : ''}`} key={original ? 'o' : 's'} style={{ ['--n' as string]: N, ['--dur' as string]: `${lv.ms}ms` }}>
        {q.goods.map((g, orig) => {
          const or = Math.floor(orig / N)
          const oc = orig % N
          const ready = order.rows.length === N
          const dr = original || !ready ? or : order.rows.indexOf(or)
          const dc = original || !ready ? oc : order.cols.indexOf(oc)
          const lift = !original && moving && ((moving.kind === 'row' && (dr === moving.a || dr === moving.b)) || (moving.kind === 'col' && (dc === moving.a || dc === moving.b)))
          const isTarget = orig === q.target
          const show = doorsOpen
          return (
            <button
              key={orig}
              className={`fr ${show ? 'open' : ''} ${lift ? 'lift' : ''} ${phase === 'open' && isTarget ? 'ask' : ''} ${phase === 'result' && isTarget ? 'right' : ''} ${phase === 'result' && picked === orig && !isTarget ? 'wrong' : ''} ${doorsOpen && !isTarget && !(phase === 'result' && picked === orig) ? 'dim' : ''}`}
              style={{ transform: `translate(${dc * 100}%, ${dr * 100}%)` }}
              onClick={() => answer(orig)}
              disabled={phase !== 'answer'}
              aria-label={phase === 'answer' ? `${or + 1}行目・${oc + 1}列目` : show ? g.name : '冷蔵庫'}
            >
              <span className="fr-in">{show ? <PIcon id={g.id} /> : <i className="fr-handle" />}</span>
            </button>
          )
        })}
      </div>
      {phase === 'answer' && (
        <div className="un-foot">
          <span className="un-target">
            <PIcon id={target.id} />
            {target.shortName ?? target.name}
          </span>
          <button
            className="btn ghost"
            disabled={replayed}
            onClick={() => {
              setReplayed(true)
              play(true)
            }}
          >
            {replayed ? '見直しは1回まで' : 'もう一度見る（判定が1段階下がる）'}
          </button>
        </div>
      )}
      {phase === 'result' && result && (
        <p className="un-result">
          {picked === q.target ? '正解！' : `正解は ${Math.floor(q.target / N) + 1}行目・${(q.target % N) + 1}列目`}（{result.sec}秒
          {replayed ? '・見直し1回' : ''}）
        </p>
      )}
    </Stage>
  )
}
