#!/usr/bin/env python3
"""public/icon.svg から、ホーム画面用のアイコン（PNG）を作る。

icon-maskable-512.png は Android の丸い切り抜き用。背景はそのまま、絵だけ80%に縮めて、切れないようにする。
"""
import pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
svg = (root / 'public' / 'icon.svg').read_text(encoding='utf-8')
bg = '<rect width="512" height="512" fill="url(#bg)"/>'
head, body = svg.split(bg)
maskable = head + bg + '<g transform="translate(51.2 51.2) scale(.8)">' + body.replace('</svg>', '</g></svg>')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for src, size, name in [(svg, 512, 'icon-512.png'), (svg, 192, 'icon-192.png'), (svg, 180, 'apple-touch-icon.png'), (maskable, 512, 'icon-maskable-512.png')]:
        pg = b.new_page(viewport={'width': 512, 'height': 512}, device_scale_factor=size / 512)
        pg.set_content(f'<body style="margin:0">{src}</body>')
        pg.screenshot(path=str(root / 'public' / name), clip={'x': 0, 'y': 0, 'width': 512, 'height': 512})
        pg.close()
    b.close()
