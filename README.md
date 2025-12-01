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
2) Supabaseの初期化: `docs/SUPABASE_SETUP.md` に沿って SQL → バケット → Auth を設定（必須）
3) Install deps:
   - `npm install` (or `yarn`)
4) Start the dev server:
   - `npx expo start` (recommended)
   - If you prefer global CLI: `npm i -g expo` then `expo start`

## Run on Simulators
- iOS Simulator: press `i` in the Expo dev terminal
- Android Emulator: press `a`
- Web: press `w` (limited)

## First Run: Supabase Setup (done once)
詳しくは `docs/SUPABASE_SETUP.md`。サマリ:
1) SQLを順に実行: `schema.sql` → 各patch（11/28, 11/30*2, 12/01, 12/02）
2) Storageバケット: private `advent-media`
3) Auth: Email(Magic Link) + Anonymous を有効化（受け手が必要）。OAuthは `coupleadvent://auth/callback` をリダイレクトに登録。

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
