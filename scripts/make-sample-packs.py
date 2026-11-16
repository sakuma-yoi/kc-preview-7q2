#!/usr/bin/env python3
"""見本のパッケージ画像を作る（本物の画像が届くまでの仮置き）。

確認用の1ファイル版を開いて商品の絵を取り出し、「見本」と入れた箱の画像にして
src/assets/products/<id>.webp に保存する。本物の画像は同じファイル名で上書きすればよい。
使い方:  SINGLE=1 npx vite build --outDir dist-single && python3 scripts/make-sample-packs.py
"""
import json, pathlib, io
from playwright.sync_api import sync_playwright
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'src' / 'assets' / 'products'
out.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.goto('file://' + str(root / 'dist-single' / 'index.html')); pg.wait_for_timeout(600)
    pg.click('[aria-label="設定"]'); pg.locator('summary', has_text='運営メニュー').click(); pg.wait_for_timeout(200)
    # 運営メニューの商品ボタンから、絵と名前を取り出す
    items = pg.evaluate("""() => [...document.querySelectorAll('.ops-products button')].map(b => ({
        name: b.textContent.trim(), svg: b.querySelector('svg') ? b.querySelector('svg').outerHTML : '' }))""")
    src = (root / 'src' / 'data' / 'products.ts').read_text(encoding='utf-8')
    import re
    meta = {m.group(2): (m.group(1), m.group(3), m.group(4)) for m in re.finditer(r"\{ id: '(\w+)', name: '([^']+)'.*?type: '([^']+)'.*?amount: '([^']+)'", src)}
    for it in items:
        pid, kind, amount = meta[it['name']]
        color = '#1f86b8' if kind == '冷凍' else '#2f8a50'
        html = f"""<body style="margin:0;background:transparent"><div id="b" style="width:480px;height:360px;box-sizing:border-box;border-radius:26px;background:#fff;border:6px solid {color};position:relative;overflow:hidden;font-family:'Noto Sans CJK JP','Noto Sans JP',sans-serif">
          <div style="background:{color};color:#fff;font-weight:900;font-size:26px;padding:8px 22px;letter-spacing:.1em">{kind}食品</div>
          <div style="position:absolute;right:26px;top:74px;width:200px;height:200px">{it['svg'].replace('width="1em"','width="200"').replace('height="1em"','height="200"')}</div>
          <div style="position:absolute;left:26px;top:96px;width:220px;font-weight:900;font-size:44px;line-height:1.2;color:#17364a">{it['name']}</div>
          <div style="position:absolute;left:26px;bottom:24px;font-size:24px;font-weight:700;color:#557282">{amount}</div>
          <div style="position:absolute;right:-64px;bottom:34px;rotate:-35deg;background:#e2412b;color:#fff;font-weight:900;font-size:28px;padding:4px 80px;letter-spacing:.3em">見本</div>
        </div></body>"""
        page = b.new_page(viewport={'width': 480, 'height': 360})
        page.set_content(html)
        png = page.locator('#b').screenshot(omit_background=True)
        page.close()
        Image.open(io.BytesIO(png)).save(out / f'{pid}.webp', 'WEBP', quality=82)
        print(pid, (out / f'{pid}.webp').stat().st_size // 1024, 'KB')
    b.close()
