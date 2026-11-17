// 商品の追加・変更は src/catalog/ で行う（手順は README.md の「商品を差し替える」）
//   sample.ts  … 仮の商品（公開版）
//   private.ts … 本物の商品（公開しないファイル。BRAND=private でビルドしたときだけ使う）

import catalog from '#catalog'
import type { Genre, Product } from './types'

export type { Genre, Product, ProductType } from './types'

export const GENRES: Genre[] = catalog.genres

export const PRODUCTS: Product[] = catalog.products

/** ジャンルの色（商品の写真の枠） */
export const GENRE_COLOR: Record<Genre, string> = {
  やさい: '#3d8c3d',
  くだもの: '#8a3fa8',
  おかず: '#c46a1b',
  軽食: '#c9372c',
  ごはん: '#b8860b',
  麺: '#a0522d',
  デザート: '#1f86b8',
}

/** 大きさ違いの商品（大袋ならふつうの袋、ふつうの袋なら大袋） */
export const otherSize = (p: Product) => PRODUCTS.find((x) => (p.bigOf ? x.id === p.bigOf : x.bigOf === p.id))

/** 脳トレの中で使う呼び名 */
export const shortName = (p: Product) => p.shortName ?? p.name

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)!

/** 購入でもらえるスタンプ数（仮：通常1個、NEW商品2個） */
export const purchaseStamps = (p: Product) => (p.isNew ? 2 : 1)
