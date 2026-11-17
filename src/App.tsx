import BRAND from '#brand'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BookIcon, GameIcon, GearIcon, HomeIcon, TicketIcon } from './components/Icons'
import { ProductDetail } from './components/ProductDetail'
import { setSfxEnabled } from './lib/sfx'
import { Coupon } from './screens/Coupon'
import { Games } from './screens/Games'
import { Home } from './screens/Home'
import { Play } from './screens/Play'
import { Settings } from './screens/Settings'
import { Zukan } from './screens/Zukan'
import { ensureDaily, load, save, StoreContext, ticketExpiries, type State, type Store } from './store'

type Tab = 'home' | 'games' | 'zukan' | 'coupon'

const TABS: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'ホーム', Icon: HomeIcon },
  { id: 'games', label: '脳トレ', Icon: GameIcon },
  { id: 'zukan', label: '図鑑', Icon: BookIcon },
  { id: 'coupon', label: 'クーポン', Icon: TicketIcon },
]

export default function App() {
  const [state, setState] = useState<State>(() => {
    const s = load()
    ensureDaily(s)
    save(s)
    return s
  })
  const ref = useRef(state)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef(0)

  const update = useCallback<Store['update']>((fn) => {
    const draft = structuredClone(ref.current)
    const out = fn(draft)
    ensureDaily(draft)
    ref.current = draft
    setState(draft)
    save(draft)
    return out
  }, [])

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 3200)
  }, [])

  // 日付が変わったあとにアプリへ戻ってきたら、今日の脳トレを更新する
  useEffect(() => {
    const onShow = () => document.visibilityState === 'visible' && update(() => undefined)
    document.addEventListener('visibilitychange', onShow)
    return () => document.removeEventListener('visibilitychange', onShow)
  }, [update])

  setSfxEnabled(state.settings.sound)

  const [tab, setTab] = useState<Tab>('home')
  const [play, setPlay] = useState<{ gameId: string; daily: boolean } | null>(null)
  const [product, setProduct] = useState<string | null>(null)
  const [settings, setSettings] = useState(false)
  const [fresh, setFresh] = useState(0)
  const [back, setBack] = useState(0)

  // 端末の「戻る」でアプリが閉じないよう、開いているものを1つずつ閉じる
  const ui = useRef({ tab, play, product, settings })
  ui.current = { tab, play, product, settings }
  const guard = useRef(false)
  const closable = !!(play || product || settings || tab !== 'home')
  const pushGuard = () => {
    if (guard.current) return
    try {
      history.pushState({ guard: 1 }, '')
      guard.current = true
    } catch {
      // 履歴が使えない環境では何もしない
    }
  }
  useEffect(() => {
    if (closable) pushGuard()
  }, [closable])
  useEffect(() => {
    const onPop = () => {
      guard.current = false
      const c = ui.current
      if (c.product) setProduct(null)
      else if (c.settings) setSettings(false)
      else if (c.play) setBack((n) => n + 1)
      else if (c.tab !== 'home') {
        setFresh(0)
        setTab('home')
      }
      window.setTimeout(() => {
        const n = ui.current
        if (n.play || n.product || n.settings || n.tab !== 'home') pushGuard()
      }, 0)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = (t: Tab) => {
    setFresh(0)
    setTab(t)
  }

  return (
    <StoreContext.Provider value={{ state, update, toast }}>
      <div className={`app ${state.settings.big ? 'big' : ''}`}>
        {play ? (
          <Play
            key={`${play.gameId}-${play.daily}`}
            gameId={play.gameId}
            daily={play.daily}
            back={back}
            onProduct={setProduct}
            onExit={(stampsAdded) => {
              setPlay(null)
              if (stampsAdded > 0) {
                setFresh(Math.min(stampsAdded, ref.current.stamps))
                setTab('home')
              }
            }}
          />
        ) : (
          <>
            <header className="topbar">
              <h1 className="logo">
                {BRAND.logoHead}
                <span>{BRAND.logoTail}</span>
              </h1>
              <button
                className={`ticket-chip ${ticketExpiries(state).some((x) => x.warn) ? 'warn' : ''}`}
                onClick={() => go('coupon')}
                aria-label={`交換チケット ${state.tickets}枚${ticketExpiries(state).some((x) => x.warn) ? '（まもなく期限のチケットがあります）' : ''}`}
              >
                <TicketIcon size={20} />
                <b>{state.tickets}</b>
                <small>枚</small>
              </button>
              <button className="icon-btn" onClick={() => setSettings(true)} aria-label="設定">
                <GearIcon />
              </button>
            </header>

            <main className="screen">
              {tab === 'home' && (
                <Home
                  fresh={fresh}
                  onFresh={setFresh}
                  onPlay={(gameId, daily) => setPlay({ gameId, daily })}
                  onProduct={setProduct}
                  onCoupon={() => go('coupon')}
                />
              )}
              {tab === 'games' && <Games onPlay={(gameId, daily) => setPlay({ gameId, daily })} onHome={() => go('home')} />}
              {tab === 'zukan' && <Zukan onProduct={setProduct} />}
              {tab === 'coupon' && <Coupon onProduct={setProduct} />}
            </main>

            <nav className="tabbar" aria-label="メニュー">
              {TABS.map(({ id, label, Icon }) => (
                <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)} aria-current={tab === id}>
                  <Icon size={26} />
                  <span>{label}</span>
                  {id === 'zukan' && state.fresh.length > 0 && <em className="badge">{state.fresh.length}</em>}
                </button>
              ))}
            </nav>
          </>
        )}

        {settings && <Settings onClose={() => setSettings(false)} />}
        {product && <ProductDetail id={product} onClose={() => setProduct(null)} />}
        {toastMsg && (
          <div className="toast" role="status">
            {toastMsg}
          </div>
        )}
      </div>
    </StoreContext.Provider>
  )
}
