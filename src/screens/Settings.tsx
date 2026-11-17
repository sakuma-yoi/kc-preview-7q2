import BRAND from '#brand'
import { useState } from 'react'
import { PIcon } from '../components/PIcon'
import { Sheet } from '../components/Sheet'
import { APP_VERSION } from '../data/config'
import { allowedInGame, DEFAULT_GAME_PRODUCTS, GAMES, NEW_GAME_ORDER } from '../data/games'
import { PRODUCTS } from '../data/products'
import { jpDate } from '../lib/date'
import { addStamps, addTickets, initialState, productsFor, today, useStore } from '../store'

function Toggle({ id, label, on, onChange }: { id: string; label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle" htmlFor={id}>
      <span>{label}</span>
      <input id={id} type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  )
}

export function Settings({ onClose }: { onClose: () => void }) {
  const { state, update, toast } = useStore()
  const [editGame, setEditGame] = useState(GAMES[0].id)
  const [wipe, setWipe] = useState(false)

  const game = GAMES.find((g) => g.id === editGame)!
  const current = productsFor(state, editGame).map((p) => p.id)
  const candidates = PRODUCTS.filter((p) => allowedInGame(editGame, p.id))

  const toggleProduct = (id: string) => {
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    if (next.length < game.minProducts) {
      toast(`この脳トレには、商品が${game.minProducts}個以上必要です`)
      return
    }
    update((s) => void (s.gameProducts[editGame] = next))
  }

  return (
    <Sheet title="設定" onClose={onClose}>
      <Toggle
        id="set-big"
        label="文字を大きくする"
        on={state.settings.big}
        onChange={(v) => update((s) => void (s.settings.big = v))}
      />
      <Toggle
        id="set-sound"
        label="効果音"
        on={state.settings.sound}
        onChange={(v) => update((s) => void (s.settings.sound = v))}
      />

      <details className="fold">
        <summary>あそび方</summary>
        <ol>
          <li>ホームの「今日の脳トレ」を毎日1回クリアします。温めを待つ1〜2分で遊べます。</li>
          <li>クリアするとスタンプくじが引け、スタンプカードにスタンプがたまります。</li>
          <li>スタンプ10個で交換チケット1枚。チケットはクーポンと交換できます。</li>
          <li>ときどき「あたらしい脳トレ」が届きます。クリアすると、いつでも遊べるようになります。</li>
          <li>脳トレで出会った商品は、図鑑に登録されます。</li>
          <li>はじめて遊ぶ脳トレと、今日の脳トレでは、本番の前に練習問題が1問あります（とばせます）。</li>
        </ol>
      </details>

      <details className="fold">
        <summary>このアプリについて</summary>
        <p>
          {BRAND.name} バージョン {APP_VERSION}
          {BRAND.about && (
            <>
              <br />
              {BRAND.about}
            </>
          )}
          <br />
          データはこの端末の中だけに保存されます。購入スタンプとクーポンは試作用のダミーです。
        </p>
      </details>

      <details className="fold ops">
        <summary>運営メニュー（試作用）</summary>
        <p>
          アプリ内の日付：<b>{jpDate(today(state))}</b>
        </p>
        <div className="ops-row">
          <button onClick={() => update((s) => void (s.dayOffset -= 1))}>1日もどす</button>
          <button onClick={() => update((s) => void (s.dayOffset += 1))}>1日すすめる</button>
          <button onClick={() => update((s) => void (s.dayOffset += 30))}>30日すすめる</button>
          <button onClick={() => update((s) => void (s.dayOffset = 0))}>今日にもどす</button>
        </div>
        <Toggle
          id="set-level"
          label="脳トレ中にレベルを表示する"
          on={state.settings.showLevel !== false}
          onChange={(v) => update((s) => void (s.settings.showLevel = v))}
        />
        <div className="ops-row">
          <button onClick={() => update((s) => void addStamps(s, 5))}>スタンプ+5</button>
          <button onClick={() => update((s) => void addTickets(s, 1))}>チケット+1</button>
          <button
            onClick={() =>
              update((s) => {
                s.owned = [...new Set([...s.owned, ...NEW_GAME_ORDER])]
                s.pendingNew = null
              })
            }
          >
            脳トレを全部開放
          </button>
        </div>

        <h3>ゲームごとの商品</h3>
        <select id="ops-game" value={editGame} onChange={(e) => setEditGame(e.target.value)} aria-label="脳トレをえらぶ">
          {GAMES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <p>
          登場中 {current.length}品（最低{game.minProducts}品）
          {candidates.length < PRODUCTS.length && '・この脳トレに使える商品だけ表示しています'}
        </p>
        <ul className="ops-products">
          {candidates.map((p) => (
            <li key={p.id}>
              <button className={current.includes(p.id) ? 'on' : ''} onClick={() => toggleProduct(p.id)} aria-pressed={current.includes(p.id)}>
                <PIcon id={p.id} /> {p.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="ops-row">
          <button onClick={() => update((s) => void (s.gameProducts[editGame] = [...DEFAULT_GAME_PRODUCTS[editGame]]))}>
            初期設定にもどす
          </button>
        </div>

        <h3>データ</h3>
        {wipe ? (
          <div className="ops-row">
            <button
              className="danger"
              onClick={() => {
                update((s) => void Object.assign(s, initialState()))
                setWipe(false)
                toast('データを全部消しました')
                onClose()
              }}
            >
              本当に消す
            </button>
            <button onClick={() => setWipe(false)}>やめる</button>
          </div>
        ) : (
          <div className="ops-row">
            <button onClick={() => setWipe(true)}>データを全部消す</button>
          </div>
        )}
      </details>
    </Sheet>
  )
}
