// 考える脳トレ：霜とりスイーパー・計量カップ

import { useEffect, useMemo, useRef, useState } from 'react'
import { PIcon } from '../components/PIcon'
import { CUPS, CUPS_SEC_BASE, CUPS_SEC_PER_STEP, PACE, SWEEPER, SWEEPER_PENALTY } from '../data/levels'
import type { Product } from '../data/products'
import { sfx } from '../lib/sfx'
import { randInt, shuffle } from '../lib/util'
import { Stage, useRounds, type GameProps, type Grade } from './common'

/* ---------- 霜とりスイーパー ---------- */

/** となりの8マス */
function around(i: number, rows: number, cols: number) {
  const r = Math.floor(i / cols)
  const c = i % cols
  const out: number[] = []
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const rr = r + dr
      const cc = c + dc
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.push(rr * cols + cc)
    }
  return out
}

/**
 * いま開いているマスから、数字だけでどこまで解けるか（やさしい手筋だけで調べる）
 * 解けたところまでで開いたマスを返す。全部開けば、運にたよらず最後まで解ける
 */
function solveFrom(start: Set<number>, hidden: boolean[], nums: number[], rows: number, cols: number) {
  const n = rows * cols
  const total = hidden.filter(Boolean).length
  const opened = new Set(start)
  const mines = new Set<number>()
  let progress = true
  while (progress) {
    progress = false
    const safe = new Set<number>()
    const found = new Set<number>()
    const facts: { unknown: number[]; left: number }[] = []
    for (const i of opened) {
      const nb = around(i, rows, cols)
      const unknown = nb.filter((j) => !opened.has(j) && !mines.has(j))
      if (!unknown.length) continue
      const left = nums[i] - nb.filter((j) => mines.has(j)).length
      if (left === 0) unknown.forEach((j) => safe.add(j))
      else if (left === unknown.length) unknown.forEach((j) => found.add(j))
      else facts.push({ unknown, left })
    }
    // 2つの数字をくらべる手筋（片方のマスがもう片方にふくまれるとき）
    for (const a of facts)
      for (const b of facts) {
        if (a === b || !a.unknown.every((j) => b.unknown.includes(j))) continue
        const rest = b.unknown.filter((j) => !a.unknown.includes(j))
        if (!rest.length) continue
        if (b.left - a.left === 0) rest.forEach((j) => safe.add(j))
        else if (b.left - a.left === rest.length) rest.forEach((j) => found.add(j))
      }
    // 残りの商品の数を使う手筋（かくれている商品の数は画面に出ている）
    const unknownAll = Array.from({ length: n }, (_, i) => i).filter((i) => !opened.has(i) && !mines.has(i))
    if (mines.size === total) unknownAll.forEach((j) => safe.add(j))
    else if (total - mines.size === unknownAll.length) unknownAll.forEach((j) => found.add(j))
    for (const j of found) if (!mines.has(j)) (mines.add(j), (progress = true))
    for (const j of safe) if (!opened.has(j)) (opened.add(j), (progress = true))
  }
  return opened
}

/**
 * 盤を作る。はじめから削ってあるマス（opened）も決める
 * 手がかりがなくなって運まかせに削るしかない場面が出ないように、行きづまるところでは、そのとなりの霜を1つ先に削っておく
 * 先に削っておくマスがなるべく少ない盤を選ぶ（少しずつ削り進められるように）
 */
function makeBoard(rows: number, cols: number, items: number, start: number) {
  const n = rows * cols
  const safeCount = n - items
  const all = Array.from({ length: n }, (_, i) => i)
  let best: { hidden: boolean[]; nums: number[]; opened: Set<number>; extra: number } | null = null
  for (let t = 0; t < 300; t++) {
    const hidden = Array<boolean>(n).fill(false)
    for (const i of shuffle(all).slice(0, items)) hidden[i] = true
    const nums = hidden.map((_, i) => around(i, rows, cols).filter((j) => hidden[j]).length)
    const opened = new Set(shuffle(all.filter((i) => !hidden[i])).slice(0, start))
    let extra = 0
    for (;;) {
      const solved = solveFrom(opened, hidden, nums, rows, cols)
      if (solved.size === safeCount) break
      // 行きづまった：解けたところのとなりにある霜（商品ではないもの）を1つ、はじめから削っておく
      const edge = shuffle(all.filter((i) => !hidden[i] && !solved.has(i) && around(i, rows, cols).some((j) => solved.has(j))))
      opened.add(edge[0] ?? all.find((i) => !hidden[i] && !solved.has(i))!)
      extra += 1
    }
    // はじめから開いているのが安全なマスの半分をこえる盤は、削る楽しみが少ないので使わない
    if (opened.size > safeCount / 2) continue
    if (!best || extra < best.extra) best = { hidden, nums, opened, extra }
    if (extra === 0) break
  }
  return best!
}

