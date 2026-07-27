# 世界史教材 アーキテクチャメモ

## 画像作業ページ

- 入口: `image-workbench.html`
- スタイル: `image-workbench.css`
- 画面ロジック: `image-workbench.js`
- 専用サーバー: `scripts/image-workbench-server.js`
- 起動: `start-image-workbench-server.bat`

画像作業ページは本番データを直接更新する管理画面です。通常は専用サーバーから開きます。

```text
http://127.0.0.1:4184/image-workbench.html
```

日本史側と同時に使う場合は、起動前に `IMAGE_WORKBENCH_PORT` を指定して別ポートで起動できます。

### 更新対象

- 子カテゴリー画像: `data/history-content.json` / `data/history-content.js`
- 人物カード画像・アクションカード画像: `data/modal-data.json` / `data/modal-data.js`

人物カードとアクションカードは配列データなので、画像は配列末尾の画像メタ情報オブジェクトに保存します。

- 人物: `[名前, ふりがな, 時代, 場所, 肩書き, 説明, アイコン, { image, imageAlt }]`
- アクション: `[要約, 説明, タグ配列, { image, imageAlt }]`

`imageFocus` は子カテゴリーだけで使います。人物・アクションでは表示位置UIを出しません。

### 保存仕様

`/api/apply-image-data` は保存前に `backups/image-workbench-apply-YYYYMMDD-HHMMSS/` へ対象データを退避し、JSONとJSを同時に更新します。Data URL画像は次の保存先へ実体化します。

- 人物: `assets/people/`
- アクション: `assets/actions/`
- 子カテゴリー: `assets/subcategories/`

`/api/rollback-image-data` は復元前に `backups/image-workbench-rollback-before-restore-YYYYMMDD-HHMMSS/` を作り、選択したバックアップへ戻します。
