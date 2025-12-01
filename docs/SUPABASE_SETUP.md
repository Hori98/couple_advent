# Supabase Setup (初心者向け手順)

アプリのコードは Supabase 前提で実装済みです。以下の手順をそのまま行えば動きます。

## 0) 前提
- Supabase プロジェクトを1つ用意（無料枠でOK）
- `EXPO_PUBLIC_SUPABASE_URL` と `EXPO_PUBLIC_SUPABASE_ANON_KEY` を控える（後で .env に入れる）

## 1) SQL を流す（順番にコピペ）
Supabase ダッシュボード → SQL Editor → New query → 各ファイルを開いて **全文コピー＆ペースト** → RUN。  
（選択した範囲だけ実行されるので、必ず全文を選択してください）

順番:
1. `supabase/schema.sql`（一番最初に必須。これでテーブル/基本RPCが作られます）
2. `supabase/patch_2025_11_28.sql`
3. `supabase/patch_2025_11_30_rls_non_recursive.sql`
4. `supabase/patch_2025_11_30_relationship_days.sql`
5. `supabase/patch_2025_12_01_share_links.sql`
6. `supabase/patch_2025_12_02_open_events.sql`
7. `supabase/patch_2025_12_03_pgcrypto.sql`（gen_random_bytes 未定義エラーを防止）

補足:
- `schema.sql` で `share_links` テーブルと `upsert_advent_entry` RPC まで作成済みです。
- `patch_2025_11_28.sql` は content_type に link/video/audio/file を追加し、共有リンクのパスコード対応を含みます。

実行後、SQL Editor で `select pg_notify('pgrst','reload schema');` を一度流して REST スキーマをリロードしてください。

### よくあるエラー
- `relation "..." does not exist` → `schema.sql` を先に流していない可能性があります。順番を確認。
- `type ... already exists` / `function ... already exists` → 既に実行済みの場合に出ますがそのままで問題ありません。

## 2) Storage バケット
1. Storage → Create bucket → 名前 `advent-media`、`Private` を選択して作成。
2. 追加のポリシーは不要（SQLでRLSを作成済み）。パスは `relationships/{relationship_id}/{day}/...` で保存されます。

## 3) Auth プロバイダ
- Email（Magic Link）を有効化。
- Anonymous を有効化（受け手が共有リンクを開くため）。もし無効のままだと受け手が入れず、アプリにエラーが出ます。
- Google/Apple を使う場合はダッシュボードで設定し、リダイレクトURLに `coupleadvent://auth/callback` を登録。

## 4) 環境変数 (.env)
リポジトリ直下で `.env.example` をコピー:
```
cp .env.example .env
```
`EXPO_PUBLIC_SUPABASE_URL` と `EXPO_PUBLIC_SUPABASE_ANON_KEY` に、Supabase プロジェクトのURLとAnonキーを入れる。

## 5) 動作確認の目安
- SQL実行後に SQL Editor で `select * from public.relationships limit 1;` などを実行してエラーが出ないことを確認。
- アプリを起動し、メール認証または匿名ログインで `/creator/setup` まで進めればOK。共有リンク → `/share/<code>` で匿名サインインできればストレージ/ポリシーも正しく動いています。
