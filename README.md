# 脳トレPWA（確認用）

冷凍食品・チルド食品の販促用、脳トレ系PWA（Vite + React + TypeScript）。アプリの名前は仮の「タイトル」にしてある。

本当の名前と、名前に合わせた言葉は `src/brand.private.json` に書く（Gitには入れない）。`BRAND=private npm run build` でその名前になる。項目は `src/brand.json` と同じ。

アイコンは `public/icon.svg`。直したら `python3 scripts/make-icons.py` でPNGを作り直す。

## 動かす

```
npm install
npm run dev        # 開発
npm run build      # PWA版（dist/）。HTTPSで公開するとホーム画面に追加・オフラインが使える
SINGLE=1 npx vite build --outDir dist-single   # 確認用の1ファイル版（PWAの機能は入らない）
```

## 商品を差し替える

1. `src/data/products.ts` の `PRODUCTS` を実際の商品に書き換える。
   - `id` は半角英数字。画像のファイル名にも使う。
   - `name` は正式な商品名。長いときは `shortName` に脳トレ用の短い呼び名を書く（並べ替えは6文字以下が目安）。
   - `rangeSec` はレンジの温め時間（秒）。書いた商品だけ「レンジ時間の計算」に出る。
   - `buyUrl` を書くと、商品詳細の「買えるお店を見る」がリンクになる。
   - `isNew: true` の商品は NEW の印が付き、購入スタンプが2個になる。
2. パッケージ画像を `src/assets/products/<id>.png` に置く（webp・jpg も可）。
   - 背景が透明な切り抜き画像、長辺800px前後がおすすめ。
   - 図鑑・商品詳細・おすすめバナー・クーポンに出る。置いていない商品は小さい絵で代用する。
   - いま入っている `*.webp` は「見本」と書いた仮の画像。同じ id のファイルを置いたら、古い方は消す。
3. 脳トレ用の小さい絵を `src/assets/icons/<id>.svg` に置く（png・webp も可）。
   - 30px ほどの大きさでも見分けられる、単純な絵にする。
   - 置いていない商品は `src/components/PIcon.tsx` の絵（なければ絵文字）を使う。
4. `src/data/config.ts` を合わせる。
   - `BANNER`（ホームのおすすめ商品）、`FEATURED_BY_MONTH`（図鑑の月替わり特集）、`COUPONS`（クーポン）の商品 id。
   - `ODDONE_LATE`：商品の絵の色を変えられないときは `'flip'` にする（仲間はずれ探しの後半が「さかさま」になる）。
5. 新しい漢字を足したら `npm run fonts` でフォントを作り直す（Python と `pip install fonttools brotli` が必要）。

各脳トレには最低限必要な商品数がある（`src/data/games.ts` の `minProducts`）。レンジで温める商品は4品以上、呼び名が6文字以下の商品は5品以上を用意する。

## よく触るファイル

| やりたいこと | ファイル |
| --- | --- |
| 商品 | `src/data/products.ts` |
| 脳トレの設定・登場商品・届く順番 | `src/data/games.ts` |
| 脳トレの難しさ（レベルごとの量・時間・選択肢）と速さの基準 | `src/data/levels.ts` |
| 報酬の数値、くじ、クーポン、特集、★、点数の割合 | `src/data/config.ts` |
| 報酬のルールとデータの保存 | `src/store.ts` |
| 新しい脳トレ | `src/games/` に作り、`src/games/index.ts` と `src/data/games.ts` に登録 |

## 公開する（GitHub Pages）

1. GitHub に空のリポジトリを作り、このフォルダを `main` に push する。
2. リポジトリの Settings → Pages → Source を「GitHub Actions」にする。
3. 数分後に `https://<ユーザー名>.github.io/<リポジトリ名>/` で開ける。

GitHub Pages のサイトは誰でも開ける。無料プランではリポジトリも公開になる。確認用の間は `index.html` に検索よけ（noindex）を入れてある。
