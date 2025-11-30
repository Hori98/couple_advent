Couple Advent (Expo + Supabase)

## Concept & Stack
- Concept: see `docs/CONCEPT.md`
- Stack/Architecture: see `docs/TECH_STACK.md`

## Prerequisites
- Node 18+
- iOS: Xcode + Simulator (or Expo Go on device)
- Android: Android Studio + Emulator (or Expo Go on device)

## Setup
1) Copy `.env.example` to `.env` and set:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2) Install deps:
   - `npm install` (or `yarn`)
3) Start the dev server:
   - `npx expo start` (recommended)
   - If you prefer global CLI: `npm i -g expo` then `expo start`

## Run on Simulators
- iOS Simulator: press `i` in the Expo dev terminal
- Android Emulator: press `a`
- Web: press `w` (limited)

## First Run: Supabase Setup (done once)
1) Apply SQL in `supabase/schema.sql`（基本スキーマ/RLS/RPC）
2) 追加パッチを適用（必要に応じて）
   - `supabase/patch_2025_11_28.sql`（link/video型・共有パスコード）
   - `supabase/patch_2025_11_30_rls_non_recursive.sql`（非再帰RLS + StorageパスRLS）
   - `supabase/patch_2025_11_30_relationship_days.sql`（title/total_days/background_key/style_key + 作成RPC）
   - `supabase/patch_2025_12_01_share_links.sql`（共有リンク作成のgen_random_bytes修正）
3) Storageバケットを作成: private `advent-media`
4) Auth Providers: Email（Magic Link）+ Anonymous を有効化

## Test Flow
1) Creator: `/auth` → サインイン → `/creator/setup`
2) 作成画面で タイトル/背景/スタイル/日数 を選択 → プレビュー確認 → 作成 → `/creator`
3) クリエイター画面のプレビュー上で番号タップ → 編集モーダルで保存（テキスト/画像/YouTube/リンク）
4) 作成完了（不足があれば警告表示）→ 共有リンク発行（合言葉設定は任意）
5) Receiver: 共有リンクを開く → `/share/[code]` で匿名認証 + claim → `/calendar` → ドアを開く

## Notes
- Storage RLSはパスベース（`relationships/{relationship_id}/{day}/...`）。フロントはこの規約でアップロード。
- 画像アップロードはRN環境向けにbase64を使用。
- アンロック（JST）はMVPとしてクライアント側で制御。
