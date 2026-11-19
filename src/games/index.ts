// 新しい脳トレを作ったら、ここと src/data/games.ts に登録する

import type { ComponentType } from 'react'
import { Anagram, Diff, Memo, Pairs } from './board'
import type { GameProps } from './common'
import { Change, Discount, Value } from './money'
import { Cups, Sweeper } from './puzzle'
import { Unshuffle } from './unshuffle'
import { Bento, OddOne, Range, Register } from './quiz'

export const GAME_COMPONENTS: Record<string, ComponentType<GameProps>> = {
  freezer: Bento,
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
  sweeper: Sweeper,
  cups: Cups,
  unshuffle: Unshuffle,
}