type Board = { hidden: boolean[]; nums: number[]; opened: Set<number>; goods: (Product | null)[] }

export function Sweeper({ products, onDone }: GameProps) {
  const r = useRounds(3, onDone, PACE.sweeper, SWEEPER.length)
  const lv = SWEEPER[r.level]
  const n = lv.rows * lv.cols
  // 盤は問題ごとに作る（はじめからいくつかのマスを削っておく）
  const board = useMemo<Board>(() => {
    const made = makeBoard(lv.rows, lv.cols, lv.items, lv.start)
    // かくす商品（商品が少ないときは同じ商品を2回使う）
    const pool = shuffle(products)
    let k = 0
    return { ...made, goods: made.hidden.map((h) => (h ? pool[k++ % pool.length] : null)) }
  }, [r.round]) // eslint-disable-line react-hooks/exhaustive-deps
  const [opened, setOpened] = useState<Set<number>>(board.opened)
  const [marked, setMarked] = useState<Set<number>>(new Set())
  const [broken, setBroken] = useState<number[]>([])
  const [mode, setMode] = useState<'dig' | 'mark'>('dig')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setOpened(new Set(board.opened))
    setMarked(new Set())
    setBroken([])
    setMode('dig')
    setDone(false)
    r.see(board.goods.filter((g): g is Product => !!g).map((g) => g.id))
  }, [board]) // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (i: number) => {
    if (done || opened.has(i)) return
    if (mode === 'mark') {
      const m = new Set(marked)
      if (m.has(i)) m.delete(i)
      else m.add(i)
      setMarked(m)
      sfx('tap')
      return
    }
    if (marked.has(i)) return
    const b = board
    const o = new Set(opened)
    let br = broken
    if (b.hidden[i]) {
      // 商品を削ってしまった：割れた商品が出てくる（ここで終わりにはしない）
      o.add(i)
      br = [...broken, i]
      setBroken(br)
      sfx('ng')
    } else {
      // 1マスずつ削る（まわりに商品がなくても、一気には開かない）
      o.add(i)
      sfx('tap')
    }
    setOpened(o)
    const safeLeft = Array.from({ length: n }, (_, j) => j).filter((j) => !b.hidden[j] && !o.has(j)).length
    if (safeLeft === 0) {
      setDone(true)
      const miss = br.length
      // 割った数：0個◎、1個○、2個△、3個以上✕
      const grade: Grade = miss === 0 ? 'great' : miss === 1 ? 'good' : miss === 2 ? 'fair' : 'bad'
      const ids = b.goods.filter((g): g is Product => !!g).map((g) => g.id)
      r.answer(Math.max(5, Math.round(100 / r.total) - SWEEPER_PENALTY * miss), grade, 2200, grade === 'bad' ? [] : ids)
    }
  }

  const left = lv.items - marked.size - broken.filter((i) => !marked.has(i)).length

  return (
    <Stage
      r={r}
      question={`霜の下に商品が ${lv.items}個 かくれています。商品を割らないように、霜だけを全部削ってください`}
      coach="白いマスは、もう削ってあるところです（数字がないマスは、まわりに商品がありません）。数字は、まわり8マスにかくれている商品の数。数字をヒントに、商品のない霜をタップして削ります。商品がありそうなマスは「印をつける」にして、タップで印をつけておきましょう"
    >
      <div className={`sweeper c${lv.cols}`} style={{ gridTemplateColumns: `repeat(${lv.cols}, 1fr)` }}>
        {Array.from({ length: n }, (_, i) => {
          const open = opened.has(i) || (done && !!board?.hidden[i])
          const good = board?.goods[i]
          const isBroken = broken.includes(i)
          return (
            <button
              key={`${r.round}-${i}`}
              className={`sw ${open ? 'open' : 'frost'} ${isBroken ? 'broken' : ''} ${good && open ? 'good' : ''} ${marked.has(i) && !open ? 'marked' : ''}`}
              onClick={() => tap(i)}
              aria-label={
                open
                  ? good
                    ? `${good.name}${isBroken ? '（割れた）' : ''}`
                    : board && board.nums[i]
                      ? `まわりに${board.nums[i]}個`
                      : 'なにもない'
                  : marked.has(i)
                    ? '印をつけた霜'
                    : '霜'
              }
            >
              {open && good ? (
                <PIcon id={good.id} />
              ) : open && board && board.nums[i] > 0 ? (
                <b className={`n${board.nums[i]}`}>{board.nums[i]}</b>
              ) : !open && marked.has(i) ? (
                <span className="pin">📌</span>
              ) : null}
            </button>
          )
        })}
      </div>
      <p className="hud">
        <span>
          のこりの商品 <b>{Math.max(0, left)}</b>個
        </span>
        <span>
          割った商品 <b>{broken.length}</b>個
        </span>
      </p>
      <div className="seg sw-mode" role="radiogroup" aria-label="タップしたときの動き">
        <button role="radio" aria-checked={mode === 'dig'} className={mode === 'dig' ? 'on' : ''} onClick={() => setMode('dig')}>
          ⛏️ 霜を削る
        </button>
        <button role="radio" aria-checked={mode === 'mark'} className={mode === 'mark' ? 'on' : ''} onClick={() => setMode('mark')}>
          📌 印をつける
        </button>
      </div>
    </Stage>
  )
}

