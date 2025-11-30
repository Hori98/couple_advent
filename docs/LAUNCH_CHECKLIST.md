# iOS/Android Launch Checklist

## App/Project
- App icons and splash: verify `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash.png` match brand and sizes.
- app.json:
  - `name`, `slug`, `scheme`（e.g., `coupleadvent`）
  - iOS: `bundleIdentifier`
  - Android: `package`
  - `ios.supportsTablet` の方針
  - `updates.enabled`（Expo Updates使用有無）
- EAS projectId 設定（`DEPLOYMENT_NOTES.md` 参照）

## Permissions / Privacy
- iOS Info.plist（app.json の `ios.infoPlist` で追加）
  - `NSPhotoLibraryUsageDescription`: 画像アップロードの説明文
  - `NSAppTransportSecurity`（必要なら）
- Android Manifest（app.json の `android.permissions`）
  - ネットワーク、ストレージ読み取り（Expo既定で十分なことが多い）
- プライバシーポリシーURL（ストア申請で必要）

## Supabase
- 環境変数: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- RLS/関数:
  - 非再帰RLS: `is_member`, `is_creator`
  - StorageパスRLS: `relationships/{rel}/{day}/...`
  - RPC: `create_relationship_with_days(4)`, `upsert_advent_entry`, `create_share_link`, `set_share_link_passcode`, `claim_share_link`
- バケット: private `advent-media` の存在
- スキーマリロード: 変更後 `select pg_notify('pgrst','reload schema');`

## QA Checklist
- 作成:
  - `/creator/setup` で背景/スタイル/日数がプレビューに即反映→作成→`/creator` で一致
  - 番号タップ→編集モーダル→保存/削除→✓表示更新
  - 作成完了: 未登録があると警告→「それでも作成」で続行
- 共有:
  - 共有リンク発行→合言葉設定→別端末でリンクを開いて受け取り→`/calendar`
  - 署名URL画像の表示確認
- カレンダー:
  - JSTアンロック（12月のみ日付比較、それ以外は解放）
- エラー/権限:
  - 画像選択（フォトライブラリ許可ダイアログ）
  - ネットワーク遮断時のメッセージ

## Store Submission
- iOS: App Store Connect（スクリーンショット、App Privacy、Sign-in情報）
- Android: Google Play Console（データ安全性、コンテンツレーティング、広告の有無）
- ディープリンク: `coupleadvent://share/<code>` の説明（外部リンクの取扱い）

## Performance / Size
- 画像圧縮（背景JPG・ボックスPNG最適化）
- 不要アセットの削除（参照なし）
- Hermes（デフォルト有効）

