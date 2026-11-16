export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const sample = <T,>(arr: readonly T[], n: number) => shuffle(arr).slice(0, n)

export const randInt = (n: number) => Math.floor(Math.random() * n)

export const yen = (n: number) => `${n.toLocaleString('ja-JP')}円`

export const minSec = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m > 0 ? `${m}分` : ''}${s > 0 || m === 0 ? `${s}秒` : ''}`
}
