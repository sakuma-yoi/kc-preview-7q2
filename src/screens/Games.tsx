import { useState } from 'react'
import { AgeChart } from '../components/AgeChart'
import { brainAge } from '../data/config'
import { CATEGORIES, GAMES, type Category } from '../data/games'
import { daysToNewGame, useStore } from '../store'

type Props = { onPlay: (gameId: string, daily: boolean) => void; onHome: () => void }

export function Games({ onPlay, onHome }: Props) {
  const { state } = useStore()
  const [cat, setCat] = useState<Category | 'すべて'>('すべて')
  const toNew = daysToNewGame(state)
  const list = GAMES.filter((g) => cat === 'すべて' || g.category === cat)
  const ownedCount = state.owned.length

  return (
    <div className="page">
      <div className="page-head">
        <h2>脳トレ</h2>
        <p>
          遊べる脳トレ <b>{ownedCount}</b> / {GAMES.length}
        </p>
      </div>

      {toNew !== null && (
        <button className="news" onClick={onHome} disabled={toNew > 0}>
          {toNew === 0 ? (
            <>
              <b>あたらしい脳トレ</b>が届いています。今日の脳トレでクリアすると、いつでも遊べます ›
            </>
          ) : (
            <>
              今日の脳トレを あと<b>{toNew}日</b>クリアすると、<b>あたらしい脳トレ</b>が届きます
            </>
          )}
        </button>
      )}

      <AgeChart />

      <div className="filter" role="group" aria-label="分類でしぼる">
        {(['すべて', ...CATEGORIES] as const).map((c) => (
          <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      <ul className="game-list">
        {list.map((g) => {
          const owned = state.owned.includes(g.id)
          const rec = state.records[g.id]
          return (
            <li key={g.id}>
              {owned ? (
                <button className={`game-card edge-${g.category}`} onClick={() => onPlay(g.id, false)}>
                  <span className="game-icon" aria-hidden="true">
                    {g.icon}
                  </span>
                  <span className="game-text">
                    <span className={`chip cat-${g.category}`}>{g.category}</span>
                    <strong>{g.name}</strong>
                    <span className="game-rec">
                      {rec ? (
                        <>
                          ベスト <b>{rec.best}</b>点・脳年齢 <b>{brainAge(rec.best)}</b>歳・{rec.plays}回
                        </>
                      ) : (
                        'まだ遊んでいません'
                      )}
                    </span>
                  </span>
                  <span className="arrow" aria-hidden="true">
                    ›
                  </span>
                </button>
              ) : (
                <div className={`game-card locked edge-${g.category}`}>
                  <span className="game-icon" aria-hidden="true">
                    ？
                  </span>
                  <span className="game-text">
                    <span className={`chip cat-${g.category}`}>{g.category}</span>
                    <strong>？？？</strong>
                    <span className="game-rec">今日の脳トレで出会うと遊べます</span>
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
