import BRAND from '#brand'
import { useEffect, useRef, useState } from 'react'
import { PIcon } from '../components/PIcon'
import { Sheet } from '../components/Sheet'
import { brainAge, type Prize } from '../data/config'
import { gameById } from '../data/games'
import { productById } from '../data/products'
import { GAME_COMPONENTS } from '../games'
import { PracticeContext, type Detail } from '../games/common'
import { sfx } from '../lib/sfx'
import {
  claimDaily,
  clearedToday,
  drawPrize,
  productsFor,
  recordPlay,
  usableCoupons,
  useStore,
  type PlayResult,
  type Reward,
} from '../store'

type Props = {
  gameId: string
  /** 今日の脳トレとして遊んでいるか */
  daily: boolean
  /** 端末の「戻る」が押されるたびに増える数 */
  back: number
  onExit: (stampsAdded: number) => void
  onProduct: (id: string) => void
}

const comment = (score: number) =>
  score >= 90 ? 'すばらしい！冷凍庫マスターです' : score >= 70 ? 'いい調子です！' : score >= 40 ? 'あと少し。その調子です' : 'あしたもう一度、ためしてみましょう'

export function Play({ gameId, daily, back, onExit, onProduct }: Props) {
  const { state, update } = useStore()
  const game = gameById(gameId)
  const Game = GAME_COMPONENTS[gameId]
  const [products] = useState(() => productsFor(state, gameId))

  const [phase, setPhase] = useState<'intro' | 'practice' | 'practiceDone' | 'play' | 'result'>('intro')
  // 練習（チュートリアル）：その脳トレを初めて遊ぶときと、今日の脳トレのときは毎回
  const needPractice = daily || !(state.tutorials ?? []).includes(gameId)
  // 練習の結果：ok＝正解、ng＝まちがい、skip＝とばした
  const [practiceOk, setPracticeOk] = useState<'ok' | 'ng' | 'skip'>('ng')
  const [practiceRun, setPracticeRun] = useState(0)
  const markTutorial = () => {
    if (!(state.tutorials ?? []).includes(gameId)) update((s) => void (s.tutorials = [...(s.tutorials ?? []), gameId]))
  }
  const [run, setRun] = useState(0)
  const [quit, setQuit] = useState(false)
  const [result, setResult] = useState<(PlayResult & { score: number; detail: Detail; learned: string[]; lottery: boolean }) | null>(null)
  const [lottery, setLottery] = useState<null | 'pick' | 'prize' | 'rewards'>(null)
  const [prize, setPrize] = useState<Prize | null>(null)
  const [rewards, setRewards] = useState<{ rewards: Reward[]; stampsAdded: number; first: boolean } | null>(null)

  // 端末の「戻る」：遊んでいる間は確認を出し、くじを引く前は戻れないようにする
  const firstBack = useRef(back)
  useEffect(() => {
    if (back === firstBack.current) return
    if (phase === 'play' || phase === 'practice') setQuit((q) => !q)
    else if (phase === 'intro' || !result?.lottery) onExit(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [back])

  const found = products.filter((p) => state.seen[p.id]?.includes(gameId))

  const finish = (score: number, learned: string[], detail: Detail) => {
    const lotteryReady = daily && !clearedToday(state)
    const r = update((s) => recordPlay(s, gameId, score, learned))
    setResult({ ...r, score, detail, learned: [...new Set(learned)], lottery: lotteryReady })
    setPhase('result')
    sfx('win')
  }

  const pick = () => {
    setPrize(drawPrize())
    setLottery('prize')
    sfx('win')
  }

  const claim = () => {
    if (!prize) return
    const out = update((s) => claimDaily(s, prize))
    setRewards(out)
    setLottery('rewards')
    sfx('stamp')
  }

  if (phase === 'practice' || phase === 'practiceDone') {
    return (
      <div className="gamewrap">
        <header className="play-bar">
          <button className="icon-btn" onClick={() => setQuit(true)} aria-label="やめる">
            ×
          </button>
          <h1>{game.name}</h1>
          {phase === 'practice' && (
            <button
              className="skip"
              onClick={() => {
                markTutorial()
                setPracticeOk('skip')
                setPhase('practiceDone')
              }}
            >
              練習をとばす
            </button>
          )}
        </header>
        {phase === 'practice' ? (
          <PracticeContext.Provider value={true}>
            <Game
              key={`p${practiceRun}`}
              products={products}
              onDone={(score) => {
                setPracticeOk(score > 0 ? 'ok' : 'ng')
                markTutorial()
                setPhase('practiceDone')
              }}
            />
          </PracticeContext.Provider>
        ) : (
          <div className="practice-done">
            <h2>練習おわり！</h2>
            <p>
              {practiceOk === 'ok'
                ? 'できました。この調子で本番にいきましょう。'
                : practiceOk === 'skip'
                  ? 'やり方がわからなくなったら、「もう一度練習する」でいつでも練習できます。'
                  : 'だいじょうぶ。やり方がわかれば本番でできます。'}
            </p>
            <p className="note">本番は全{game.questions}問です。正解が続くと、少しずつ難しくなります。</p>
            <button
              className="btn play"
              onClick={() => {
                sfx('tap')
                setPhase('play')
              }}
            >
              {BRAND.start}
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                setPracticeRun((n) => n + 1)
                setPhase('practice')
              }}
            >
              もう一度練習する
            </button>
          </div>
        )}
        {quit && (
          <Sheet title="やめますか？" onClose={() => setQuit(false)}>
            <button className="btn play" onClick={() => setQuit(false)}>
              つづける
            </button>
            <button className="btn ghost" onClick={() => onExit(0)}>
              やめる
            </button>
          </Sheet>
        )}
      </div>
    )
  }

  if (phase === 'play') {
    return (
      <div className="gamewrap">
        <header className="play-bar">
          <button className="icon-btn" onClick={() => setQuit(true)} aria-label="やめる">
            ×
          </button>
          <h1>
            {BRAND.playing && <small>{BRAND.playing}</small>}
            {game.name}
          </h1>
        </header>
        <Game key={run} products={products} onDone={finish} />
        {quit && (
          <Sheet title="途中でやめますか？" onClose={() => setQuit(false)}>
            <p className="note">ここまでの結果は記録されません。</p>
            <button className="btn play" onClick={() => setQuit(false)}>
              つづける
            </button>
            <button className="btn ghost" onClick={() => onExit(0)}>
              やめる
            </button>
          </Sheet>
        )}
      </div>
    )
  }

  if (phase === 'result' && result) {
    return (
      <div className="gamewrap">
        <header className="play-bar">
          <span className="icon-btn" />
          <h1>{game.name}</h1>
        </header>
        <div className="result-page">
          <p className="done-tag">{BRAND.done}</p>
          <p className="score">
            <b>{result.score}</b>点{result.isBest && <span className="best">自己ベスト更新！</span>}
          </p>
          <p className="age">
            冷凍庫脳年齢 <b>{brainAge(result.score)}</b>歳
          </p>
          <p className="breakdown">
            正確さ <b>{result.detail.accuracy}</b>点 ＋ 速さ <b>{result.detail.speed}</b>点
          </p>
          <p className="comment">{comment(result.score)}</p>

          {result.learned.length > 0 && (
            <section className="seen-box">
              <h3>
                正解して覚えた商品
                {result.newProducts.length > 0 && <em>図鑑に{result.newProducts.length}品 登録</em>}
              </h3>
              <ul>
                {result.learned.slice(0, 16).map((id) => {
                  const p = productById(id)
                  const coupon = usableCoupons(state, p).length > 0
                  return (
                    <li key={id}>
                      <button className={coupon ? 'has-coupon' : ''} onClick={() => onProduct(id)} aria-label={p.name}>
                        <span><PIcon id={p.id} /></span>
                        {result.newProducts.includes(id) ? <i>NEW</i> : result.starUps.includes(id) && <i className="star">★UP</i>}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="note">
                <small>
                  タップすると商品の説明が見られます
                  {result.learned.some((id) => usableCoupons(state, productById(id)).length > 0) && '。黄色のわくは、持っているクーポンが使える商品です'}
                </small>
              </p>
            </section>
          )}

          {result.lottery ? (
            <button className="btn play" onClick={() => setLottery('pick')}>
              スタンプくじを引く
            </button>
          ) : (
            <>
              <button
                className="btn play"
                onClick={() => {
                  setResult(null)
                  setRun(run + 1)
                  setPhase('play')
                }}
              >
                もう一度
              </button>
              <button className="btn ghost" onClick={() => onExit(0)}>
                もどる
              </button>
            </>
          )}
        </div>

        {lottery && (
          <Sheet title={lottery === 'rewards' ? 'うけとりました' : 'クリア！スタンプくじ'}>
            {lottery === 'pick' && (
              <>
                <p className="note">氷を1つ えらんでください</p>
                <div className="cubes">
                  {[1, 2, 3].map((i) => (
                    <button key={i} onClick={pick} aria-label={`氷 ${i}`}>
                      🧊
                    </button>
                  ))}
                </div>
              </>
            )}
            {lottery === 'prize' && prize && (
              <div className="result">
                <p className="result-big">{prize.kind === 'stamp' ? `スタンプ ${prize.amount}個` : `交換チケット ${prize.amount}枚`}</p>
                <p className="note">{prize.kind === 'stamp' ? 'スタンプカードに押します' : '大当たり！クーポンと交換できます'}</p>
                <button className="btn play" onClick={claim}>
                  うけとる
                </button>
              </div>
            )}
            {lottery === 'rewards' && rewards && (
              <>
                <ul className="rewards">
                  {rewards.rewards.map((r) => (
                    <li key={r.text} className={r.kind}>
                      {r.text}
                    </li>
                  ))}
                </ul>
                {rewards.first && (
                  <div className="howto">
                    <b>スタンプが10個たまると、交換チケットが1枚もらえます。</b>
                    チケットは「クーポン」でお店の割引クーポンと交換できます。あしたも今日の脳トレをクリアすると、またくじが引けます。
                  </div>
                )}
                <button className="btn play" onClick={() => onExit(rewards.stampsAdded)}>
                  ホームへ
                </button>
              </>
            )}
          </Sheet>
        )}
      </div>
    )
  }

  return (
    <div className="gamewrap">
      <header className="play-bar">
        <button className="icon-btn" onClick={() => onExit(0)} aria-label="もどる">
          ‹
        </button>
        <h1>{daily ? '今日の脳トレ' : '脳トレ'}</h1>
      </header>
      <div className="intro">
        <div className="intro-icon" aria-hidden="true">
          {game.icon}
        </div>
        <p className="chips center">
          <span className={`chip cat-${game.category}`}>{game.category}</span>
          <span className="chip plain">
            全{game.questions}問・約{game.minutes}分
          </span>
        </p>
        <h2>{game.name}</h2>
        <p className="rule">
          {game.rule}
          <small>点数は「正確さ70点＋速さ30点」。正解した問題の商品が、図鑑に登録されます。</small>
        </p>

        {/* 商品を使わない脳トレ（計量カップなど）では出さない */}
        {products.length > 0 && (
          <section className="seen-box">
            <h3>
              登場する商品
              <em>
                見つけた {found.length} / {products.length}
              </em>
            </h3>
            <ul>
              {products.map((p) => {
                const ok = found.includes(p)
                return (
                  <li key={p.id}>
                    {ok ? (
                      <button onClick={() => onProduct(p.id)} aria-label={p.name}>
                        <span><PIcon id={p.id} /></span>
                      </button>
                    ) : (
                      <div className="unknown" aria-label="まだ見つけていない商品">
                        ？
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {needPractice && <p className="practice-note">はじめに、練習問題を1問やってみます（点数には入りません）</p>}
        <button
          className="btn play"
          onClick={() => {
            sfx('tap')
            setPhase(needPractice ? 'practice' : 'play')
          }}
        >
          {needPractice ? '練習してから始める' : BRAND.start}
        </button>
        {needPractice && (
          <button
            className="btn ghost"
            onClick={() => {
              sfx('tap')
              markTutorial()
              setPhase('play')
            }}
          >
            練習せずに始める
          </button>
        )}
      </div>
    </div>
  )
}