/* ---------- 計量カップ ---------- */

type Move = { kind: 'fill'; i: number } | { kind: 'empty'; i: number } | { kind: 'pot'; i: number } | { kind: 'move'; i: number; j: number }
type CupState = { cups: number[]; pot: number }

function applyMove(s: CupState, m: Move, caps: number[]): CupState {
  const cups = [...s.cups]
  let pot = s.pot
  if (m.kind === 'fill') cups[m.i] = caps[m.i]
  else if (m.kind === 'empty') cups[m.i] = 0
  else if (m.kind === 'pot') {
    pot += cups[m.i]
    cups[m.i] = 0
  } else {
    const w = Math.min(cups[m.i], caps[m.j] - cups[m.j])
    cups[m.i] -= w
    cups[m.j] += w
  }
  return { cups, pot }
}

/** いちばん少ない手順（鍋に入れすぎたら作れないので、その先は数えない）。addOnly は「量って鍋に足す」だけで作るとき */
function solveCups(caps: number[], target: number, addOnly: boolean): Move[] | null {
  const moves: Move[] = []
  caps.forEach((_, i) => {
    moves.push({ kind: 'fill', i }, { kind: 'pot', i })
    if (!addOnly) {
      moves.push({ kind: 'empty', i })
      caps.forEach((__, j) => i !== j && moves.push({ kind: 'move', i, j }))
    }
  })
  const key = (s: CupState) => `${s.cups.join(',')}|${s.pot}`
  const start: CupState = { cups: caps.map(() => 0), pot: 0 }
  const prev = new Map<string, { from: string; move: Move } | null>([[key(start), null]])
  const queue: CupState[] = [start]
  while (queue.length) {
    const s = queue.shift()!
    if (s.pot === target) {
      const path: Move[] = []
      let k = key(s)
      while (prev.get(k)) {
        const p = prev.get(k)!
        path.unshift(p.move)
        k = p.from
      }
      return path
    }
    for (const m of moves) {
      const t = applyMove(s, m, caps)
      if (t.pot > target) continue
      const k = key(t)
      if (prev.has(k)) continue
      prev.set(k, { from: key(s), move: m })
      queue.push(t)
    }
  }
  return null
}

const ml = (n: number) => (n >= 1000 && n % 100 === 0 ? `${n / 1000}L` : `${n}ml`)

function moveLabel(m: Move, caps: number[]) {
  const c = (i: number) => `${ml(caps[i])}カップ`
  if (m.kind === 'fill') return `${c(m.i)}に蛇口で水をいっぱい入れる`
  if (m.kind === 'empty') return `${c(m.i)}の水を流しに捨てる`
  if (m.kind === 'pot') return `${c(m.i)}の水を鍋に注ぐ`
  return `${c(m.i)}から${c(m.j)}に移す`
}

