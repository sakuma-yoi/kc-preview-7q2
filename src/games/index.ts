// 新しい脳トレを作ったら、ここと src/data/games.ts に登録する

import type { ComponentType } from 'react'
import { Anagram, Diff, Memo, Pairs } from './board'
import type { GameProps } from './common'
import { Change, Discount, Value } from './money'
import { Freezer, OddOne, Range, Register } from './quiz'

export const GAME_COMPONENTS: Record<string, ComponentType<GameProps>> = {
  freezer: Freezer,
  register: Register,
  diff: Diff,
  pairs: Pairs,
  memo: Memo,
  range: Range,
  oddone: OddOne,
  change: Change,
  discount: Discount,
  value: Value,
  anagram: Anagram,
}
