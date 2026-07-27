# 世界史教材 アーキテクチャマップ

このファイルは、世界史教材の機能・データ・カード生成・保存処理がどこにあり、どのように連動しているかを監査するための地図です。機能、データ構造、CSSクラス、保存API、検証手順を変更した場合は、同じ作業内でこのファイルも更新します。

## 更新ルール

- ファイル名、関数名、データ項目名、API名、CSSクラス名を具体的に書く。
- 推測で書かず、確認できた構造だけを書く。
- 旧仕様を残す場合は「廃止」「互換」「バックアップ」と明記する。
- 検証済みでない画面確認を「確認済み」と書かない。
- `data/*.json` と `data/*.js` の同期仕様、保存API、カード生成関数を変更したら必ず更新する。

## 全体構成

| 領域 | 主ファイル | 役割 |
|---|---|---|
| 本番ページ | `index.html` | 教材本体のHTML。`styles.css`、`data/history-content.js`、`data/modal-data.js`、`script.js` を読み込む。 |
| 本番表示ロジック | `script.js` | 年表、大カテゴリー、時代カード、子カテゴリー、地域タイムライン、人物カード、アクションカード、王国・勢力カード、モーダル、人物図鑑、クイズ、本文リンクを生成・制御する。 |
| 本番デザイン | `styles.css` | 年表、カード、詳細アコーディオン、人物図鑑、人物・アクションモーダル、王国モーダル、子カテゴリー画像の表示位置を制御する。 |
| 正本データ | `data/*.json` | 編集・監査の正本。現在は `history-content.json` と `modal-data.json`。 |
| 配布用データ | `data/*.js` | ブラウザ読み込み用の `window.*` 代入ファイル。JSONと同期必須。 |
| 画像作業ページ | `image-workbench.html` | 人物・アクション・子カテゴリー画像の割り当て、削除、既存画像選択、本体反映、ロールバックUI。 |
| 画像作業ページロジック | `image-workbench.js` | 画像作業ページの一覧、編集、プレビュー、変更パッチ、本体反映リクエスト、バックアップ一覧、ロールバックを制御する。 |
| 画像作業ページデザイン | `image-workbench.css` | 画像作業ページの一覧、編集パネル、プレビュー、書き出しUIを制御する。 |
| 専用サーバー | `scripts/image-workbench-server.js` | `http://127.0.0.1:4184/` の配信、画像反映API、Data URL実体化、バックアップ、ロールバックを制御する。 |
| 検証手順 | `VERIFICATION_GUIDE.md` | 検証の順序、期待件数、失敗済み手順、画像作業ページ検証ルールを管理する。 |
| バックアップ | `backups/` | 画像反映・ロールバック用のデータ退避先。 |
| デザイン復元 | `design-baseline/`, `scripts/save-design-baseline.ps1`, `scripts/restore-design-baseline.ps1` | 承認済みデザインの保存・復元。 |

## 本番ページの読み込み順

`index.html` は次の順で読み込む。

1. `styles.css`
2. `data/history-content.js`
3. `data/modal-data.js`
4. `script.js`

`script.js` は `window.historyContentData` または `window.WORLD_HISTORY_CONTENT_DATA` を優先して `history-content` を読み込む。モーダル用データは `window.WORLD_HISTORY_MODAL_DATA` を優先する。JSフォールバックがない場合はJSONを `fetch` する。

## データ正本と配布データ

| 正本JSON | 配布JS | window名 | 主な内容 |
|---|---|---|---|
| `data/history-content.json` | `data/history-content.js` | `window.historyContentData` | 大カテゴリー、時代、時代画像、時代カード本文、詳細本文、勢力タイムライン用の `powers`、子カテゴリー、子カテゴリー画像、`imageFocus`、`peopleNote`。 |
| `data/modal-data.json` | `data/modal-data.js` | `window.WORLD_HISTORY_MODAL_DATA` | 人物カード、全人物名引き `peopleByName`、アクションカード、王国・勢力カード、王国・勢力に関わった人物。 |

同期ルール:

- JSONを更新したら対応するJSも同時更新する。
- `history-content.js` は `window.historyContentData = ...` 形式。
- `modal-data.js` は `window.WORLD_HISTORY_MODAL_DATA = ...` 形式。
- 画像作業ページの本体反映は、正本JSONと配布JSの両方を書き換える。
- `data/*.json`、`data/*.js`、またはデータ正規化に関わる `script.js` を変更する場合は、必要に応じて `data-backups/` または `backups/` にバックアップを残し、復元時の注意を記録する。

## データ構造

### `history-content`

