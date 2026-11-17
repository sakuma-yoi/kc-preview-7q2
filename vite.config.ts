import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 通常のビルド：PWA（ホーム画面に追加・オフライン対応）
// SINGLE=1 のビルド：確認用に1ファイルへまとめる（PWAの機能は入らない）
const single = !!process.env.SINGLE
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// アプリの名前：BRAND=private のときだけ本当の名前（src/brand.private.json）。それ以外は仮の名前
const brandFile = here(process.env.BRAND === 'private' && existsSync(here('./src/brand.private.json')) ? './src/brand.private.json' : './src/brand.json')
const brand = JSON.parse(readFileSync(brandFile, 'utf-8'))
// 商品：BRAND=private のときだけ本物の商品（src/catalog/private.ts・公開しない）。それ以外は仮の商品
const catalogFile = here(process.env.BRAND === 'private' && existsSync(here('./src/catalog/private.ts')) ? './src/catalog/private.ts' : './src/catalog/sample.ts')
const appName = {
  name: 'app-name',
  transformIndexHtml: (html: string) => html.replaceAll('__APP_NAME__', brand.name),
}

// PWA版では Google Fonts の読み込みを外す（フォントは同梱する）
const dropGoogleFonts = {
  name: 'drop-google-fonts',
  transformIndexHtml: (html: string) => html.replace(/\s*<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/gs, ''),
}

export default defineConfig({
  base: './',
  // 確認用の1ファイル版では、画像もファイルの中に埋め込む
  build: single ? { assetsInlineLimit: 100_000_000 } : {},
  resolve: { alias: { '#fonts': here(single ? './src/fonts.empty.ts' : './src/fonts.ts'), '#brand': brandFile, '#catalog': catalogFile } },
  plugins: [
    react(),
    appName,
    ...(single
      ? [viteSingleFile()]
      : [
          dropGoogleFonts,
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['apple-touch-icon.png', 'icon.svg'],
            manifest: {
              name: brand.longName,
              short_name: brand.name,
              description: brand.description,
              lang: 'ja',
              display: 'standalone',
              orientation: 'portrait',
              background_color: '#e6f1f6',
              theme_color: '#e6f1f6',
              start_url: './',
              scope: './',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: { globPatterns: ['**/*.{js,css,html,png,svg,webp,jpg,jpeg,woff2}'] },
          }),
        ]),
  ],
})
