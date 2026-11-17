// 損得勘定に出る商品。大きさのちがう2〜3個をくらべる
// icon は src/components/PIcon.tsx の絵の id（販促商品の id か、g- で始まる一般の商品の絵）
// unit は「100gあたり」の g や ml、per100 は100gあたりのだいたいの値段（円）、sizes は売っている大きさ

export type ValueKind = { name: string; icon: string; unit: 'g' | 'ml'; per100: number; sizes: number[] }

export const VALUE_KINDS: ValueKind[] = [
  { name: 'お米', icon: 'g-rice', unit: 'g', per100: 45, sizes: [2000, 5000, 10000] },
  { name: 'しょうゆ', icon: 'g-soy', unit: 'ml', per100: 40, sizes: [500, 1000, 1800] },
  { name: 'マヨネーズ', icon: 'g-mayo', unit: 'g', per100: 70, sizes: [300, 450, 700] },
  { name: 'みそ', icon: 'g-miso', unit: 'g', per100: 60, sizes: [375, 750, 1000] },
  { name: 'からあげ', icon: 'karaage', unit: 'g', per100: 120, sizes: [300, 500, 1000] },
  { name: 'フライドポテト', icon: 'potato', unit: 'g', per100: 55, sizes: [400, 1000, 1500] },
  { name: 'ブロッコリー', icon: 'broccoli', unit: 'g', per100: 80, sizes: [250, 500, 800] },
]

/** 1000g を 1kg のように読みやすくする */
export const amountLabel = (n: number, unit: 'g' | 'ml') =>
  n >= 1000 && n % 100 === 0 ? `${n / 1000}${unit === 'g' ? 'kg' : 'L'}` : `${n}${unit}`