```text
{
  schemaVersion,
  eraImages: { [eraId]: imagePath },
  groups: [
    {
      id, title, heading, focus, icon, colors,
      eras: [
        {
          id, name, years, westernYear, icon, colors, question,
          cards: { life, event, power },
          powers: [...],
          subcategories: [
            { id, region, title, summary, text, tags, image, imageFocus, imageAlt, peopleNote }
          ]
        }
      ]
    }
  ]
}
```

`script.js` の `normalizeHistoryContent(data)` が、本番表示用の `eras`、`eraImages`、`eraGroups`、`powers`、`eraDetails`、`worldHistoryActionSubcategories`、`subcategoryImages`、`subcategoryImageFocusByName`、`subcategoryPersonNotes` へ展開する。

子カテゴリー画像の `imageFocus` は `center` / `up` / `down` を想定する。`script.js` は `up` / `down` の場合だけ `.subcategory-image-up` / `.subcategory-image-down` を付ける。

### `modal-data`

```text
{
  people: [ [名前, ふりがな, 時代, 場所, 肩書き, 説明, アイコン, 画像メタ?] ],
  peopleByName: { [名前または別名]: [人物配列] },
  actionCards: { [用語名]: [要約, 説明, tags, 画像メタ?] },
  kingdomCards: [ { id, name, displayName, modernRegion, era, region, type, lon, lat, timelineRange, x, y, summary, text, tags, ... } ],
  kingdomPeople: { [王国・勢力名]: [人物名] }
}
```

人物カードは `people` が人物図鑑の表示上限300件、`peopleByName` が本文リンク・王国カード・検索用の全人物名引きです。人物モーダルを網羅的に確認する場合は `people` ではなく `peopleByName` を見る。

人物・アクション画像は、画像作業ページで追加される配列末尾の画像メタ情報に保存する。

- 人物: `[名前, ふりがな, 時代, 場所, 肩書き, 説明, アイコン, { image, imageAlt }]`
- アクション: `[要約, 説明, tags, { image, imageAlt }]`

人物・アクションでは `imageFocus` を使わない。子カテゴリーだけが `imageFocus` を持つ。

## `script.js` 機能マップ

### データ読み込み・正規化

| 関数 | 役割 |
|---|---|
| `normalizeModalData(data)` | `modal-data` から `people`、`personByName`、`actionCards`、`kingdomCards`、`kingdomPeople` を初期化する。 |
| `loadModalData()` | `window.WORLD_HISTORY_MODAL_DATA` または `data/modal-data.json` を読み込み、読み込み元を `document.documentElement.dataset.modalDataSource` に記録する。 |
| `normalizeHistoryContent(data)` | `history-content` を本番表示用の時代・大カテゴリー・詳細・子カテゴリー画像・人物注記へ展開する。 |
| `loadHistoryContent()` | `window.historyContentData` / `window.WORLD_HISTORY_CONTENT_DATA` または `data/history-content.json` を読み込み、読み込み元を `document.documentElement.dataset.historyContentSource` に記録する。 |

### ルビ・本文リンク

| 関数 | 役割 |
|---|---|
| `ruby(text, reading)` | `<ruby>` HTMLを生成する。 |
| `applyStudyRuby(text)` | `manualStudyRubyTerms` に個別指定した難読語・歴史語だけへ学習ルビを付ける。広範な自動ルビは廃止済み。 |
| `applyKingdomRuby(text)` | 王国・勢力カード表示用に、一文字王朝名など通常本文では誤爆しやすい語も個別ルビ化する。 |
| `shouldSkipInlineLink(source, name, index, item)` | 人物・アクション・王国リンクの境界を判定し、部分一致やカタカナ語内誤リンクを防ぐ。 |
| `kingdomInlineNames(card)` | 王国・勢力カードのリンク候補名を返す。 |
| `enrichDetailLinks(text)` | 本文中の人物・アクション・王国・勢力カードへのリンクを生成する。大カテゴリー、時代カード、子カテゴリーのサブタイトルや見出し補足文では使わない。 |
| `handleInlineCardLink(event)` | `.person-inline`、`.action-inline`、`.kingdom-inline` クリックから対応モーダルを開く。 |

### 年表・大カテゴリー・子カテゴリー・地域タイムライン

