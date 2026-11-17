// 損得勘定に出る商品は src/catalog/ に書く

import catalog from '#catalog'
import type { ValueKind } from './types'

export type { ValueKind } from './types'

export const VALUE_KINDS: ValueKind[] = catalog.valueKinds

/** 1000g を 1kg のように読みやすくする */
export const amountLabel = (n: number, unit: 'g' | 'ml') =>
  n >= 1000 && n % 100 === 0 ? `${n / 1000}${unit === 'g' ? 'kg' : 'L'}` : `${n}${unit}`
