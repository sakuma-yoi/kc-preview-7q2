export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** その日を含む週の月曜〜日曜 */
export const weekDays = (d: Date) => {
  const offset = (d.getDay() + 6) % 7
  const monday = addDays(d, -offset)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()

export const WEEK_LABELS = ['月', '火', '水', '木', '金', '土', '日']

export const jpDate = (d: Date) =>
  `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`