| 関数 | 役割 |
|---|---|
| `renderEraLinks()` | 左メニューの大カテゴリーリンクを描画する。 |
| `renderRegionalPowerTimeline(era, eraKingdoms, options)` | 王国・勢力カードから地域別タイムラインを描画する。地域選択は `eraRegionPriority` と関連勢力で制御する。 |
| `timelineRegionsForSubcategory(subcategory)` | 子カテゴリーに表示する地域タイムラインの対象地域を決める。 |
| `relatedKingdomsForSubcategory(subcategory, era)` | 子カテゴリーと関係する王国・勢力カードを抽出する。 |
| `renderActionSubcategories(group, groupEras)` | 大カテゴリー内の子カテゴリーカードと、必要な小型地域タイムラインを生成する。 |
| `renderEraCard(era)` | 1つの時代カード、詳細カード、地域タイムライン、子カテゴリー群を生成する。 |
| `renderTimeline()` | 10大カテゴリーと10時代カードを生成する。 |
| `openEraDetail(button)` / `closeEraDetail()` | `くらし`、`できごと`、`大きな力` の詳細パネルを開閉する。 |
| `navigateToEraGroup(groupId)` | 左メニューから指定大カテゴリーへ移動し、対象だけを開く。 |

### 人物図鑑

| 関数 | 役割 |
|---|---|
| `getPersonGenres(person)` / `getPersonGenre(person)` | 人物のジャンルを判定する。世界史側は現在 `personGenreGroups` と `personGenreOverrides` を使う。 |
| `personMatches(person, query)` | 人物検索対象テキストを作る。 |
| `renderPeopleFilters()` | 人物図鑑フィルターを描画する。 |
| `renderPersonCard(person)` | 人物カードHTMLを生成する。 |
| `renderPersonNameButton(person)` | 人物名一覧ボタンを生成する。 |
| `renderPeople()` | 人物図鑑全体を描画する。 |
| `toggleFavorite(name, event)` | お気に入り状態を `localStorage.historyFavorites` に保存し、人物図鑑と人物モーダル内ボタンを同期する。 |
| `updateModalFavoriteButton(name)` | 人物モーダル内の星アイコン、`aria-pressed`、`aria-label` を更新する。 |

### モーダル・カード生成

| 関数 | 役割 |
|---|---|
| `cardVisualMeta(card, index)` | 人物・アクション配列末尾の画像メタ情報を取得する。 |
| `directCardVisual(card, index, title)` | 直接割り当て画像がある場合に、モーダル画像として最優先で返す。 |
| `findVisualForPerson(person)` | 人物モーダル画像を決める。直接割り当て画像 → 関連子カテゴリー画像 → 時代画像の順。 |
| `findVisualForAction(name, tags)` | アクションモーダル画像を決める。直接割り当て画像 → 同名子カテゴリー画像 → 関連子カテゴリー画像 → 時代画像の順。 |
| `modalVisualHtml(visual, icon, title)` | モーダル画像領域HTMLを生成する。 |
| `modalSectionHtml(icon, title, text)` | モーダル本文セクションを生成する。 |
| `renderLearningModal(...)` | 人物・アクション共通モーダルを描画する。人物モーダルだけ `sideActions` で左アイコン直下の星お気に入りボタンを差し込む。 |
| `personModalSections(person)` | 人物モーダルの「どんな人物？」「何をした？」を作る。登録済みデータのみ表示し、欠損時フォールバック文は出さない。 |
| `actionModalSections(name, action)` | アクションモーダルの「どんな内容？」「何が起きた？」を作る。登録済みデータのみ表示し、定型紹介文は出さない。 |
| `openPerson(name)` | `personByName` から人物を探してモーダルを開き、現在のお気に入り状態に合わせた星ボタンを左アイコン直下に表示する。 |
| `openAction(name)` | `actionCards` からアクションを探してモーダルを開く。 |
| `openKingdom(id)` | 王国・勢力モーダルを開き、3D地図またはフォールバック地図を描画する。 |
| `renderKingdomGlobe(card)` | 王国・勢力カード用3D地図を描画する。 |

### クイズ・現在地

| 関数 | 役割 |
|---|---|
| `renderQuiz()` / `answerQuiz(option)` | ミニクイズを描画・回答処理する。 |
| `observeEra()` | IntersectionObserverで現在地表示を更新する。 |
| `initApp()` | データ読み込み後、年表・人物図鑑・クイズ・現在地監視を初期化する。 |

## `styles.css` 表示制御マップ

