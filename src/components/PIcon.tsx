// 商品のアイコン（どの機種でも同じ絵になるよう、SVGで描く）
// 商品を追加したときは、ここに同じ id で絵を足す。絵がない商品は商品データ（src/catalog/）の絵文字で表示する

import type { CSSProperties, ReactNode } from 'react'
import catalog from '#catalog'
import { GENRE_COLOR, PRODUCTS } from '../data/products'

// src/assets/icons/<id>.svg（png・webp も可）を置くと、下の絵のかわりにその画像を使う
const FILES = import.meta.glob('../assets/icons/*.{svg,png,webp}', { eager: true, import: 'default' }) as Record<string, string>
const CUSTOM: Record<string, string> = {}
for (const [path, url] of Object.entries(FILES)) CUSTOM[path.split('/').pop()!.replace(/\.\w+$/, '')] = url
// 商品データに小さく出すときの写真があれば、それを使う（src/catalog/ の icons）。ジャンルの色の枠をつける
const PHOTOS: Record<string, string> = catalog.icons

const plate = <ellipse cx="24" cy="33" rx="21" ry="10" fill="#fff" stroke="#c9dde7" strokeWidth="1.5" />

const ART: Record<string, ReactNode> = {
  // ---- 一般の商品（損得勘定で使う） ----
  'g-rice': (
    <>
      <path d="M11 10h26l3 34H8Z" fill="#f4ecd6" stroke="#c9b98f" strokeWidth="1.5" />
      <path d="M11 10q13-6 26 0" fill="none" stroke="#c9b98f" strokeWidth="2" />
      <rect x="13" y="20" width="22" height="13" rx="3" fill="#3d8c3d" />
      <path d="M18 30q6-8 12 0" stroke="#fff" strokeWidth="2" fill="none" />
      <g fill="#fff">
        <ellipse cx="21" cy="25" rx="1.6" ry="2.4" />
        <ellipse cx="25" cy="23.5" rx="1.6" ry="2.4" />
        <ellipse cx="29" cy="25" rx="1.6" ry="2.4" />
      </g>
    </>
  ),
  'g-soy': (
    <>
      <rect x="20" y="3" width="8" height="6" rx="1.5" fill="#c9372c" />
      <path d="M19 9h10v6l5 6v23a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V21l5-6Z" fill="#6b3a1f" />
      <rect x="16" y="24" width="16" height="13" rx="2" fill="#fff5d6" />
      <path d="M20 28h8M20 32h6" stroke="#6b3a1f" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'g-mayo': (
    <>
      <path d="M17 12q0-4 7-4t7 4l2 30q0 4-9 4t-9-4Z" fill="#fff8e1" stroke="#e7d9a8" strokeWidth="1.5" />
      <rect x="20" y="3" width="8" height="6" rx="2" fill="#c9372c" />
      <path d="M17.5 22h13l.5 9h-14Z" fill="#c9372c" />
      <path d="M21 26.5h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'g-miso': (
    <>
      <path d="M8 18h32l-3 24q-.5 3-3.5 3h-19Q11.500 45 11 42Z" fill="#fff" stroke="#c9dde7" strokeWidth="1.5" />
      <rect x="6" y="12" width="36" height="7" rx="3" fill="#c46a1b" />
      <rect x="15" y="25" width="18" height="12" rx="2" fill="#f2d39b" />
      <path d="M19 31h10" stroke="#c46a1b" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  gyoza: (
    <>
      <path d="M3 33q4-5 10-4l22-1q8 0 10 5-4 7-21 7T3 33Z" fill="#e7b96a" opacity=".75" />
      <path d="M6 31Q24 2 42 31q-18 7-36 0Z" fill="#f7e2b4" />
      <path d="M6 31q18 7 36 0-3 6-18 6T6 31Z" fill="#c78636" />
      <path d="M13 22l2 4M18 16l2 5M24 13v6M30 16l-2 5M35 22l-2 4" stroke="#d9b574" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  karaage: (
    <>
      <path d="M4 36q6-8 12-4 8-6 14 0 8-4 14 4-8 6-20 6T4 36Z" fill="#6fb04f" />
      <g fill="#bf7526">
        <circle cx="24" cy="16" r="8" />
        <circle cx="18" cy="13" r="4.5" />
        <circle cx="15" cy="28" r="9" />
        <circle cx="9" cy="24" r="5" />
        <circle cx="33" cy="27" r="9" />
        <circle cx="39" cy="22" r="5" />
      </g>
      <g fill="#e0a04e">
        <circle cx="22" cy="13" r="3" />
        <circle cx="12" cy="25" r="3" />
        <circle cx="31" cy="23" r="3" />
      </g>
      <g fill="#8f5212">
        <circle cx="27" cy="19" r="1.6" />
        <circle cx="18" cy="31" r="1.6" />
        <circle cx="36" cy="30" r="1.6" />
      </g>
    </>
  ),
  ebifry: (
    <g transform="rotate(-28 24 24)">
      <path d="M38 17l8-6 1 7 1 7-10-2Z" fill="#e2412b" />
      <rect x="4" y="15" width="36" height="16" rx="8" fill="#dc9a3a" />
      <g fill="#f3c76a">
        <circle cx="11" cy="21" r="2" />
        <circle cx="18" cy="26" r="2" />
        <circle cx="24" cy="20" r="2" />
        <circle cx="31" cy="26" r="2" />
        <circle cx="35" cy="20" r="1.6" />
      </g>
      <g fill="#b87420">
        <circle cx="14" cy="27" r="1.4" />
        <circle cx="21" cy="22" r="1.4" />
        <circle cx="29" cy="21" r="1.4" />
      </g>
    </g>
  ),
  onigiri: (
    <>
      <path d="M24 6q4 0 7 5l12 21q3 9-6 9H11q-9 0-6-9l12-21q3-5 7-5Z" fill="#d9a04c" />
      <path d="M24 12q2 0 4 3l9 16q2 5-3 5H14q-5 0-3-5l9-16q2-3 4-3Z" fill="#edc17a" />
      <path d="M17 22l8 12M23 16l10 16M14 30l4 6" stroke="#a5651f" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  ramen: (
    <>
      <path d="M36 3l-9 17M41 5l-11 15" stroke="#b98a4e" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 21h40q0 20-20 22Q4 41 4 21Z" fill="#e2412b" />
      <path d="M6 28h36" stroke="#fff" strokeWidth="2.5" />
      <ellipse cx="24" cy="21" rx="20" ry="6.5" fill="#d8922e" />
      <path d="M9 21q4-4 8 0t8 0 8 0" stroke="#f6dc7a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="20" r="4.2" fill="#fff" />
      <path d="M32 20a2 2 0 1 0 4 0" stroke="#ee7f9a" strokeWidth="1.4" fill="none" />
      <g fill="#5aa84a">
        <circle cx="14" cy="18" r="1.5" />
        <circle cx="20" cy="24" r="1.5" />
        <circle cx="26" cy="18" r="1.5" />
      </g>
    </>
  ),
  pizza: (
    <>
      <path d="M24 46 5 12q19-9 38 0Z" fill="#f4c64f" />
      <path d="M5 12q19-9 38 0l-2.5 5Q24 9 7.500 17Z" fill="#c78636" />
      <g fill="#c9372c">
        <circle cx="18" cy="20" r="3.6" />
        <circle cx="30" cy="22" r="3.6" />
        <circle cx="23" cy="32" r="3.2" />
      </g>
      <g fill="#4f9d45">
        <rect x="23" y="16" width="4" height="2.4" rx="1.2" />
        <rect x="16" y="27" width="4" height="2.4" rx="1.2" />
        <rect x="27" y="29" width="4" height="2.4" rx="1.2" />
      </g>
    </>
  ),
  pasta: (
    <>
      {plate}
      <ellipse cx="24" cy="28" rx="15" ry="9" fill="#f3d36c" />
      <path d="M12 28q4-6 8 0t8 0 8 0M14 32q5-4 10 0t10 0" stroke="#d6ab35" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M16 23q1-7 8-7t8 7q-3 5-8 5t-8-5Z" fill="#b8391f" />
      <g fill="#8a2613">
        <circle cx="21" cy="21" r="1.5" />
        <circle cx="26" cy="24" r="1.5" />
      </g>
      <path d="M24 12q4-3 7 0-3 4-7 0Z" fill="#4f9d45" />
    </>
  ),
  chahan: (
    <>
      {plate}
      <path d="M8 33q-1-21 16-21t16 21q-16 6-32 0Z" fill="#efd698" />
      <g>
        <rect x="14" y="22" width="4" height="3" rx="1" fill="#4f9d45" />
        <rect x="28" y="18" width="4" height="3" rx="1" fill="#4f9d45" />
        <rect x="21" y="29" width="4" height="3" rx="1" fill="#4f9d45" />
        <rect x="20" y="18" width="4.500" height="3.500" rx="1" fill="#e88674" />
        <rect x="30" y="27" width="4.500" height="3.500" rx="1" fill="#e88674" />
        <rect x="12" y="29" width="4.500" height="3.500" rx="1" fill="#b06a2a" />
        <rect x="25" y="23" width="4" height="3" rx="1" fill="#f6c443" />
        <rect x="16" y="16" width="3.500" height="3" rx="1" fill="#f6c443" />
      </g>
    </>
  ),
  curry: (
    <>
      <ellipse cx="24" cy="28" rx="22" ry="14" fill="#fff" stroke="#c9dde7" strokeWidth="1.5" />
      <path d="M24 17q14 0 17 10 0 10-17 10Z" fill="#a4601d" />
      <path d="M24 17v20q-17 0-17-10 3-10 17-10Z" fill="#fbf6e6" />
      <path d="M11 26q2-2 4 0M15 31q2-2 4 0M17 23q2-2 4 0" stroke="#ddd3b4" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <rect x="28" y="22" width="5" height="4.500" rx="1.2" fill="#ef9a3c" />
      <rect x="33" y="29" width="5" height="4.500" rx="1.2" fill="#e9d59a" />
      <rect x="27" y="30" width="4.500" height="4" rx="1.2" fill="#7a431a" />
    </>
  ),
  potato: (
    <>
      <g fill="#f6c843">
        <rect x="13" y="8" width="5" height="26" rx="1.5" transform="rotate(-10 15 20)" />
        <rect x="19" y="4" width="5" height="30" rx="1.5" transform="rotate(-3 21 20)" />
        <rect x="25" y="6" width="5" height="28" rx="1.5" transform="rotate(5 27 20)" />
        <rect x="31" y="10" width="5" height="24" rx="1.5" transform="rotate(13 33 20)" />
      </g>
      <path d="M10 22h28l-3.500 22h-21Z" fill="#e2412b" />
      <path d="M17 30h14" stroke="#ffd43a" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  takoyaki: (
    <>
      <path d="M3 28h42l-5 13H8Z" fill="#dcb779" />
      <g fill="#c98a3c">
        <circle cx="12" cy="24" r="8.500" />
        <circle cx="24" cy="22" r="8.500" />
        <circle cx="36" cy="24" r="8.500" />
      </g>
      <g fill="#5d3212">
        <path d="M5 21q7-9 14 0-7 4-14 0Z" />
        <path d="M17 19q7-9 14 0-7 4-14 0Z" />
        <path d="M29 21q7-9 14 0-7 4-14 0Z" />
      </g>
      <path d="M8 19q3-2 5 0M20 17q3-2 5 0M32 19q3-2 5 0" stroke="#fff5d6" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <g fill="#4f9d45">
        <circle cx="14" cy="16" r="1.2" />
        <circle cx="27" cy="14" r="1.2" />
        <circle cx="38" cy="16" r="1.2" />
      </g>
    </>
  ),
  broccoli: (
    <>
      <path d="M19 28h10l3 17H16Z" fill="#9cc765" />
      <g fill="#3d8c3d">
        <circle cx="24" cy="14" r="10" />
        <circle cx="13" cy="21" r="8.500" />
        <circle cx="35" cy="21" r="8.500" />
        <circle cx="19" cy="28" r="6.500" />
        <circle cx="29" cy="28" r="6.500" />
      </g>
      <g fill="#5fae52">
        <circle cx="21" cy="11" r="3" />
        <circle cx="11" cy="19" r="2.600" />
        <circle cx="33" cy="17" r="2.600" />
        <circle cx="26" cy="22" r="2.400" />
      </g>
    </>
  ),
  hamburg: (
    <>
      {plate}
      <ellipse cx="21" cy="28" rx="15" ry="10" fill="#7a431f" />
      <path d="M8 26q5-9 14-8t12 9q-6-4-13-3T8 26Z" fill="#4e2610" />
      <path d="M13 23q4-3 9-2.500" stroke="#b47a4a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="30" r="4" fill="#ef9a3c" />
      <circle cx="37" cy="23" r="3.400" fill="#3d8c3d" />
    </>
  ),
  oden: (
    <>
      <path d="M24 3v43" stroke="#c9a36b" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M24 5 34 17H14Z" fill="#8f918b" />
      <g fill="#6c6e69">
        <circle cx="22" cy="13" r="1" />
        <circle cx="27" cy="14" r="1" />
        <circle cx="24" cy="10" r="1" />
      </g>
      <circle cx="24" cy="25" r="7.500" fill="#fff5d6" stroke="#e3d5a4" strokeWidth="1.5" />
      <rect x="15" y="34" width="18" height="9" rx="4.500" fill="#e9c98c" />
      <rect x="20" y="34" width="8" height="9" fill="#b9762c" />
    </>
  ),
  ice: (
    <>
      <circle cx="24" cy="17" r="13" fill="#fff4d8" />
      <path d="M15 12q4-6 11-5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M9 25q4 5 7.500 0 3.500 5 7.500 0 4 5 7.500 0 3.500 5 7.500 0v4H9Z" fill="#fff4d8" />
      <path d="M10 27h28l-4 18H14Z" fill="#6fbfe0" />
      <path d="M12 33h24" stroke="#fff" strokeWidth="2.500" opacity=".8" />
    </>
  ),
  potesala: (
    <>
      <path d="M8 27q0-17 16-17t16 17Z" fill="#f8edc2" />
      <path d="M13 21a4 4 0 0 1 7 0Z" fill="#7cc06a" />
      <path d="M27 17a4 4 0 0 1 7 0Z" fill="#7cc06a" />
      <rect x="21" y="14" width="4.500" height="4" rx="1" fill="#ef9a3c" />
      <rect x="29" y="22" width="4.500" height="4" rx="1" fill="#ef9a3c" />
      <rect x="16" y="23" width="5" height="3.500" rx="1" fill="#f0a3a8" />
      <path d="M4 26h40q-1 17-20 17T4 26Z" fill="#fff" stroke="#9cc3d6" strokeWidth="1.5" />
      <path d="M8 32q16 5 32 0" stroke="#9cc3d6" strokeWidth="1.5" fill="none" />
    </>
  ),
}

export function PIcon({ id }: { id: string }) {
  if (PHOTOS[id]) {
    const p = PRODUCTS.find((x) => x.id === id)
    return <img className="picon photo" src={PHOTOS[id]} alt="" draggable={false} style={p ? ({ '--gc': GENRE_COLOR[p.genre] } as CSSProperties) : undefined} />
  }
  if (CUSTOM[id]) return <img className="picon" src={CUSTOM[id]} alt="" draggable={false} />
  const art = ART[id]
  if (!art) return <>{PRODUCTS.find((p) => p.id === id)?.icon ?? '？'}</>
  return (
    <svg className="picon" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true">
      {art}
    </svg>
  )
}

/** 販促商品ではない一般の商品の、色つきの箱の絵（買い物リスト暗記の売り場で使う） */
export function GenericPack({ color }: { color: string }) {
  return (
    <svg className="picon" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true">
      <path d="M8 14 24 7l16 7v22l-16 7-16-7Z" fill={color} />
      <path d="M8 14l16 7 16-7M24 21v22" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 24l8 3.5v6L12 30Z" fill="#fff" fillOpacity=".85" />
    </svg>
  )
}
