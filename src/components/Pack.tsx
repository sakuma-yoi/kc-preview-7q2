// 商品のパッケージ画像。src/assets/products/<id>.png（webp・jpg も可）を置くと表示される
// 画像がない商品は、脳トレ用の小さい絵で代用する

import catalog from '#catalog'
import { PIcon } from './PIcon'

const FILES = import.meta.glob('../assets/products/*.{png,webp,jpg,jpeg}', { eager: true, import: 'default' }) as Record<string, string>
const PACKS: Record<string, string> = {}
for (const [path, url] of Object.entries(FILES)) PACKS[path.split('/').pop()!.replace(/\.\w+$/, '')] = url
Object.assign(PACKS, catalog.images)

export const hasPack = (id: string) => id in PACKS

/** 一覧などで小さく出す絵。小さく出すときの写真（src/catalog/ の icons）があればそれ、なければパッケージ画像 */
export function Thumb({ id, alt = '' }: { id: string; alt?: string }) {
  if (catalog.icons[id]) return <PIcon id={id} />
  return <Pack id={id} alt={alt} />
}

export function Pack({ id, alt = '' }: { id: string; alt?: string }) {
  if (!PACKS[id]) return <PIcon id={id} />
  return <img className="pack" src={PACKS[id]} alt={alt} draggable={false} />
}
