# Deployment Notes

## EAS設定（ローンチ時に復元）

ローカル開発のために一時削除した設定を、ローンチ時に復元する必要があります：

### app.json に以下を追加:
```json
"extra": {
  "eas": {
    "projectId": "00000000-0000-0000-0000-000000000000"
  }
}
```

### 必要な手順:
1. `npx expo login` でExpoアカウントにログイン
2. `npx eas build:configure` でEAS設定
3. 新しいprojectIdを取得してapp.jsonに設定
4. `npx eas build --platform all` でビルド

### 参考:
- EAS Build: https://docs.expo.dev/build/introduction/
- App Store/Google Play配信: https://docs.expo.dev/submit/introduction/