/** レベルに合う問題を作る（カップの大きさと、鍋に入れる量） */
function makeCups(level: number) {
  const lv = CUPS[level]
  for (let t = 0; t < 300; t++) {
    const caps = lv.caps[randInt(lv.caps.length)]
    const target = 100 * (1 + randInt(20))
    if (caps.includes(target)) continue
    const add = solveCups(caps, target, true)
    const best = solveCups(caps, target, false)
    if (!best || best.length < lv.steps[0] || best.length > lv.steps[1]) continue
    // add：足すだけで作れて、移しかえても近道にならない問題。move：移しかえないと作れない問題
    if (lv.kind === 'add' ? !add || add.length !== best.length : add) continue
    return { caps, target, best }
  }
  // 見つからなかったとき（ふつうは起きない）
  const caps = [300, 500]
  return { caps, target: 800, best: solveCups(caps, 800, false)! }
}

const DOWN: Record<Grade, Grade> = {
  great: 'good',
  good: 'fair',
  fair: 'bad',
  bad: 'bad',
}

export function Cups({ onDone }: GameProps) {
  const r = useRounds(5, onDone, PACE.cups, CUPS.length)
  const q = useMemo(() => makeCups(r.level), [r.round]) // eslint-disable-line react-hooks/exhaustive-deps
  const [s, setS] = useState<CupState>({ cups: [0, 0], pot: 0 })
  const [steps, setSteps] = useState(0)
  /** 選んでいるカップ（null＝選んでいない） */
  const [sel, setSel] = useState<number | null>(null)
  const [nudge, setNudge] = useState(0)
  const [result, setResult] = useState<null | { grade: Grade; sec: number; slow: boolean; gaveUp: boolean }>(null)
  const started = useRef(performance.now())
  useEffect(() => {
    setS({ cups: q.caps.map(() => 0), pot: 0 })
    setSteps(0)
    setSel(null)
    setResult(null)
    started.current = performance.now()
  }, [q])

  const guide = q.best.length * CUPS_SEC_PER_STEP + CUPS_SEC_BASE
  const over = s.pot > q.target
  const locked = !!result || over

  const finish = (used: number, gaveUp: boolean) => {
    const sec = Math.round((performance.now() - started.current) / 1000)
    const extra = used - q.best.length
    // 手順：いちばん少ないなら◎、+1〜2手で○、+3〜4手で△、それ以上か「あきらめる」で✕。目安の時間をこえたら1段階下げる
    let grade: Grade = gaveUp ? 'bad' : extra <= 0 ? 'great' : extra <= 2 ? 'good' : extra <= 4 ? 'fair' : 'bad'
    const slow = !gaveUp && sec > guide
    if (slow) grade = DOWN[grade]
    setSel(null)
    setResult({ grade, sec, slow, gaveUp })
    const base = Math.round(100 / r.total)
    const pts = { great: base, good: Math.round(base * 0.75), fair: Math.round(base * 0.5), bad: gaveUp ? 0 : Math.round(base * 0.15) }[grade]
    r.answer(pts, grade, 4200, [])
  }

  /** 選んでいるカップから、その行き先で動かせるか */
  const can = (m: Move) => {
    if (locked) return false
    const t = applyMove(s, m, q.caps)
    return t.cups.join() !== s.cups.join() || t.pot !== s.pot
  }

  const act = (m: Move) => {
    if (!can(m)) return
    const t = applyMove(s, m, q.caps)
    sfx(m.kind === 'pot' ? 'coin' : 'tap')
    setS(t)
    // 1つ動かしたら、選ぶのをやめる
    setSel(null)
    const used = steps + 1
    setSteps(used)
    if (t.pot === q.target) finish(used, false)
  }

  /** 行き先（蛇口・鍋・流し）を押したとき。カップを選んでいなければ案内を出す */
  const toTarget = (kind: 'fill' | 'pot' | 'empty') => {
    if (locked) return
    if (sel === null) return setNudge((n) => n + 1)
    act({ kind, i: sel })
  }

  const onCup = (i: number) => {
    if (locked) return
    if (sel === null) {
      sfx('tap')
      setNudge(0)
      return setSel(i)
    }
    // 同じカップをもう一度押すと、選ぶのをやめる
    if (sel === i) return setSel(null)
    act({ kind: 'move', i: sel, j: i })
  }

  const hot = (m: Move | null) => (sel !== null && m && can(m) ? 'can' : '')

  return (
    <Stage
      r={r}
      question={
        <>
          カップで量って、鍋の水を <b>{ml(q.target)}</b> にしてください
        </>
      }
      coach="まずカップをタップして選びます。次に、蛇口（水を入れる）・鍋（注ぐ）・もう1つのカップ（移す）・流し（捨てる）のどれかをタップします。1回動かすたびに、カップを選び直します"
    >
      <div className="kitchen">
        <button className={`tg faucet ${hot(sel === null ? null : { kind: 'fill', i: sel })}`} onClick={() => toTarget('fill')} aria-label="蛇口：選んだカップに水をいっぱい入れる">
          <span className="tg-ico" aria-hidden="true">
            🚰
          </span>
          <span className="tg-name">蛇口</span>
        </button>
        <button className={`tg pot-btn ${hot(sel === null ? null : { kind: 'pot', i: sel })}`} onClick={() => toTarget('pot')} aria-label={`鍋：いま${ml(s.pot)}（目標 ${ml(q.target)}）。選んだカップの水を注ぐ`}>
          <span className={`pot ${over ? 'over' : ''} ${s.pot === q.target ? 'ok' : ''}`}>
            <i style={{ height: `${Math.min(100, (s.pot / (q.target * 1.25)) * 100)}%` }} />
            <span className="pot-line" style={{ bottom: `${(1 / 1.25) * 100}%` }}>
              {ml(q.target)}
            </span>
            <b>{ml(s.pot)}</b>
          </span>
          <span className="tg-name">鍋</span>
        </button>
        <button className={`tg sink ${hot(sel === null ? null : { kind: 'empty', i: sel })}`} onClick={() => toTarget('empty')} aria-label="流し：選んだカップの水を捨てる">
          <span className="sink-basin" aria-hidden="true">
            <i />
          </span>
          <span className="tg-name">流し</span>
        </button>
      </div>

      <p className={`cups-status ${sel !== null ? 'on' : ''}`} key={nudge} data-nudge={nudge > 0 && sel === null ? '1' : undefined}>
        {result ? (
          <span>
            手順 <b>{steps}</b>手
          </span>
        ) : over ? (
          <span className="cups-warn">鍋の水が多すぎます。「はじめから」でやり直せます</span>
        ) : sel === null ? (
          <>
            <span>{nudge > 0 ? '先にカップをタップして選んでください' : 'カップをタップして選んでください'}</span>
            <small>手順 {steps}手</small>
          </>
        ) : (
          <>
            <span>
              <b>{ml(q.caps[sel])}カップ</b>を選んでいます。行き先をタップ
            </span>
            <small>手順 {steps}手</small>
          </>
        )}
      </p>

      <div className="cups" style={{ gridTemplateColumns: `repeat(${q.caps.length}, 1fr)` }}>
        {q.caps.map((cap, i) => (
          <button
            key={i}
            className={`tg cup-tg ${sel === i ? 'sel' : ''} ${sel === null && !locked ? 'pick' : ''} ${sel !== null && sel !== i ? hot({ kind: 'move', i: sel, j: i }) : ''}`}
            onClick={() => onCup(i)}
            aria-pressed={sel === i}
            aria-label={`${ml(cap)}カップ：いま${ml(s.cups[i])}${sel === i ? '（選んでいます。もう一度タップでやめる）' : sel !== null ? '（ここに移す）' : ''}`}
          >
            <span className="cup">
              <i style={{ height: `${(s.cups[i] / cap) * 100}%` }} />
              <b>{ml(s.cups[i])}</b>
            </span>
            <span className="tg-name">{ml(cap)}カップ</span>
          </button>
        ))}
      </div>

      {result ? (
        <div className="change-result">
          <p>
            手順 <b>{result.gaveUp ? '―' : `${steps}手`}</b>（いちばん少ないのは {q.best.length}手）・時間 {result.sec}秒（目安 {guide}秒）
            {result.slow && '：目安をこえたので1段階下がりました'}
          </p>
          <ol className="cups-answer">
            {q.best.map((m, k) => (
              <li key={k}>{moveLabel(m, q.caps)}</li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="ops-pair">
          <button
            className="btn ghost"
            disabled={steps === 0}
            onClick={() => {
              // やり直しても、手順の数は続きから数える
              setS({ cups: q.caps.map(() => 0), pot: 0 })
              setSel(null)
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
