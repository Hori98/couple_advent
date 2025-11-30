# Tech Stack & Architecture (MVP)

## Core Stack
- Framework: Expo (Managed) + Expo Router (file-based routing)
- Language: TypeScript
- UI: NativeWind (Tailwind for RN)
- Animation: Moti + React Native Reanimated
- Backend: Supabase (Auth, Postgres, Storage)
- Vector: react-native-svg（数字描画に使用）

## Config / Env
- `.env` (Expo reads EXPO_PUBLIC_*):
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Deep link scheme: `coupleadvent://share/<code>`

## Routes (current)
- `/auth`: Magic link (creator)
- `/creator/setup`: タイトル/背景/スタイル/日数を選んで作成（ライブプレビュー付き）
- `/creator`: フルサイズプレビュー＋番号タップで編集モーダル。作成完了→共有
- `/creator/share`: 共有リンク（必要に応じて使用）
- `/calendar`: 受け手のカレンダー（JSTアンロック）
- `/door/[day]`: 受け手の詳細表示（署名URLで画像表示）
- `/share/[code]`: 受け手の入口（匿名認証 + claim → `/calendar`）

## Data Model (key tables)
- `relationships`: id, invite_code, created_by, title, total_days, background_key, style_key
- `relationship_members`: relationship_id, user_id, role
- `advent_entries`: relationship_id, day, type(text/image/youtube/link/video), text_content, image_path, youtube_url, link_url
- `share_links`: relationship_id, code, claimed_by, expires_at, disabled, passcode_hash

## Security (RLS)
- 非再帰`is_member/is_creator`ヘルパーでポリシー構成。
- メンバーはentriesを読める／作成者は書ける。
- 受け手（claimed_by）は該当関係のentries/Storageを読める（必要に応じてORポリシー）。
- Storage: private `advent-media`、パスベースRLS（`relationships/{rel}/{day}/...`）＋署名URL。

## Auth Modes
- Creator: Email magic link (later Apple/Google); writes content.
- Receiver: Anonymous sign-in automatically when opening share link; read-only.

## Future Enhancements
- Content: `video`, `link` types; gift card UI; OG previews.
- Security: passcode-protected share, device bind, audit/open logs.
- Polish: richer door animations, particles, sound.