| セレクタ | 役割 |
|---|---|
| `.topbar`, `.now-era`, `.settings` | 固定上部バー、現在地、設定ボタン。 |
| `.era-drawer`, `.era-links` | 左メニュー。 |
| `.timeline`, `.timeline::before` | 縦年表全体と左ライン。 |
| `.era-group`, `.era-group::after` | 大カテゴリーと大カテゴリー年代札。 |
| `.era`, `.era::after`, `.era::before` | 時代カード、時代年代札、時代アイコン。 |
| `.fact-grid`, `.fact-card`, `.detail-toggle`, `.inline-detail` | 時代カード3項目と詳細アコーディオン。 |
| `.regional-timeline`, `.regional-bar-*` | 地域別王国・勢力タイムライン。 |
| `.action-subcategory-card`, `.subcategory-image`, `.subcategory-image-up`, `.subcategory-image-down` | 子カテゴリーカードと子カテゴリー画像位置。 |
| `.people-section`, `.person-name-item`, `.person-card` | 人物図鑑と人物カード。 |
| `.learning-modal-card`, `.modal-type-person`, `.modal-type-action`, `.modal-section-grid`, `.modal-info-section` | 人物・アクション共通モーダル。 |
| `.kingdom-detail`, `.kingdom-map`, `.mini-people` | 王国・勢力モーダル、3D地図、関連人物欄。 |
| `.person-inline`, `.action-inline`, `.kingdom-inline` | 本文内カードリンク。 |

## 画像作業ページ

### 入口と起動

- 入口: `image-workbench.html`
- スタイル: `image-workbench.css`
- 画面ロジック: `image-workbench.js`
- 専用サーバー: `scripts/image-workbench-server.js`
- 起動: `start-image-workbench-server.bat`

通常URL:

```text
http://127.0.0.1:4184/image-workbench.html
```

日本史側と同時に使う場合は、起動前に `IMAGE_WORKBENCH_PORT` を指定して別ポートで起動できる。

### 画像作業ページのデータ管理関数

| 関数 | 役割 |
|---|---|
| `modalPersonRecords()` | `modalData.people` と `modalData.peopleByName` から重複を除いた人物編集対象を作る。 |
| `decorateVisualTarget(target, index)` | 配列データに `image` / `imageFocus` / `imageAlt` のアクセサを付け、既存UIの編集処理を配列末尾メタへ接続する。 |
| `syncModalPersonVisuals()` | `people` と `peopleByName` の同一人物画像メタを同期する。 |
| `subcategoryRecords()` | `historyData.groups[].eras[].subcategories[]` を編集対象へ展開する。 |
| `allRecords()` | 人物632件、アクション111件、子カテゴリー53件を一覧化する。 |
| `supportsImageFocus(record)` | `subcategory` のみ `true`。人物・アクションに表示位置UIを出さない。 |
| `categoryImageChoices()` | 大カテゴリー・時代・子カテゴリーの既存画像を、人物・アクション・子カテゴリーへ再利用する選択肢として作る。 |
| `effectiveVisual(record)` | 本番側で表示される画像を推定する。直接画像、関連子カテゴリー画像、時代画像の優先順を表示する。 |
| `buildPatch()` | `image` / `imageFocus` / `imageAlt` の差分を `patch.operations` として作る。 |
| `applyToProject()` | `historyContent` と `modalData` の全体を `/api/apply-image-data` へPOSTする。`patch.operations` が0件でも送信する。 |
| `rollbackToBackup()` | `/api/rollback-image-data` へ選択バックアップをPOSTし、復元後データで画面を再構築する。 |

### 保存API

`scripts/image-workbench-server.js` のAPI:

| API | メソッド | 役割 |
|---|---|---|
| `/api/apply-image-data` | POST | `historyContent` と `modalData` を検証し、Data URL画像をassetsへ実体化し、バックアップ後にJSON/JSへ保存する。 |
| `/api/rollback-image-data` | POST | 復元前バックアップを作ってから、選択バックアップのJSON/JSへ戻す。 |
| `/api/backups` | GET | `backups/image-workbench-*` の一覧を返す。 |

保存対象:

```js
const datasetFiles = [
  "history-content.json",
  "history-content.js",
  "modal-data.json",
  "modal-data.js"
];
```

JS代入名:

```js
const jsAssignments = {
  "history-content": "window.historyContentData",
  "modal-data": "window.WORLD_HISTORY_MODAL_DATA"
};
```

保存前に `validatePayload()` と `assertNoReplacementCharacters()` を通し、保存後に `assertAppliedImageOperations()` で `image` / `imageFocus` / `imageAlt` を照合する。Data URL画像は保存時に `assets/...` へ実体化されるため、画像URL照合では `assets/` 化を許容する。

### バックアップ

画像作業ページ専用バックアップ:

- 反映時: `backups/image-workbench-apply-YYYYMMDD-HHMMSS/`
- ロールバック前: `backups/image-workbench-rollback-before-restore-YYYYMMDD-HHMMSS/`

バックアップには `manifest.json` を含める。バックアップなしの直接上書きは禁止。