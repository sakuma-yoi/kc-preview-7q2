// 買い物リスト暗記で使う、冷凍・チルド売り場の棚
// 販促商品は products.ts の shelf（書いていなければジャンルから決まる）で棚に並ぶ
// generic は販促商品ではない、売り場をにぎやかにするための一般の商品

import type { Product } from './products'

export type ShelfId = 'veg' | 'side' | 'meal' | 'snack' | 'ice' | 'deli'

export type Shelf = { id: ShelfId; name: string; color: string; generic: string[] }

export const SHELVES: Shelf[] = [
  { id: 'veg', name: '冷凍野菜', color: '#3d8c3d', generic: ['ほうれん草', 'かぼちゃ', 'ミックスベジタブル', '枝豆', 'コーン', 'いんげん', '里いも'] },
  { id: 'side', name: '冷凍おかず', color: '#c46a1b', generic: ['コロッケ', '春巻き', '焼売', '白身フライ', '肉だんご', 'ささみフライ', 'いかフライ'] },
  { id: 'meal', name: '冷凍ごはん・麺', color: '#b8860b', generic: ['焼きうどん', 'ピラフ', 'オムライス', 'ざるそば', 'ナポリタン', '五目ごはん', 'ドリア'] },
  { id: 'snack', name: '冷凍スナック', color: '#c9372c', generic: ['お好み焼き', '今川焼き', 'アメリカンドッグ', '大学いも', 'ナゲット', 'フレンチトースト', 'ホットケーキ'] },
  { id: 'ice', name: 'アイス', color: '#1f86b8', generic: ['チョコアイス', 'いちごアイス', '抹茶アイス', 'かき氷', 'ソーダバー', 'モナカアイス', 'チョコミント'] },
  { id: 'deli', name: 'チルドのお惣菜', color: '#2f8a50', generic: ['肉じゃが', '筑前煮', '卵焼き', 'マカロニサラダ', '煮魚', 'ひじき煮', 'きんぴら'] },
]

/** 販促商品が並ぶ棚 */
export function shelfOf(p: Product): ShelfId {
  if (p.shelf) return p.shelf
  if (p.type === 'チルド') return 'deli'
  if (p.genre === 'デザート') return 'ice'
  if (p.genre === '軽食') return 'snack'
  if (p.genre === 'ごはん' || p.genre === '麺') return 'meal'
  return 'side'
}
