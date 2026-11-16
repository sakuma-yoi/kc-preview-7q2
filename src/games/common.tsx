import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SCORE_ACCURACY, SCORE_SPEED } from '../data/config'
import type { Product } from '../data/products'
import { sfx } from '../lib/sfx'
import { shuffle } from '../lib/util'

/** 点数の内訳 */
export type Detail = { accuracy: number; speed: number }

export type GameProps = {
  products: Product[]
  /** score は 0〜100、learned は正解した問題に出てきた商品 */
  onDone: (score: number, learned: string[], detail: Detail) => void
}

/** 速さの基準（秒）。fast 以内なら速さ満点、slow を超えると速さ0点 */
export type Pace = { fast: number; slow: number }

/** 問題の進行・得点（正確さ＋速さ）・覚えた商品をまとめて管理する */
export function useRounds(total: number, onDone: GameProps['onDone'], pace: Pace) {
  const [round, setRound] = useState(0)
  const [mark, setMark] = useState<null | 'ok' | 'ng'>(null)
  const roundRef = useRef(0)
  const accuracy = useRef(0)
  const speed = useRef(0)
  const learned = useRef<string[]>([])
  const pending = useRef<string[]>([])
  const clock = useRef(performance.now())
  const busy = useRef(false)
  const alive = useRef(true)
  // 途中でやめたあとに、結果が記録されないようにする
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  /** この問題に出ている商品を伝える（正解すると図鑑に記録される） */
  const see = (ids: string[]) => {
    for (const id of ids) if (!pending.current.includes(id)) pending.current.push(id)
  }

  /** 答えられるようになった時点で呼ぶ（覚える時間は速さに数えない） */
  const startClock = () => {
    clock.current = performance.now()
  }

  /** 1問の結果を受け取り、◯✕を出してから次へ進む。ids を渡すと、その商品だけを記録する */
  const answer = (points: number, ok: boolean, delay = 900, ids?: string[]) => {
    if (busy.current) return
    busy.current = true
    const t = (performance.now() - clock.current) / 1000
    const quick = Math.max(0, Math.min(1, 1 - (t - pace.fast) / (pace.slow - pace.fast)))
    accuracy.current += points * SCORE_ACCURACY
    speed.current += points * SCORE_SPEED * quick
    learned.current.push(...new Set(ids ?? (ok ? pending.current : [])))
    setMark(ok ? 'ok' : 'ng')
    sfx(ok ? 'ok' : 'ng')
    window.setTimeout(() => {
      if (!alive.current) return
      busy.current = false
      setMark(null)
      if (roundRef.current + 1 >= total) {
        const score = Math.max(0, Math.min(100, Math.round(accuracy.current + speed.current)))
        const acc = Math.min(score, Math.round(accuracy.current))
        onDone(score, learned.current, { accuracy: acc, speed: score - acc })
      } else {
        pending.current = []
        clock.current = performance.now()
        roundRef.current += 1
        setRound(roundRef.current)
      }
    }, delay)
  }

  return { round, total, mark, see, startClock, answer }
}

type StageProps = { r: ReturnType<typeof useRounds>; question: ReactNode; children: ReactNode }

export function Stage({ r, question, children }: StageProps) {
  return (
    <div className="stage">
      <div className="stage-top">
        <span className="q-no">
          第{r.round + 1}問<small> / 全{r.total}問</small>
        </span>
        <span className="q-dots" aria-hidden="true">
          {Array.from({ length: r.total }, (_, i) => (
            <i key={i} className={i < r.round ? 'past' : i === r.round ? 'now' : ''} />
          ))}
        </span>
      </div>
      <p className="q-text">{question}</p>
      {children}
      {r.mark && (
        <div className={`mark ${r.mark}`} role="status">
          {r.mark === 'ok' ? '◯' : '✕'}
        </div>
      )}
    </div>
  )
}

/** 正解と、それに近い数字の4択を作る */
export function numberChoices(correct: number, deltas: number[], min: number) {
  const set = new Set([correct])
  for (const d of shuffle(deltas)) {
    if (set.size === 4) break
    if (correct + d >= min) set.add(correct + d)
  }
  return shuffle([...set])
}
