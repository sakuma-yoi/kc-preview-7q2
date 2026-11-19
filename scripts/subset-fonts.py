#!/usr/bin/env python3
"""アプリで使っている文字だけを取り出して、小さいフォントファイルを作る。

使い方:  npm run fonts   （商品名や文章に新しい漢字を足したら、もう一度実行する）
必要なもの:  pip install fonttools brotli
"""
import pathlib, subprocess, sys

root = pathlib.Path(__file__).resolve().parent.parent
chars = set()
for path in [root / 'index.html', root / 'vite.config.ts', *root.glob('src/**/*.ts'), *root.glob('src/**/*.tsx'), *root.glob('src/**/*.css'), *root.glob('src/*.json')]:
    # 公開しないファイル（本物の商品・アプリ名）の文字は入れない。公開版のフォントから中身が推測されないように
    if 'private' in path.name:
        continue
    chars.update(path.read_text(encoding='utf-8'))
# 数字・英字・かな・記号は、あとから文章を変えても困らないよう全部入れる
chars.update(chr(c) for c in range(0x20, 0x7F))
chars.update(chr(c) for c in range(0x3000, 0x3100))   # 句読点・ひらがな・カタカナ
chars.update(chr(c) for c in range(0xFF00, 0xFFF0))   # 全角英数・記号
chars.update('★☆◯✕×→←↑↓・…—‐「」『』（）？！：％〜')
text = ''.join(sorted(c for c in chars if c.isprintable()))

fonts = {
    'zen-maru-gothic-500': '@fontsource/zen-maru-gothic/files/zen-maru-gothic-japanese-500-normal.woff2',
    'zen-maru-gothic-700': '@fontsource/zen-maru-gothic/files/zen-maru-gothic-japanese-700-normal.woff2',
    'zen-maru-gothic-900': '@fontsource/zen-maru-gothic/files/zen-maru-gothic-japanese-900-normal.woff2',
    'mochiy-pop-one-400': '@fontsource/mochiy-pop-one/files/mochiy-pop-one-japanese-400-normal.woff2',
}
out = root / 'src' / 'fonts'
out.mkdir(exist_ok=True)
(out / 'chars.txt').write_text(text, encoding='utf-8')
for name, src in fonts.items():
    dest = out / f'{name}.woff2'
    subprocess.run([sys.executable, '-m', 'fontTools.subset', str(root / 'node_modules' / src),
                    f'--text-file={out / "chars.txt"}', '--flavor=woff2', f'--output-file={dest}',
                    '--layout-features=*', '--no-hinting'], check=True)
    print(f'{dest.name}: {dest.stat().st_size // 1024} KB')
print(f'{len(text)} 文字')
