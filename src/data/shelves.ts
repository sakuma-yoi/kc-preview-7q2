// 買い物リスト暗記で使う、冷凍・チルド売り場の棚
// 棚は src/catalog/ に書く。販促商品は商品の shelf（書いていなければジャンルから決まる）で棚に並ぶ
// generic は販促商品ではない、売り場をにぎやかにするための一般の商品

import catalog from '#catalog'
import type { Product, Shelf, ShelfId } from './types'

export type { Shelf, ShelfId } from './types'

export const SHELVES: Shelf[] = catalog.shelves

/** 販促商品が並ぶ棚 */
export function shelfOf(p: Product): ShelfId {
  if (p.shelf) return p.shelf
  if (p.type === 'チルド') return 'deli'
  if (p.genre === 'やさい') return 'veg'
  if (p.genre === 'くだもの') return 'fruit'
  if (p.genre === 'デザート') return 'ice'
  if (p.genre === '軽食') return 'snack'
  if (p.genre === 'ごはん' || p.genre === '麺') return 'meal'
  return 'side'
}
