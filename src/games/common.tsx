import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { SCORE_ACCURACY, SCORE_SPEED } from '../data/config'
import { MISSES_TO_DOWN } from '../data/levels'
import type { Product } from '../data/products'
import { sfx } from '../lib/sfx'
import { useStore } from '../store'
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

/** 判定の4段階：◎ great、○ good、△ fair、✕ bad */
export type Grade = 'great' | 'good' | 'fair' | 'bad'
export const GRADE_MARK: Record<Grade, string> = { great: '◎', good: '○', fair: '△', bad: '✕' }

/** 次のレベルの決め方。up＝1つ上げる、keep＝そのまま、miss＝まちがい（続くと下がる） */
export type Step = 'up' | 'keep' | 'miss'

/**
 * 問題の進行・得点（正確さ＋速さ）・覚えた商品・難しさのレベルをまとめて管理する
 * levels はレベルの数（src/data/levels.ts の表の行数）。1問目はレベル0から
 */
/** 練習（チュートリアル）中か。練習では1問だけ、いちばんやさしいレベルで、時間制限もなし */
export const PracticeContext = createContext(false)
export const usePractice = () => useContext(PracticeContext)

export function useRounds(totalQuestions: number, onDone: GameProps['onDone'], pace: Pace, levels = 1) {
  const practice = useContext(PracticeContext)
  const total = practice ? 1 : totalQuestions
  const [round, setRound] = useState(0)
  const [level, setLevel] = useState(0)
  const levelRef = useRef(0)
  const misses = useRef(0)
  const [mark, setMark] = useState<null | Grade>(null)
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

  /**
   * 1問の結果を受け取り、◎○△✕を出してから次へ進む。ids を渡すと、その商品だけを記録する
   * result は true（◎）、false（✕）、または4段階の判定
   * step を省くと、◎ならレベルを上げ、○はそのまま、△✕は「まちがい」として数える
   */
  const answer = (points: number, result: boolean | Grade, delay = 900, ids?: string[], step?: Step) => {
    if (busy.current) return
    busy.current = true
    const grade: Grade = result === true ? 'great' : result === false ? 'bad' : result
    const ok = grade !== 'bad'
    const t = (performance.now() - clock.current) / 1000
    const quick = Math.max(0, Math.min(1, 1 - (t - pace.fast) / (pace.slow - pace.fast)))
    accuracy.current += points * SCORE_ACCURACY
    speed.current += points * SCORE_SPEED * quick
    learned.current.push(...new Set(ids ?? (ok ? pending.current : [])))
    setMark(grade)
    sfx(grade === 'great' ? 'ok' : grade === 'bad' ? 'ng' : 'soft')
    window.setTimeout(() => {
      if (!alive.current) return
      busy.current = false
      setMark(null)
      if (roundRef.current + 1 >= total) {
        const score = Math.max(0, Math.min(100, Math.round(accuracy.current + speed.current)))
        const acc = Math.min(score, Math.round(accuracy.current))
        onDone(score, learned.current, { accuracy: acc, speed: score - acc })
      } else {
        const s = step ?? (grade === 'great' ? 'up' : grade === 'good' ? 'keep' : 'miss')
        if (s === 'up') {
          levelRef.current = Math.min(levels - 1, levelRef.current + 1)
          misses.current = 0
        } else if (s === 'miss') {
          misses.current += 1
          if (misses.current >= MISSES_TO_DOWN) {
            levelRef.current = Math.max(0, levelRef.current - 1)
            misses.current = 0
          }
        }
        pending.current = []
        clock.current = performance.now()
        roundRef.current += 1
        setLevel(levelRef.current)
        setRound(roundRef.current)
      }
    }, delay)
  }

  return { round, level, levels, total, mark, see, startClock, answer }
}

type StageProps = {
  r: ReturnType<typeof useRounds>
  question: ReactNode
  /** 練習のときだけ出す、いまやることの案内 */
  coach?: string
  children: ReactNode
}

export function Stage({ r, question, coach, children }: StageProps) {
  const { state } = useStore()
  const practice = useContext(PracticeContext)
  // いまの難しさ（試しに表示。運営メニューで消せる）
  const showLevel = !practice && state.settings.showLevel !== false && r.levels > 1
  return (
    <div className={`stage ${practice ? 'practice' : ''}`}>
      {practice && (
        <div className="coach" role="note" key={coach}>
          <span className="coach-tag">練習</span>
          <p>{coach ?? 'やってみましょう。点数には入りません'}</p>
        </div>
      )}
      <div className="stage-top">
        <span className="q-no">
          {practice ? '練習問題' : <>第{r.round + 1}問<small> / 全{r.total}問</small></>}
          {showLevel && (
            <span className="lv-chip" key={r.level}>
              レベル {r.level + 1}
              <small> / {r.levels}</small>
            </span>
          )}
        </span>
        <span className="q-dots" aria-hidden="true">
          {Array.from({ length: r.total }, (_, i) => (
            <i key={i} className={i < r.round ? 'past' : i === r.round ? 'now' : ''} />
          ))}
        </span>
      </div>
      <p className="q-text">
        <span>{question}</span>
      </p>
      {children}
      {r.mark && (
        <div className={`mark ${r.mark}`} role="status">
          {GRADE_MARK[r.mark]}
        </div>
      )}
    </div>
  )
}

/** 正解と、差が gaps のどれかになる数字で4択を作る（上下どちらにもずらす） */
export function numberChoices(correct: number, gaps: number[], min: number) {
  const set = new Set([correct])
  for (const d of shuffle(gaps.flatMap((g) => [g, -g]))) {
    if (set.size === 4) break
    if (correct + d >= min) set.add(correct + d)
  }
  return shuffle([...set])
}
