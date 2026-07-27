# 変更履歴

> 注記: 以下の 2026-07-20〜2026-07-23 の項目は、当時 CHANGELOG への記録が漏れていたため、`data-backups/` の変更前バックアップ履歴をもとに後から整理・追記したものです。各作業の詳細な変更前状態は該当バックアップを参照してください。

## 2026-07-23(続き)

### 子カテゴリー地域名チップの配置(PC=ヘッダー内タグ / モバイル=写真左上角バッジ)

- 子カテゴリーの地域名チップ(`.subcategory-region`)の配置を、レイアウトに合わせてPCとモバイルで分離。
- PC(ヘッダーが画像の上にある単列レイアウト): チップをヘッダー内のインライン・タグとして表示(`position: static`、`justify-self: start`、角丸ピル、`var(--group-a)` 系の淡色背景)。タイトルの上・画像の上に自然に並ぶ。絶対配置や余分なヘッダー上余白は使わない。
- モバイル(画像が左列のグリッド): チップをカードの左上角から外へ**飛び出す**タブとして表示(`position: absolute; top: -13px; left: -12px; z-index: 4`、不透明背景 `#fffdf6` + 枠 + 影)。写真の中には入れず、左上角から上・左へ突き出し、下端がわずかに角へ掛かることで所属を示す。上方向の張り出し用に `.subcategory-list { gap: 18px }` を確保。常に1行(`white-space: nowrap`)。
- モバイルは `.event-subcategory-card` の `overflow: visible` と画像左角 `border-radius: 8px 0 0 8px` を維持。カード幅・画像サイズ・本文レイアウトは変更なし。
- 検証: PC(1280px, インライン・タイトル上)・モバイル(375px, 写真左上角に6px inset で重畳)とも1行・非クリップ・横スクロールなしを実測+実機スクリーンショットで確認。変更前バックアップ: `design-baseline/restore-backups/20260723-era-chip-overlap-and-region-chip-before/`

### 地域タイムラインの勢力名ラベルの重なり解消(下レーン優先表示)

- 地域タイムラインで、複数レーンに勢力バーが積み重なると、上のバー/名前ラベルが下のレーンの勢力名を覆い、名前が読めなくなる不具合を修正。
- `.regional-bar` の `z-index` を固定値 `2` から `calc(var(--lane, 0) + 2)` に変更し、レーン番号が大きい(下の)勢力ほど手前(後から描画)に表示されるようにした。名前ラベル(`.regional-bar span`)は背景がほぼ不透明のため、下の勢力名が上のバーに隠れず読めるようになる。
- あわせて、任意のバーにホバー/フォーカスした際は `z-index: 999` で最前面に出し、目的の勢力名を確実に読めるようにした。
- 本文内タイムライン(`.regional-bar`)とモーダル内タイムライン(`.regional-timeline-dialog-body .regional-bar`)の両方に適用。
- 検証: 算出 `z-index` がレーン0→2, 1→3 … と昇順になることを確認。変更前バックアップ: `design-baseline/restore-backups/20260723-regional-bar-lane-zindex-before/`

### モバイル年号チップの位置修正・子カテゴリー地域チップ追加・時代アイコンのbox-sizing修正

- モバイル幅で、時代年号チップ(`.era-year-chip`)が時代アイコン(`.era::before`)と同じ左余白内で縦に重なって表示される不具合を修正。年号チップを各要素の上、縦ライン左のガター(x=8px)にコンパクトな1行ピルとして再配置し、アイコンと完全に分離した(計算値でy方向の重なりゼロを確認)。大カテゴリー年号チップ(`.group-year-chip`)も同じガター位置・同じ技法に統一。
- 子カテゴリーカード(`.event-subcategory-card`)に、地域名(西アジア、東アジア等)を左上に浮かせて表示するチップを追加。PC・モバイル共通で `.subcategory-region` を絶対配置化。モバイルでは2026-07-22の改修時に `display: none` にされていた地域ラベルを再度表示対象にした。タイトルとの重なりを避けるためヘッダー上余白を調整(PC 6px→20px、モバイル 10px→18px)。
- `.era::before`(時代アイコンの円形バッジ)に `box-sizing` が指定されておらず、全称セレクタ `* { box-sizing: border-box; }` が `::before`/`::after` 疑似要素には適用されない(CSS仕様上 `*` は擬似要素にマッチしない)ため `content-box` で描画され、意図した42×42pxではなく約47×47px相当に肥大化していた。`.era::before` に明示的に `box-sizing: border-box;` を追加。
- 時代アイコンの円が右側で直線的に欠けて見える不具合の**真因**は、大カテゴリー開閉アニメーション `@keyframes groupErasReveal` の最終キーフレームが `clip-path: inset(0)` を持ち、`animation-fill-mode: both` によりアニメ終了後もこの clip-path が `.era-group[open] > .group-eras` に残存していたこと。`.era::before`(アイコン)は `left: -42px` で `.group-eras` の左外へはみ出すため、この clip-path に矩形クリップされていた。`groupErasReveal` の clip-path を `inset(0 -200px 14px -200px)`(from)/`inset(0 -200px 0 -200px)`(to)へ変更し、縦方向のリビール効果は維持したまま左右方向は一切クリップしないようにして解消(算出値が最終的に `inset(0px -200px)` に落ち着くことを確認)。z-index やアイコン自体のサイズ・box-sizing は原因ではなかった(切り分け過程で `.era::before` を `box-shadow: inset` リング化・`box-sizing: border-box`・`font-size` 明示は残置。実害なし)。
- 検証: 算出スタイルで clip-path が横方向に展開されたことを確認、`scripts/verify-static.js` 通過、コンソールエラーなし。時代アイコンの正円描画はユーザー実機で最終確認済み。
- 変更前バックアップ: `design-baseline/restore-backups/20260723-group-year-chip-above-card-before/`(その後PC分は復元)、`design-baseline/restore-backups/20260723-era-chip-overlap-and-region-chip-before/`

## 2026-07-23

### styles.css の死にコード除去とメディアクエリ統合(表示不変を検証)

- 監査で検出した「後続の同一セレクタ・同一詳細度ルールで完全に上書きされている」死にコード3ブロック(power-card フォントの旧指定、年号チップ表示可否の相互打ち消し2件、計29行)を除去。
- 隣接していた `@media (max-width: 760px)` ブロック(6グループ・計20ブロック)を宣言順を変えずに統合し、モバイルメディアブロックを 28→14 に削減。`!important` は115→108、総行数は 3835→3792 に減少。
- 疑似要素 `::after` のモバイル位置調整ブロック群は、新DOMチップ(`.mobile-year-chip`)のアンカリングに影響し得るため今回は保持。
- 検証: 算出スタイルのハッシュスナップショット(主要55セレクタ+6疑似要素 × default/詳細開状態 × PC/スマホ)を統合前後で比較し、**全項目で差分ゼロ**を確認。`scripts/verify-static.js` 通過、コンソールエラーなし。
- 変更前バックアップ: `design-baseline/restore-backups/20260723-css-deadcode-cleanup-before/`、`design-baseline/restore-backups/20260723-css-media-consolidation-before/`

### モバイル年号チップをDOM要素方式へ移行

- スマホ幅の大区切り・時代カードの西暦チップを、`::after` 疑似要素方式から実DOM要素 `.mobile-year-chip`(`.group-year-chip` / `.era-year-chip`)へ変更。`script.js` の `renderTimeline()` / `renderEraCard()` がチップ要素を出力し、`styles.css` の `@media (max-width: 760px)` で `.era-group::after` / `.era::after` を `display: none` に切り替えた。
- チップの重複・非表示の調整を経て、最終的に大区切りと時代の両レベルで西暦チップを表示する状態へ復元。
- 変更前バックアップ: `data-backups/20260723-mobile-year-chip-dom-before/`、`data-backups/20260723-mobile-year-chip-restore-before/`

## 2026-07-22

### スマホUIを日本史側仕様へ引き継ぎ

- 上部メニューを「ページ目次(`eraDrawer` / `eraLinks`)」と「オプション(`optionDrawer` / `optionLinks`)」に分離。旧「ふりがな」「動き」「音」ボタンを本体HTMLから撤去。
- スマホ幅で `くらし` / `できごと` / `大きな力` の詳細を押したカード直下に表示、PC幅では従来通り3カード下の横断パネルとして表示。
- 各地域勢力タイムラインを、PCでは本文内埋め込み、スマホでは「各地域勢力タイムラインを開く」ボタンから `regionalTimelineDialog` へモーダル表示する構成に変更。モーダル本文は縦スクロールのみ、横スクロールはタイムライン部品1本に限定。
- 子カテゴリー開閉をシェブロンボタンに統一し、モバイルの子カテゴリー非表示・幅・王国アコーディオン表示を修復。
- 専門語ツールチップの `.term-tooltip-layer` を常に `document.body` 直下へ配置し、モーダル内でも下に隠れないよう修正。
- 地域タイムラインのバー高さ・ラベルチップ・ルビ・PC風スクロール・縦スクロール抑止などを調整。時代カードの `大きな力` フォントサイズを調整。
- 変更前バックアップ: `data-backups/20260722-143822-jhistory-ui-carryover-before/` ほか、`data-backups/20260722-mobile-*`、`data-backups/20260722-regional-timeline-*`、`data-backups/20260722-power-card-*`、`data-backups/20260722-fix-modal-tooltip-layer-before/`。

### 画像管理画面の人物対象を正式 `people` 配列のみに限定

- 画像管理画面(`image-workbench.js` の `modalPersonRecords()`)の人物一覧対象を `data/people-data.json` の `people` 配列のみに限定。`peopleByName` だけに存在する補助人物は画像管理の候補にしない。保存時は正式 `people` 側の画像情報を同名の `peopleByName` へ同期。
- 変更前バックアップ: `data-backups/20260722-people-image-workbench-official-only-before/`

### 人物データの整理(人物図鑑 300件 → 271件)

- 本文リンク・王国カードから参照されず画像もない軽微な人物を人物図鑑対象から整理。教材上必要な無画像人物は復元。結果として `people` は300件から271件、`peopleByName` は602件へ調整。
- あわせて南宋の王国・勢力カードを追加してモンゴル時代のタイムラインへ反映(`kingdomCards` 237→238、`kingdomPeople` 115→116)。コンスタンティヌス帝の人物データを修正。`history-content` の地域区分を補正(v2/v3)。
- 変更前バックアップ: `data-backups/20260722-125701-remove-unlinked-noimage-people-before/`、`20260722-125857-restore-required-noimage-people-before/`、`20260722-130146-remove-minor-noimage-people-before/`、`20260722-add-southern-song-kingdom-before/`、`20260722-fix-constantinus-emperor-person-before/`、`20260722-history-content-v3-region-corrected-before/`、`20260722-update-history-content-people-integrated-v2-before/`

## 2026-07-20

### 人物画像の割り当て・重複整理

- 未マッチだった確定人物画像の割り当て、人物アセットの重複整理(dedupe)を実施。ハンムラビの画像を差し替え、ジャンヌ・ダルクとジル・ド・レの画像取り違えを修正。
- 人物画像は1ファイルを複数人物が共有しないことを検証(`scripts/verify-static.js` の重複参照チェックで担保)。
- 変更前バックアップ: `data-backups/20260720-185344-assign-confirmed-unmatched-person-images-before/`、`20260720-195916-dedupe-people-assets-before/`、`20260720-203826-replace-hammurabi-image-before/`、`20260720-204947-clear-gilles-missing-image-before/`、`20260720-205342-fix-jeanne-gilles-image-swap-before/`

## 2026-07-19

### 画像ファイル名ASCII統一

- `data/*.json` と `data/*.js` が参照する画像パスを監査し、非ASCII画像参照290件をASCII名へ置換。
- 既存の日本語名画像は削除せず、同一画像を `person-<hash>.webp`、`action-<hash>.webp`、`subcategory-<hash>.webp` などへ145件コピー。
- `scripts/image-workbench-server.js` のData URL保存処理を修正し、今後の画像保存でも日本語IDやタイトルをファイル名に使わないようにした。
- `scripts/verify-static.js` に、画像参照がASCIIであり実ファイルが存在することを検証するチェックを追加。
- 変更前バックアップ: `data-backups/20260719-001741-ascii-image-paths-before/`
## 2026-07-18

### 「春秋・戦国時代」の部分リンク分割を防止

- 本文中の「春秋・戦国時代」が「戦国時代」だけでカードリンク化されないよう、`data/learning-terms.json` / `.js` に正式語として追加。
- 読みは `しゅんじゅう・せんごくじだい`、説明ツールチップは中国の春秋時代から戦国時代、秦の統一へつながる流れとして整理。
- 静的検証に必須語として追加し、今後の更新で分割リンクが再発した場合に検出できるようにした。
- 変更前バックアップ: `data-backups/20260718-shunju-sengoku-term/`

## 2026-07-17

### 勢力モーダルの関係人物リストを小さく調整

- 勢力カード下部の「この勢力に関わった人物」だけを対象に、見出しと人物ボタンのフォントサイズを `.82rem` へ縮小。
- ボタンの高さ・余白・アイコン間隔も詰め、3Dマップや人物・アクションモーダルには影響しないよう `#personDetail.kingdom-detail` 配下に限定。
- 検証: `scripts/verify-static.ps1` 通過。
- 変更前バックアップ: `design-baseline/restore-backups/20260717-shrink-kingdom-related-people-font/`


### 子カテゴリー名・サブタイトルのツールチップを無効化

- 子カテゴリー見出し、説明サブタイトル、各子カテゴリーカードの地域ラベル・タイトル・サブタイトルで `applyStudyRuby(..., { disableTooltips: true })` を使うよう変更。
- ルビは必要に応じて残し、ツールチップだけを出さない仕様にした。
- 本文 `.subcategory-body` やモーダル内の専門語ツールチップは維持。
- 検証: `script.js` 構文チェック、`scripts/verify-static.ps1` 通過。
- 変更前バックアップ: `data-backups/20260717-disable-subcategory-heading-tooltips/`


### モーダル説明文フォントを日本史側に合わせて調整

- 人物・アクションモーダルの説明本文 `.modal-info-section p` を日本史側と同じ `font-size: 1rem`、`line-height: 1.72`、左余白50pxへ調整。
- 勢力カード用の `#personDetail.kingdom-detail p` は専用レイアウト維持のため変更なし。
- 検証: `scripts/verify-static.ps1` 通過。
- 変更前バックアップ: `design-baseline/restore-backups/20260717-align-modal-text-font-japan/`


### 人物カード・アクションカードのデザインを日本史寄せに調整

- 世界史のアクションカード本文を日本史と同じ `.subcategory-card-body` 構造へ揃え、見出し・要約・画像・本文・タグの余白と行間を日本史側の基準へ調整。
- 人物名リストの枠線濃度とアイコン背景を日本史側に合わせて調整。
- 勢力カードと3Dマップの `.kingdom-*` / `.kingdom-map` 系CSSは変更対象から外し、地域タイムラインの表示も維持。
- 検証: `script.js` 構文チェック、`scripts/verify-static.ps1`、ローカルブラウザ実測でアクションカード・人物リスト・勢力モーダル3Dマップを確認。
- 変更前バックアップ: `design-baseline/restore-backups/20260717-align-person-action-card-design/`


### 人物名の難読漢字・称号ルビを追加

- 人物データ300人を監査し、純漢字名とカタカナ混じり名の漢字称号を確認。
- `則天武后`、`楊貴妃`、`鳩摩羅什`、`忽必烈`、`東条英機` など純漢字名を `data/learning-terms.json` / `.js` の人物ルビとして補正。
- `大王`、`大帝`、`航海王子`、`1世`、`14世` など、カタカナ混じり人物名に含まれる難読称号を部分ルビとして追加。
- 人物カード、人物一覧、人物モーダル、王国カード内の関連人物ボタンで、混在名の部分ルビが反映されるよう `personNameHtml()` を追加。
- `王` だけの suffix は小学校低学年の漢字であり、全漢字ルビ化を避ける方針に合わせて未追加。
- 検証: 純漢字名の未対応0件、難読称号の未対応0件、静的検証通過。
- 変更前バックアップ: `data-backups/20260717-person-name-ruby-kanji/`


### 人物・アクション本文内の専門語ツールチップを外部JSONへ追加

- 監査レポート `audits/people-action-term-audit-actionable-20260717.md` をもとに、人物・アクション説明文中の特殊語・専門語を精査。
- 人物名、単なる地域名、文章断片、一般語は除外し、意味説明が必要な専門語128件を `data/learning-terms.json` / `.js` に `tooltip` として追加。
- ツールチップは読み補助ではなく意味説明用とし、ルビ対象語とは分けて管理。
- `scripts/verify-static.js` の検証条件を、アクションカード名に加えて本文内専門語の意味説明ツールチップも許可する仕様へ更新。
- 検証: learning terms 518件、読み321件、ツールチップ239件、今回追加128件。
- 変更前バックアップ: `data-backups/20260717-special-term-tooltips/`


### 人物・アクションデータ由来の学習語を監査してlearning-termsへ統合

- 人物データとアクションデータの用語を抽出し、`data/learning-terms.json` / `.js` を `schemaVersion: 2` に更新。
- 人物名は読みが必要な漢字名だけルビ対象にし、人物名ツールチップは付けない方針へ整理。
- アクションカード111件を意味説明ツールチップ対象にし、`summary` と `modal.whatHappened` から説明文を作成。
- タグは確認済みの読みがあるものだけルビ対象にし、説明にならない汎用ツールチップは付けない方針へ整理。
- `script.js` を tooltip-only 語に対応させ、カタカナ語・英字語はルビなしの説明ツールチップとして扱えるようにした。
- 検証: learning terms 390件、読み321件、ツールチップ111件、人物読み105件、非アクションツールチップ0件。
- ブラウザ実行で `農業`、`キリスト教`、`AI` のツールチップ、`孔子`・`始皇帝` のルビ、王国表示のツールチップ抑制を確認。
- 変更前バックアップ: `data-backups/20260717-audit-people-action-learning-terms/`

## 2026-07-17

### 人物データを中学生向けv3へ全置換

- `\\LS720DD35\Family\永人\歴史学習教材\json\people-data_world_history_middle_school_v3.json` を正本として、`data/people-data.json` と `data/people-data.js` を全置換。
- 取り込み元に `genreGroups` と `inlineAliases` が含まれていなかったため、既存の人物UIメタデータを保持して統合。
- 件数は `people: 300`、`peopleByName: 632`、`genreGroups: 11`、`inlineAliases: 14`。
- `description` 混入なし、人物モーダル必須項目欠落なし、ジャンル不正なし、弱い定型文混入なしを確認。
- ブラウザ実行で人物一覧300件、人物フィルター14件、本文別名リンクを確認。
- 変更前バックアップ: `data-backups/20260717-replace-people-data-middle-school-v3/`

## 2026-07-17

### 地域タイムライン固定データを外部化

- `getTimelineRegion` のカード名例外・地域判定ルール、`eraRegionPriority`、`subcategoryTimelineRegions`、`subcategoryTimelineRegionOverrides`、`subcategoryTimelineKeywords`、`subcategoriesWithoutTimeline` を `data/timeline-region-data.json` / `.js` に統合。
- `index.html` で `data/timeline-region-data.js` を `script.js` より前に読み込むよう変更。
- `script.js` に `normalizeTimelineRegionData()` / `loadTimelineRegionData()` を追加し、地域タイムライン用固定データの直書きを廃止。
- 全237件の王国・勢力カードで旧 `getTimelineRegion` と外部データ判定の一致を確認。
- ブラウザ実行で `timelineRegionDataSource: js`、地域タイムライン54件、地域行122件、地域バー401件、実行時エラーなしを確認。
- 変更前バックアップ: `data-backups/20260717-externalize-timeline-region-data/`

## 2026-07-17

### 人物ジャンル表示定義と本文別名を人物データへ移行

- `script.js` の `personGenreGroups` 直書き配列を廃止し、`data/people-data.json` / `.js` の `genreGroups` から読み込む形へ変更。
- `script.js` の `personInlineAliases` 直書き辞書を廃止し、`data/people-data.json` / `.js` の `inlineAliases` から読み込む形へ変更。
- `normalizePeopleData()` で人物本体、ジャンル表示定義、本文リンク用別名を同時に初期化するよう修正。
- `scripts/verify-static.js` に `genreGroups` / `inlineAliases` の存在確認と、`script.js` 直書き再混入チェックを追加。
- ブラウザ実行で人物一覧300件、人物フィルター14件、`コロンブス` から `クリストファー・コロンブス` への本文リンクを確認。
- 変更前バックアップ: `data-backups/20260717-move-person-ui-metadata/`

## 2026-07-17

### アクションカードデータをv1へ全置換

- `C:\Users\tamak\OneDrive\Desktop\action-cards_world-history_rewritten_v1.json` を正本として、`data/action-cards.json` と `data/action-cards.js` を全置換。
- 件数は `actionCards: 111`。
- `description` 混入なし、アクションモーダル必須項目欠落なし、タグ配列不正なし、弱い定型文混入なしを確認。
- ブラウザ実行で年表・人物一覧・代表アクションモーダル `農業` の表示を確認。
- 変更前バックアップ: `data-backups/20260717-replace-action-cards-v1/`

## 2026-07-17

### 表示停止の復旧

- ルビ周辺整理時に欠落していた共通関数 `escapeHtml()` / `escapeRegExp()` を復旧。
- 時代カードと人物を結びつける `eraFor()`、`primaryEraIdForPerson()`、`personBelongsToEra()`、`getEraDetail()` を復旧。
- ブラウザ実行で `eraGroups: 10`、`eras: 10`、`personNameItems: 300`、`hasGyoshoRuby: true`、実行時エラーなしを確認。
- `scripts/verify-static.js` に基礎関数の欠落チェックを追加。

## 2026-07-17

### 人物データをv2へ全置換

- `C:\Users\tamak\OneDrive\Desktop\people-data_world_history_rewritten_v2.json` を正本として、`data/people-data.json` と `data/people-data.js` を全置換。
- 件数は `people: 300`、`peopleByName: 632`。
- `description` 混入なし、人物モーダル必須項目欠落なし、ジャンル不正なし、弱い定型文混入なしを確認。
- 変更前バックアップ: `data-backups/20260717-replace-people-data-v2/`

## 2026-07-17

### ルビ外部化後の厳格検証と不要処理整理

- `index.html` に `data/learning-terms.js` が読み込まれていない不整合を修正し、`script.js` より前に読み込む順序へ復旧。
- `initApp()` で `loadLearningTermsData()` と `setupTermTooltips()` を実行する順序を復旧。
- 日本史同様に必要な学習語ツールチップ処理は維持し、実データに `tooltip` がある語だけ表示する仕様を確認。
- 実表示で使っていなかった内部変数 `rubyGlossary` を削除し、スコープ別の `manualStudyRuby` / `manualKingdomRuby` / `manualPersonRuby` に一本化。
- `scripts/verify-static.js` に `data/learning-terms.js` の読み込み順チェックと、旧 `rubyGlossary` 変数の再混入チェックを追加。
- 検証: 構文チェック、JSON/JS同期、代表ルビ、カタカナ混じり語除外、王国ルビ、ツールチップ、description廃止、ジャンル移行、ローカル配信確認。
- 変更前バックアップ: `design-baseline/restore-backups/*before-20260717-ruby-strict-cleanup*`

## 2026-07-17

### ルビ対象語を外部データへ移行

- `script.js` に直書きされていたルビ辞書を廃止し、`data/learning-terms.json` / `.js` を新設。
- `window.WORLD_HISTORY_LEARNING_TERMS_DATA` を `script.js` より前に読み込み、なければ `data/learning-terms.json` を取得する構成へ変更。
- `normalizeLearningTermsData()` / `loadLearningTermsData()` を追加し、本文・王国・人物ごとの明示スコープからルビ適用対象を組み立てる形に変更。
- カタカナ混じり語の丸ごとルビ化や広範囲の自動ルビ化は入れず、難読語・人物名・王国名を個別管理する方針を維持。
- `tooltip` は任意項目とし、未設定時はフォールバック説明文を生成しない。
- 静的検証用に `scripts/verify-static.js` / `.ps1` を追加。
- 変更前バックアップ: `backups/20260717-ruby-system-migration/`

## 2026-07-17

### 人物ジャンルを人物データのgenreへ移行

- `script.js` の `personGenreOverrides` と `setPersonGenreOverrides()` を廃止。
- キーワードによる自動ジャンル判定をやめ、人物データ `data/people-data.json` / `.js` の `genre` 配列だけを人物図鑑フィルターとモーダルタグに使用。
- 旧上書き・判定結果を人物データへ移し、全632件の `peopleByName` に有効な世界史ジャンルIDが入っていることを確認。
- 変更前バックアップ: `design-baseline/restore-backups/script.before-20260717-person-genre-data-only.js`
- 変更前バックアップ: `data-backups/20260717-split-people-action-data/people-data.before-genre-data-only.json`
## 2026-07-17

### 人物カードとアクションカードのデータを分離

- `data/modal-data.json` / `.js` から人物カードとアクションカードを分離し、`data/people-data.json` / `.js` と `data/action-cards.json` / `.js` を新設。
- 人物データを日本史側と同じ `name`、`kana`、`title`、`genre`、`modal.profile`、`modal.whatDid`、`modal.whyImportant` 構造へ移行。
- `data/modal-data.json` / `.js` は王国・勢力カード `kingdomCards` と `kingdomPeople` 専用に整理。
- `script.js`、`index.html`、画像作業ページ、画像反映サーバーを分離データの読み込み・保存・ロールバックに対応。
- 変更前バックアップ: `data-backups/20260717-split-people-action-data/`
このファイルは「スクロールでわかる 世界のれきし」の主な変更内容を記録します。
デザイン・データに関わる変更は、[DESIGN_GUARDRAILS.md](DESIGN_GUARDRAILS.md) のルールに従って行います。

## 2026-07-16

### 人物モーダルのお気に入りを星アイコン配置へ変更

- タグ下の横長お気に入りボタンを廃止し、人物モーダル左上の人物アイコン直下に `☆/★` だけのアイコンボタンを配置。
- `heroActions` を廃止し、人物モーダルだけ `sideActions` で星ボタンを差し込む構成に変更。
- モーダル内の表示文字「お気に入りに追加」「お気に入り済み」は削除し、`aria-label` と `aria-pressed` で状態を伝える仕様に変更。
- `index.html` の `styles.css` / `script.js` キャッシュバスターを更新。
- 変更前バックアップ: `design-baseline/restore-backups/script.before-20260716-person-modal-favorite-icon.js`
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260716-person-modal-favorite-icon.css`
- 変更前バックアップ: `design-baseline/restore-backups/index.before-20260716-person-modal-favorite-icon.html`
- 変更前バックアップ: `design-baseline/restore-backups/ARCHITECTURE_MAP.before-20260716-person-modal-favorite-icon.md`
- 変更前バックアップ: `design-baseline/restore-backups/VERIFICATION_GUIDE.before-20260716-person-modal-favorite-icon.md`
- 変更前バックアップ: `design-baseline/restore-backups/CHANGELOG.before-20260716-person-modal-favorite-icon.md`
## 2026-07-16

### 人物モーダルへお気に入りボタンを追加

- 日本史側の仕様に合わせ、人物モーダルのタグ下に「お気に入りに追加 / お気に入り済み」ボタンを追加。
- 既存の人物図鑑お気に入り保存先 `localStorage.historyFavorites` と同期し、モーダル内で登録・解除した直後に人物図鑑側も再描画するようにした。
- アクションカード・王国カードにはお気に入りボタンを表示しない。
- `index.html` の `styles.css` / `script.js` キャッシュバスターを更新。
- 変更前バックアップ: `design-baseline/restore-backups/script.before-20260716-person-modal-favorite.js`
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260716-person-modal-favorite.css`
- 変更前バックアップ: `design-baseline/restore-backups/index.before-20260716-person-modal-favorite.html`
- 変更前バックアップ: `design-baseline/restore-backups/ARCHITECTURE_MAP.before-20260716-person-modal-favorite.md`
- 変更前バックアップ: `design-baseline/restore-backups/VERIFICATION_GUIDE.before-20260716-person-modal-favorite.md`
## 2026-07-16

### 画像作業ページの本体反映停止を修正

- `embeddedImageCount()` の欠落により、本体へ反映ボタンがAPI送信前に止まる問題を修正。
- 人物画像の保存時に、`modalData.people` と `modalData.peopleByName` の同一人物へ画像メタ情報を同期するよう修正。
- `buildPatch()` で保存前同期を必ず実行し、サーバー側の保存照合で `peopleByName` 優先になっても失敗しないようにした。
- 検証: ハンムラビへ既存子カテゴリー画像を割り当てて本体反映成功後、作成バックアップへロールバック。
- 検証用バックアップ: `backups/image-workbench-apply-20260716-141215/`
- ロールバック前バックアップ: `backups/image-workbench-rollback-before-restore-20260716-141404/`
- 変更前バックアップ: `design-baseline/restore-backups/image-workbench.before-20260716-embedded-image-count-fix.js`
- 変更前バックアップ: `design-baseline/restore-backups/image-workbench-server.before-20260716-fffd-message.js`
- 変更前バックアップ: `design-baseline/restore-backups/CHANGELOG.before-20260716-image-workbench-apply-fix.md`
- 変更前バックアップ: `design-baseline/restore-backups/VERIFICATION_GUIDE.before-20260716-image-workbench-apply-fix.md`

## 2026-07-16

### 日本史側のカード生成・データ管理ドキュメントを世界史へ反映

- 日本史側 `ARCHITECTURE_MAP.md` / `VERIFICATION_GUIDE.md` のうち、カード生成、データ正本、JSON/JS同期、画像作業ページ保存API、ロールバック検証の考え方を世界史仕様へ読み替えて取り込み。
- 世界史側 `ARCHITECTURE_MAP.md` を、画像作業ページメモから、`history-content` / `modal-data`、`script.js` のカード生成関数、モーダル生成、画像保存APIまで追える構成マップへ拡張。
- 世界史側 `VERIFICATION_GUIDE.md` に、カード生成・データ管理の静的検証、モーダル定型文禁止、本文リンク/サブタイトル非リンク、画像作業ページの本番データ直接保存ルールを追加。
- 変更前バックアップ: `design-baseline/restore-backups/ARCHITECTURE_MAP.before-20260716-card-data-map.md`
- 変更前バックアップ: `design-baseline/restore-backups/VERIFICATION_GUIDE.before-20260716-card-data-map.md`

## 2026-07-16

### 世界史用の画像作業ページを追加

- 日本史側の `image-workbench.html` / `image-workbench.css` / `image-workbench.js` / `scripts/image-workbench-server.js` / `start-image-workbench-server.bat` を世界史向けに移植。
- 世界史側の一体型データ `data/modal-data.json` / `data/modal-data.js` に合わせ、人物・アクション画像は配列末尾の画像メタ情報として保存する方式に変更。
- 子カテゴリー画像は従来どおり `data/history-content.json` / `data/history-content.js` に保存し、`imageFocus` は子カテゴリーだけ表示・保存する仕様を維持。
- 保存時は `backups/image-workbench-*` にバックアップを作成し、`history-content` と `modal-data` のJSON/JSを同時更新する。
- 本番モーダルで人物・アクションの直接割り当て画像を優先表示するよう `script.js` を調整。
- 子カテゴリー画像位置に `down` 表示クラスを追加。
- 検証用バックアップ: `backups/image-workbench-apply-20260716-095804/`
- ロールバック前バックアップ: `backups/image-workbench-rollback-before-restore-20260716-095824/`
- 変更前バックアップ: `design-baseline/restore-backups/script.before-20260716-image-workbench-migration.js`
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260716-image-workbench-focus.css`

## 2026-07-16

### 人物・アクションモーダル下段カードの幅を修正

- 2枚構成などで最後の説明カードが左カラム幅のままにならないよう、`.modal-info-section:last-child:nth-child(even)` を全幅化。
- 最小高さを上段カードと同じ112pxにして、右側の空きと余分な高さを抑制。
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260716-modal-last-section-fullwidth.css`

## 2026-07-10

### description項目を廃止

- `data/history-content.json` と `data/history-content.js` からトップ階層の `description` 項目を削除。
- `script.js` 内の `subcategoryDescription` / `description` ローカル名を `subcategoryBodyText` / `bodyText` に変更。
- `.subcategory-description` は `.subcategory-body` に名称変更し、見た目の指定内容は維持。
- 変更前バックアップ: `data-backups/20260710-remove-description/`
- 変更前バックアップ: `design-baseline/restore-backups/script.before-20260710-remove-description.js`
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260710-remove-description.css`

## 2026-07-04

### 自動ルビ適用を廃止し、個別指定方式へ変更

簡単な単語や漢字にルビが付き、難しい単語や名前にルビが不足する状態を避けるため、`applyStudyRuby()` の広範な自動辞書適用を廃止。

- 当時の実装で、広範な自動ルビ化をやめ、個別指定した難読語・歴史語だけを対象に変更。現在の正本は `data/learning-terms.json` / `.js`。
- `中国`、`世界`、`時代` などの簡単な語は、辞書にあっても自動ではルビ化しない。
- 本文リンク中の人物名は、対象が人物カード本人名の場合だけ人物データの読みを使い、読み未設定の漢字人物名は `manualPersonRuby` の個別補助リストで対応。
- 王国カード名は `applyKingdomRuby()` で別扱いにし、通常本文では誤爆しやすい `秦`、`隋`、`唐`、`宋`、`元`、`明`、`清` など一文字王朝名も王国カード表示内では個別ルビ化。
- 変更前バックアップ: `design-baseline/restore-backups/script.before-20260704-manual-ruby-only.js`
- 王国カード名ルビ追加前バックアップ: `design-baseline/restore-backups/script.before-20260704-kingdom-ruby-audit.js`

## 2026-07-03

### 王国カード・タイムライン用ルビ辞書を拡充

王国カードや地域タイムラインで `仰韶文化` など難読の王国・勢力名にルビが不足していたため、当時の `script.js` 内ルビ処理を調整。現在の正本は `data/learning-terms.json` / `.js`。

- 当時のルビ管理箇所は `script.js` 内辞書。現在は `data/learning-terms.json` / `.js` に外部化済み。
- `仰韶文化`、`龍山文化`、`河姆渡文化`、`良渚文化`、`紅山文化`、`三星堆文化`、`殷王朝`、`渤海` など、王国・勢力カードに出る難読語を追加。
- カタカナ混じりの辞書語を語全体でルビ化する調整は撤回し、`applyStudyRuby()` は漢字語・漢字部分だけを対象にする従来仕様へ戻した。
- 漢字すべてにルビを付けるのではなく、`applyStudyRuby()` では1文字語を自動対象から外し、難読語・歴史語など語単位のルビを優先するよう調整。
- 王国・アクションカード名、タグ、地域名から漢字を含む表示語を抽出し、歴史語・難読語・小学生向けに読みが必要な語を重点的に補完。
- `仰韶文化(中国)` のタイムラインボタンと王国モーダルで、`ぎょうしょうぶんか` のルビ表示を確認。
- 変更前バックアップ: `design-baseline/restore-backups/script.before-20260703-ruby-glossary-expansion.js`
- 撤回前バックアップ: `design-baseline/restore-backups/script.before-20260703-revert-mixed-katakana-ruby.js`
- 1文字語ルビ抑制前バックアップ: `design-baseline/restore-backups/script.before-20260703-skip-single-kanji-ruby.js`

### 人物・アクションモーダルの自動定型文を削除

人物・アクションモーダルで `script.js` が本文冒頭や重要性説明を自動生成していたため、登録済みデータだけを表示する形へ変更。

- 人物モーダルの「どんな人物？」は登録済み説明文のみ、「何をした？」は登録済み肩書きのみを表示。
- アクションモーダルの「どんな内容？」は登録済み要約のみ、「何が起きた？」は登録済み説明文のみを表示。
- 登録済み本文がないセクションは描画しないようにし、欠損時の自動フォールバック文を出さないよう変更。
- `script.js` 内の弱い定型表現検索で0件、`エイブラハム・リンカーン` と `インターネットの普及` の実モーダルで定型文なしを確認。
- 変更前バックアップ: `design-baseline/restore-backups/script.before-20260703-remove-modal-boilerplate.js`

### 王国カードの説明文位置と下段余白を調整

王国・勢力カードで説明文が下段へ流れ、左下のタグ下に余白ができていたため、王国モーダル内のグリッド行を明示して再調整。

- 説明文を右カラムのサブタイトル直下に固定。
- 3D地図は左上段に固定し、関連人物とタグは地図の下段に全幅で並ぶよう調整。
- `エチオピア帝国近代(エチオピア)` と `ローマ帝国(ヨーロッパ南部全域)` で、デスクトップ1366×900・モバイル390×844ともに外側スクロールなし、説明文位置正常を確認。
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260703-kingdom-description-position.css`

### 王国カードの関連人物欄を3D地図の下へ移動

王国・勢力カードで「この勢力に関わった人物」の人数により3D地図枠の高さが変わらないよう、王国モーダルの配置を再調整。

- 上段は左に3D地図、右にタイトル・説明を置く構成に固定。
- 「この勢力に関わった人物」は上段の下に全幅で表示し、人数が多い場合は人物欄の内部だけスクロールするよう変更。
- 3D地図はデスクトップで高さ320px、モバイルで高さ約220pxに固定し、人物数による表示変化を防止。
- 関連人物最多の `ローマ帝国(ヨーロッパ南部全域)` 17人と、通常サンプルの `中華人民共和国(中国)` 3人で、デスクトップ1366×900・モバイル390×844ともに外側スクロールなし、3Dキャンバス表示ありを確認。
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260703-kingdom-people-below-map.css`

### 王国カードモーダルの3D地図配置を調整

王国・勢力カードで3D地図の高さによりモーダルがスクロールしやすくなっていたため、王国モーダル専用の2カラム配置へ調整。

- デスクトップでは3D地図を左側、タイトル・説明・関連人物・タグを右側にまとめる配置へ変更。
- 地図キャンバスの高さを本文側と揃え、ダイアログ内スクロールが出ないよう調整。
- モバイルでは1カラムへ戻し、3D地図が横幅いっぱいに表示されるよう列指定をリセット。
- `中華人民共和国(中国)` の王国カードでデスクトップ1366×900、モバイル390×844ともにスクロールなし、3Dキャンバス表示ありを確認。
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260703-kingdom-modal-side-map.css`

### モーダル内フォントとスクロールを再調整

アクションモーダルでタイトルが太く大きく見え、ルビ込みで圧迫感が出ていたため、モーダル内フォントと余白を再調整。

- タイトルの太さを落とし、ルビ込みで収まるようタイトルサイズと行高を縮小。
- サブタイトル、本文、説明カード見出し、タグの文字サイズと余白を全体的に縮小。
- 説明カードの最小高さと本文行間を詰め、代表アクションモーダルでダイアログ内スクロールが出ないことを確認。
- 人物モーダルと王国・勢力モーダルも代表表示でスクロールなし、画像/3D地図表示ありを確認。
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260703-modal-font-scroll-fit.css`
### モーダルサイズを元の幅・高さへ再調整

前回の参考画像寄せで大きくなりすぎた人物・アクション・王国モーダルを、元の実用サイズ感へ戻してバランスを調整。

- ダイアログ幅を `min(1008px, 90vw)`、最大高さを `min(88vh, 760px)` に戻した。
- 右画像を320×220px基準へ縮小し、タイトル・サブタイトル・タグ・説明カードも同じ比率で調整。
- 説明カードは上段約150px、下段約190px以上を基準にし、読みやすさを保ちながら縦長になりすぎないよう整理。
- モバイル幅390pxで横スクロールが出ないことを確認。
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260703-modal-size-rebalance.css`
### モーダルデザインを参考画像に合わせて再調整

ユーザー提供の参考画像に合わせ、人物・アクションモーダルの余白、フォント、画像サイズ、説明カードの高さを再調整。

- ダイアログ幅を約1490px、最大高さを画面上下14px程度に収まる指定へ変更。
- 上段を左タイトル情報、右560×376px画像の構成に調整。
- タイトル、サブタイトル、タグ、説明本文のフォントサイズと行間を参考画像寄りに調整。
- 説明カードを角丸20px、1枚目250px、下段330pxの最小高さに整理。
- セクション見出しアイコンを青い角丸タイル内の白抜きSVGへ変更。
- モバイル幅では1カラム化し、横スクロールが出ないことを確認。
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260703-modal-reference-polish.css`、`design-baseline/restore-backups/script.before-20260703-modal-reference-polish.js`
### モーダルデザインを日本史側の新仕様に合わせて調整

日本史教材のモーダル修正引継ぎをもとに、世界史側の人物・アクションモーダルを共通の学習モーダルレイアウトへ変更。

- `script.js` に `renderLearningModal`、画像探索、説明セクション生成、モーダル本文リンク化の補助関数を追加。
- 人物モーダルは「どんな人物？」「何をした？」「なぜ重要？」の3区画で表示するよう変更。
- アクションモーダルは「どんな内容？」「何が起きた？」「なぜ重要？」の3区画で表示するよう変更。
- モーダル右側に関連する子カテゴリー画像または時代画像を表示し、画像がない場合はアイコン表示へフォールバック。
- `styles.css` を日本史側の白背景、青い外枠、右画像、タグをサブタイトル直下に置く構成へ調整。
- 王国・勢力モーダルは既存の3D地図構造を維持しつつ、新しいダイアログ幅・枠・閉じるボタンに合わせて調整。
- 変更前バックアップ: `design-baseline/restore-backups/styles.before-20260703-modal-redesign-world.css`、`design-baseline/restore-backups/script.before-20260703-modal-redesign-world.js`
## 2026-07-02

### 大カテゴリー・時代カード・子カテゴリーをJSONへ分離

大カテゴリー、時代カード、子カテゴリー本文で使う階層データを `script.js` から分離。

- `data/history-content.json` を追加し、10大カテゴリー、10時代カード、53子カテゴリー、10件の「できた王国・勢力・その他」を格納。
- `file://` で直接開いた場合にも読み込めるよう、同内容の `data/history-content.js` を追加し、`script.js` より先に読み込む構成へ変更。
- `script.js` は階層JSONを読み込んで既存の描画用データへ正規化し、年表、時代カード、子カテゴリーを初期化する構成へ変更。
- 左メニューの大カテゴリーリンクに `data-group-id` を付け、クリック時に他の大カテゴリーを閉じて対象カテゴリーだけを開くよう変更。
- 大カテゴリーを開いた時代カード一覧に軽い表示アニメーションを追加。
- 変更前バックアップ: `design-baseline/styles.before-menu-history-content-20260702-002944.css`
- データバックアップ: `data-backups/20260702-014813-history-modal-data`

## 2026-07-01

### 本文リンクの対象を整理

サブタイトルや見出し補足文ではカードリンクを付けず、説明本文・詳細本文では人物、アクション、王国・勢力・その他カードへつながるよう整理。

- 子カテゴリー要約、時代カード上部の問い、大カテゴリー内の補足見出しではリンク生成を行わないよう変更。
- 説明本文・詳細本文・アクションカード本文に出る唐、宋、中華人民共和国などの王国・勢力・その他カード名を本文リンク化。
- モーダル内の本文リンクも人物・アクション・王国カードを開けるようクリック処理を共通化。
- サブタイトル非リンクのルールを `AGENTS.md` と `DESIGN_GUARDRAILS.md` に追加。
- 検証ガイドにサブタイトル非リンクと王国リンク確認の観点を追加。

### モーダル表示データをJSONへ分離

人物カード、アクションカード、王国・勢力カードでモーダル表示に使うデータを `script.js` から分離。

- `data/modal-data.json` を追加し、人物300件、人物参照632件、アクションカード111件、王国・勢力カード237件、勢力関連人物115件を格納。
- `file://` で直接開いた場合にも読み込めるよう、同内容の `data/modal-data.js` を追加し、`script.js` より先に読み込む構成へ変更。
- `script.js` はJSON読み込み後に年表、人物図鑑、モーダルを初期化する構成へ変更。
- 年表計算、リンク生成、モーダル描画などの処理は `script.js` に残し、本文データと表示ロジックを分離。
- ブラウザで人物モーダル、アクションモーダル、王国・勢力モーダルが開くことを確認。

### 人物説明の汎用文を見直し

重要人物の説明が「考える人物です」などの汎用文で終わらないよう、人物カードと子カテゴリー人物メモを精査。

- エイブラハム・リンカーンを、アメリカ第16代大統領、南北戦争、奴隷解放宣言、ゲティスバーグ演説、奴隷制廃止に触れる説明へ修正。
- 奴隷制廃止、独立運動、近代化、世界大戦、冷戦、科学技術、インターネット、文化・スポーツに関わる主要人物の個別説明を追加。
- 「考える人物です」「手がかりになります」「重要人物です」など、内容の薄い定型表現を人物説明と子カテゴリー人物メモから除去。
- `script.js` の構文チェックと、人物モーダルで開ける632件の弱い定型文チェックを実施。

### 勢力カードに中華人民共和国を追加

「できた王国・勢力・その他」で確認できる現代の勢力として、中華人民共和国を追加。

- 「今につながる時代」の「独立した新国家」に中華人民共和国を追加。
- 地図位置、現代地域、1949年から現在までの年表範囲を設定。
- 関連人物として毛沢東、周恩来、鄧小平を紐づけ。

### 左メニューの階層表示と縦収まりを調整

左側メニューで、10個の大カテゴリーが「年表」の配下に見えるように一段右へ寄せ、画面縦幅に収まるようリンクの余白とフォントサイズを調整。

- 年表配下の大カテゴリーリンクに専用クラスを付け、左ガイド線と20pxのインデントを追加。
- メニュー項目の上下余白、補足文字サイズ、項目間隔を圧縮。
- 高さ720px以下の画面では補足説明を非表示にし、全リンクが縦に収まるよう調整。
- 変更前バックアップ: `design-baseline/styles.before-drawer-compact-20260701-101110.css`

### 人物図鑑のジャンル分類を複数タグ対応へ変更

「人物カードを選んで見る」のジャンルを見直し、人物が複数の分類で検索・絞り込みできるように変更。

- 「政治・国づくり」を「国王・権力者」と「政治家」に分割し、「指導者」ジャンルは使わない形に整理。
- 「学問・科学・医療」を「政治学者」「哲学者」「科学者」「医療・看護」に分割。
- 孔子、韓非、李斯、荀子、ルソー、ソクラテスなど、政治思想や哲学に関わる人物は「政治家」「政治学者」「哲学者」へ明示的に分類。
- カント、シラー、ニーチェ、デカルトなどの有名な哲学者を人物カードへ追加し、哲学者・政治学者・科学者・文化系タグで絞り込めるよう分類。
- 鄧小平など、国家権力を持った政治家は「国王・権力者」「政治家」の複数ジャンルで表示。
- カール大帝、グレゴリウス1世、レオニダスなど、説明文のキーワードで誤って学問系タグが付かないよう、明示分類を優先する処理に変更。
- 一覧表示、ジャンルフィルター、人物モーダルのタグ表示を複数ジャンル対応に変更。
- `script.js` 構文チェックと、指定例の人物が意図したジャンルに入ることを確認。

### 導入カードの見た目を調整

トップ下の「くらし」「国とつながり」「人物」カードを、アイコンとタイトルの位置がそろう横組みレイアウトに変更。

- アイコンを小さな色付きバッジにし、カード左端に細いアクセント線を追加。
- カードの高さ、影、余白を抑え、3枚のバランスがそろうように調整。
- 変更前バックアップ: `design-baseline/styles.before-guide-grid-polish-20260701-022013.css`

### 人物図鑑を名前一覧表示へ変更

ページ下部の「人物カードを選んで見る」を、人物カード全文の一覧ではなく、アイウエオ順の名前ボタン一覧に変更。

- 一覧では人物名、時代、ジャンルだけを軽く表示し、クリック時に人物カードのモーダルを開く形式に変更。
- 検索、ジャンルフィルタ、お気に入りフィルタは維持。
- ジャンヌ・ダルク、ジル・ド・レエを「交易と王国の時代」の人物として追加。
- 変更前バックアップ: `design-baseline/styles.before-people-name-list-20260701-015932.css`

### 時代カードの開閉ボタン配置と画像位置指定を調整

時代カード内の「くらし」「できごと」「大きな力」で、タイトルとアコーディオンボタンのバランスを調整。

- 開閉ボタンをタイトル行の右側にそろえ、タイトルが不自然に下がらないように変更。
- `number.txt` の更新に合わせ、子カテゴリー画像の上寄せ指定を再反映。
- 「できた王国・勢力」を「できた王国・勢力・その他」に変更。
- 変更前バックアップ: `design-baseline/styles.before-fact-toggle-balance-20260701-014000.css`

### インターネットサービスの勢力遷移タイムラインを追加

「インターネットの広がり」に、一般的な世界タイムラインではなく、インターネット普及と主要サービスの広がりが分かる専用タイムラインを追加。

- 「インターネットの普及」「Google検索」「Wikipedia」「Facebook」「YouTube」「Twitter / X」「WhatsApp」「Instagram」「WeChat」「TikTok」を、開始年から現在までのバーとして表示。
- サービス系のタイムラインバーは王国カードではなく、アクションカードのモーダルを開くように変更。
- 「SNS」をアクションカードに追加。
- 「東アジアの経済とくらしの変化」のタイムライン非表示と、「地球規模の課題とAI」の世界タイムライン表示は維持。

### 子カテゴリー内タイムラインの表示位置を調整

今につながる時代の子カテゴリーで、内容と合わない地域タイムライン表示を整理。

- 「東アジアの経済とくらしの変化」は、子カテゴリー内の地域タイムラインを非表示に変更。
- 「インターネットの広がり」は、子カテゴリー内の地域タイムラインを非表示に変更。
- これまで「インターネットの広がり」で先に表示されていた「世界」タイムラインは、後続の
  「地球規模の課題とAI」で表示されるように調整。
- 画像、本文、アクションカード、全体の地域タイムラインは変更なし。

## 2026-06-30

### 全子カテゴリー画像53件を番号対応で差し替え

ユーザー提供の `number.txt` と番号付き画像1〜53に合わせて、世界史アクション子カテゴリー全件の画像を整理。

- `assets/subcategories/subcategory-01.png` から `subcategory-53.png` までを新しい画像に差し替え。
- `script.js` の `subcategoryImages` を35件から53件へ拡張し、全子カテゴリーに画像を表示。
- `number.txt` で末尾に `↑` が付いた15件は、`.subcategory-image-up` を付けて画像を下方向へ約100px動かし、中心より上の範囲を表示。
- 子カテゴリー画像の高さ200px、`object-fit: cover` は既存仕様を維持。
- 変更前バックアップ: `design-baseline/styles.before-all-subcategory-images-20260630-231911.css`

### 番号付き子カテゴリー画像に差し替え

ユーザーが番号を付けた画像に合わせて、子カテゴリー画像の対応を整理。

- `1.png` から `21.png` をもとに、東アジア農耕からモンゴル帝国までの画像を差し替え。
- 「インド洋交易の広がり」「ヨーロッパ都市と商人の成長」「モンゴル帝国と東西交流」に画像を追加。
- 「西アジアの農業と牧畜」は番号付き画像に含まれていないため、前回追加済みの画像を維持。

### 子カテゴリー画像を追加し200px高でトリミング表示

ユーザー提供画像を、世界史アクション子カテゴリーの一部へ追加。

- `assets/subcategories/` に19枚の画像を追加。
- `script.js` に `subcategoryImages` を追加し、対応する子カテゴリーだけ画像を表示。
- `.subcategory-image` を追加し、高さ200px、`object-fit: cover`、中央トリミングで表示。
- `DESIGN_GUARDRAILS.md` と `AGENTS.md` に、子カテゴリー画像は高さ200pxで表示するルールを明記。
- 変更前バックアップ: `design-baseline/styles.before-subcategory-images-20260630-162444.css`

### 詳細本文のフォントサイズを時代カード3項目に統一

時代カード下の詳細コンテンツが「くらし」「できごと」「大きな力」より大きく見えていたため、同じフォントサイズ基準へ調整。

- `.inline-detail` 内の見出し、本文、補足カードを `.fact-grid .fact-card` と同じ文字サイズ・行間に統一。
- `DESIGN_GUARDRAILS.md` と `AGENTS.md` に、詳細本文のフォントサイズ基準を明記。
- 変更前バックアップ: `design-baseline/styles.before-detail-font-match-20260630-152357.css`

### コンテンツ枠の内側余白を15px以上に統一

枠線や背景を持つコンテンツ領域について、枠と本文テキストの内側余白を15px以上確保するルールを追加。

- `styles.css` の時代リンク、詳細枠、地域タイムライン、王国・勢力エリア、子カテゴリー内タイムラインなどを15px基準へ調整。
- `DESIGN_GUARDRAILS.md` の「余白とサイズ」に、15px以上の内側余白ルールと例外対象を明記。
- 変更前バックアップ: `design-baseline/styles.before-15px-content-padding-20260630-151540.css`

### 時代カード3項目の文字サイズを調整

時代カード内の「くらし」「できごと」「大きな力」の見出しと本文が大きすぎたため、対象を
`.fact-grid` 内に限定してフォントサイズと行間を調整。

- `styles.css` に `.fact-grid .fact-card h3` と `.fact-grid .fact-card p` のサイズ指定を追加。
- 変更前バックアップ: `design-baseline/styles.before-era-fact-font-20260630-150943.css`

### 詳細本文の自動リンク誤判定を修正

詳細本文で短いカタカナ人物名が、別のカタカナ語の一部に誤ってリンクされる問題を修正。

- 「イスラム世界」の中の「スラ」が人物カード「スラ」へ誤リンクされていた問題を修正。
- `shouldSkipInlineLink` を追加し、カタカナ名が別のカタカナ語の中に埋まっている場合は自動リンクしないようにした。
- 「イスラム世界」をアクションカードとして追加し、本文中では語全体を正しくリンク。
- 全時代詳細の自動リンクを検査し、1〜2文字のカタカナ人物名による同種の誤リンクがないことを確認。

### 複数勢力が拮抗した時代背景をアクションカードとタイムラインへ追加

一つの王国・帝国ではなく、複数の勢力が並び立ったり競い合ったりした時代を、時代背景が分かる
アクションカードとして追加。地域タイムラインにも背景カードとして表示する。

- `script.js` に `rivalryPeriodCards` を追加し、23件の拮抗時代を定義。
  - 中国: 春秋時代、戦国時代、三国時代、五胡十六国時代、中国南北朝時代、五代十国時代
  - 地中海・ヨーロッパ: ギリシャポリスの競合、ヘレニズム諸国の並立、タイファ諸王国の時代、
    イタリア都市国家の競合、イタリア戦争、オスマン・ハプスブルク対立、三十年戦争、
    ヨーロッパ列強の勢力均衡、戦間期の独裁と民主主義の対立
  - 南アジア・朝鮮半島・日本・アメリカ・アフリカ:
    十六大国の時代、朝鮮三国時代、日本の戦国時代、マヤ都市国家の競合、
    サヘル諸王国の競合、北米植民地と先住民勢力の競合、アフリカ分割の列強競合、
    東アジア列強進出期
- 追加した23件は `actionCards` にも登録し、アクションカードとして開けるようにした。
- 地域タイムラインでは `regional-bar-rivalry` として王国・運動・国際機関とは別色で表示。
- 拮抗時代カードを開いた場合、モーダル見出しを「王国カード」ではなく「アクションカード」とし、
  地図キャプションも「中心地域」と表示。
- 変更前バックアップ: `design-baseline/styles.before-rivalry-periods-20260630-122555.css`
- `script.js` 構文チェック、23件全件のアクションカード登録、全件のタイムライン種別判定を確認済み。

### 教科書基準の地域別アクション小カテゴリーを追加

ユーザー指定の「世界史アクションカード：教科書基準の地域別子カテゴリー」を、各大カテゴリー内の
時代カードと地域タイムラインの後に続く子カテゴリー学習ブロックとして追加。

- `script.js` に `worldHistoryActionSubcategories` を追加し、10時代・53件の地域別小カテゴリーを定義。
  - 農業と村: 3件
  - 最初の文明: 4件
  - 古代の大国: 5件
  - 宗教と文化: 5件
  - 交易と王国: 6件
  - 大航海と出会い: 5件
  - 革命と工場: 6件
  - 世界が深く結びついた時代: 6件
  - 二つの世界大戦: 6件
  - 今につながる時代: 7件
- 各子カテゴリーの表示を「くらし」「できごと」「大きな力」の3分割ではなく、
  タイトルの状況が分かる300文字以内の説明文1本へ変更。
  `subcategoryDescription` で小中学生向けの短い説明を生成。
- `renderActionSubcategories` を追加し、大カテゴリーを開いたときに、該当時代の子カテゴリーカードを
  時代カード本体と地域タイムラインの下へ表示。
- 大カテゴリーカード内の表示順を「大カテゴリー → サブタイトル → 補足キーワード」に整理し、
  画面全体の表示順を「大カテゴリー → 時代カード → 地域タイムライン → 子カテゴリー」へ変更。
- 時代カード直後に表示する全体用タイムラインの見出しを「各地域勢力タイムラインまとめ」に変更。
  子カテゴリー内の個別タイムライン見出しは「地域タイムライン」のまま維持。
- 各子カテゴリーカード内に、関係する王国・勢力だけを抽出した小型の地域タイムラインを表示。
  例: 「食べ物を育て、村ができた」の下に、西アジア・東アジア・南北アメリカの子カテゴリーと、
  それぞれに関係する勢力タイムラインを表示する。
- `subcategoryMatchesRegion` と `relatedKingdomsForSubcategory` を追加し、地域名・国名・タグを見て
  子カテゴリーに関係する勢力が一か所へ固まりすぎないよう分散表示。
- 子カテゴリーごとの地域タイムラインは残しつつ、同じ大カテゴリー内で同じ地域構成のタイムラインが
  重複表示されないよう調整。
- `subcategoryTimelineRegionOverrides` と `subcategoryTimelineKeywords` を追加し、子カテゴリーと関係が深い
  地域・勢力だけを優先表示。関係する勢力がない子カテゴリーでは、無関係なタイムラインを表示しない。
- `actionCards` に小カテゴリー53件を統合し、既存23件と合わせてアクションカード総数は76件。
- 各時代の「できごと」詳細文の末尾に、該当小カテゴリー名を追加。
  既存の `enrichDetailLinks` により、本文中の小カテゴリー名からアクションカードを開ける。
- 地域タイムラインの `eraRegionPriority` を教科書小カテゴリーの地域関係に合わせて再調整。
  勢力数が多い地域に固まりすぎないよう、時代ごとに関係性・代表性の高い地域を優先表示する。
- `styles.css` に子カテゴリー説明、カード内小型タイムライン用の表示調整を追加。
  変更前バックアップ: `design-baseline/styles.before-subcategory-blocks-20260630-104444.css`
- 子カテゴリーを囲うカード枠を外し、細い区切り線だけのリスト表示へ変更。
  変更前バックアップ: `design-baseline/styles.before-unframed-subcategories-20260630-150356.css`
- `script.js` 構文チェック、小カテゴリー全53件の表示、全件のアクションカード化、
  同じ大カテゴリー内で同一地域構成の子カテゴリータイムラインが重複しないこと、各時代詳細への導線追加を確認済み。

### 小学生の世界史で頻出する重要人物を24名追加

定番の重要人物（教科書・中学受験で頻出）の有無を全データに対して厳正にチェックした結果、
多数の超有名人物が未登録だったため追加（実在個人・説明50〜150字・いつどこで何をしたかを明記・
既存300名と同じ文体）。

- 古代: 釈迦（仏教の開祖）、ハンニバル、カエサル、クレオパトラ
- ルネサンス・宗教改革・科学革命: グーテンベルク、レオナルド・ダ・ヴィンチ、ミケランジェロ、
  ラファエロ、マルティン・ルター、カルヴァン、コペルニクス、ガリレオ・ガリレイ、ニュートン、
  シェイクスピア
- 音楽: バッハ、モーツァルト、ベートーヴェン
- 近代の科学・技術・探検・政治: ノーベル、レントゲン、アムンゼン、ペリー
- 現代: ジョン・F・ケネディ、ゴルバチョフ、鄧小平
- 王国カードへの紐付け: ローマ共和国（カエサル）、アメリカ合衆国拡張期（ペリー）、
  アメリカ合衆国冷戦期（ケネディ）、ソビエト連邦冷戦期（ゴルバチョフ）。
- リンカーン・ワシントン等は full name（エイブラハム・リンカーン等）で既存のため重複なし。
- 人物カタログ総数: 599 → 623。

### ヨーロッパの主要君主・権力者の人物カードを9名追加

ヨーロッパの国王・権力者が少なかったため、代表的な君主を追加（実在個人・説明50〜150字・
いつどこで何をしたかを明記・既存300名と同じ文体）。

- 追加（基本人物配列）:
  - マクシミリアン1世（大航海 / 神聖ローマ皇帝・結婚政策でハプスブルク家を拡大、カール5世の祖父）
  - オットー1世（交易と王国 / 神聖ローマ帝国を始めた皇帝）
  - フリードリヒ・バルバロッサ（交易と王国 / 神聖ローマ皇帝）
  - エドワード1世（交易と王国 / ウェールズ征服・議会のしくみを整えた王）
  - ヘンリー5世（交易と王国 / 百年戦争・アジャンクール）
  - カール5世（大航海 / スペイン王カルロス1世＝神聖ローマ皇帝）
  - ヘンリー8世（大航海 / イギリス国教会）
  - アンリ4世（大航海 / ナント勅令・ブルボン朝）
  - ルイ14世（大航海 / 絶対王政・太陽王）
  - チャールズ1世（大航海 / ピューリタン革命で処刑）
  - ルイ16世（革命と工場 / フランス革命で処刑）
  - マリー・アントワネット（革命と工場 / ルイ16世の王妃・フランス革命で処刑）
- 「シャルル一世」は同名が複数いて曖昧なため、明確なカール5世（スペイン王カルロス1世）と
  チャールズ1世（イングランド王）の双方を追加してカバー。前ターン追加のカール大帝
  （フランク王シャルル1世）とも重複なし。
- 王国カードへの紐付け: イングランド王国（ヘンリー5世・8世・チャールズ1世）、
  フランス王国（アンリ4世・ルイ14世・16世）、スペイン帝国（カール5世）。

### フランク王国の人物カード（カール大帝・クローヴィス）を追加

フランク王国に関連する人物カードが無く、中世西ヨーロッパ最重要人物のカール大帝も未登録だった
ため追加。

- 基本人物配列に2人を追加（実在個人・説明50〜150字・史実準拠）:
  - カール大帝（かーるたいてい / 交易と王国の時代 / 800年戴冠の皇帝）
  - クローヴィス（くろーびす / 宗教と文化が広がった時代 / フランク王国建国者）
- `kingdomPeople["フランク王国"] = ["カール大帝", "クローヴィス"]` を追加し、王国カードのモーダル
  下部「この勢力に関わった人物」に表示。
- 人物図鑑・時代別の人物一覧にも表示される。

### フランク王国の地域ラベルを「西ヨーロッパ」→「フランス・ドイツ」に修正

フランク王国（481–843）はカール大帝期に現在のフランス・西ドイツ・ベネルクス・北イタリア等に
広がり、843年のヴェルダン条約でフランス・ドイツ・低地地方のもとに分裂した。「フランス」だけでは
ドイツ等が抜け落ち不正確、「西ヨーロッパ」は広いがレーン名と重複し曖昧だったため、両国のもとを
表す「フランス・ドイツ」に変更。

- `kingdomModernRegions["フランク王国"]` を `"西ヨーロッパ"` → `"フランス・ドイツ"` に変更。
- カードの表示名・モーダル・チップ・タイムラインのバー表記がすべて「フランク王国(フランス・ドイツ)」に。
- タイムラインの地域分類（フランス周辺→西ヨーロッパ）は変更なし。

### 地域タイムラインの地域選択を「数」から「影響力」基準に変更

これまで、各時代の地域タイムラインに表示する地域は「勢力の数」が多い順（同数は五十音順）で
選んでいたため、ローカルな勢力が多い地域が、世界へ大きな影響を与えた少数の地域より優先される
問題があった（例: 革命と工場の時代で、アメリカ独立・ハイチ革命のアメリカ大陸より、王国数の多い
アフリカが選ばれる／世界大戦の時代で日本・ソ連が外れる／冷戦の時代でソ連が外れる）。

- `script.js` に `eraRegionPriority`（時代ID → 影響力の大きい地域の順序）を追加。
  政治・経済・軍事・文化・グローバルな波及などの観点から、時代ごとに世界史的影響の大きい地域を
  順に並べたもの。
- `renderRegionalPowerTimeline` の地域並べ替えを変更し、優先順位にある地域を上位に固定。
  優先順位外の地域は従来どおり件数で補い、上位5地域を表示する。
- 主な結果:
  - 革命と工場: イギリス・フランス周辺・アメリカ・南アジア・ロシア周辺
    （当初ハイチを含めたが、世界への影響力基準ではハイチより当時の大国ロシア帝国が
    一貫するため、ユーザー判断でロシア周辺へ差し替え）
  - 世界が深く結びついた: イギリス・ドイツ・アメリカ・日本・ロシア周辺
  - 二つの世界大戦: ドイツ・ロシア周辺・イギリス・フランス周辺・日本
  - 今につながる: アメリカ・ロシア周辺・世界・ヨーロッパ広域・南アジア
  - 交易と王国: 西アジア・中国・フランス周辺・イギリス・地中海・南ヨーロッパ
    （島国イギリスを大陸の仏・独と「西ヨーロッパ」として束ねるのは不適切だったため撤回。
    フランク王国はフランス王国と同じ「フランス周辺」レーン、イングランド等は「イギリス」レーンと
    正しく分離。ビザンツ（地中海・南ヨーロッパ）を加えてヨーロッパ3レーンとし、代わりに南アジアを外す。
    `regionMergeByEra` の仕組みは残置するが現在は未使用（{}）。
    経緯: マリ→中央アジア→西ヨーロッパ束ね→フランス周辺＋イギリス＋ビザンツ）
  - 大航海と出会い: スペイン・ポルトガル・メキシコ・ペルー・中国

### 人物カードの説明文を改訂版（図鑑300人）に差し替え

ユーザーが見直した `people-list` 改訂CSV（図鑑掲載300人の説明文）を反映。

- `script.js` に `personDescriptions`（人物名 → 改訂説明文、300件）を追加。
- 基本人物（28人）は配列の説明文をこのマップで上書き。
- extraグループの人物は、実体化時・カタログ構築時に `personDescriptions[name]` があれば
  それを使い、なければ従来の自動生成文（`〇〇は△△で…`）を使用。
- 図鑑枠外（カタログのみ285人）は対象外で、自動生成文のまま。
- 名前・場所・肩書き・アイコン等は変更なし（説明文のみ差し替え）。

### 王国カードのモーダル改善（ユーザー承認済み）

`styles.css` 変更前のバックアップ: `design-baseline/styles.before-modal-title-globe-people-20260630-001318.css`
（基準版 `design-baseline/styles.baseline.css` はユーザー承認待ちのため未更新）

- **モーダルタイトルのフォント縮小**
  王国カードのモーダルでタイトルが大きすぎたため縮小。
  `#personDetail.kingdom-detail h2` の `font-size` を
  `clamp(1.8rem, 4vw, 2.45rem)` → `clamp(1.35rem, 3vw, 1.8rem)` に変更（`line-height` 1.15 → 1.2）。

- **3D世界地図の表示エリアの高さを約2/3に縮小**
  `.kingdom-map` の `min-height` 300px → 200px、`max-height` `min(50vh, 420px)` → `min(33vh, 280px)`。
  `.kingdom-map canvas` の `height` `min(50vh, 420px)` → `min(33vh, 280px)`、`min-height` 300px → 200px。
  高さを明示するため `aspect-ratio: 3 / 2` は削除（高さが支配し矛盾するため）。

- **ポイント（首都・王がいた場所）を中心に表示**
  グローブは `orientGlobeToPoint` で対象地点を正面に向け、カメラは原点中心を見るため、
  表示エリアの縦横比が変わってもポイントは常に中央に保たれる（リサイズ時に `camera.aspect` を
  `clientWidth/clientHeight` から更新）。`aspect-ratio` 削除後も中央維持を確認済み。

- **各勢力に関わった人物を世界地図の下に表示**
  王国カードのモーダルで、世界地図の下に「この勢力に関わった人物」セクションを追加。
  例: マケドニア王国 → アレクサンドロス大王・アリストテレス。
  - `script.js` に `kingdomPeople`（王国名 → 人物名の配列）を追加（113勢力分）。
  - 人物図鑑は上限300人で打ち切るが、王国カードからはそれ以外の人物も開けるよう、
    全人物（基本＋extraグループ全員、計585名）の名前引きカタログ `personByName` を追加。
  - `openPerson` は `personByName` から解決するよう変更（図鑑外の人物にも対応）。
  - 表示は既存の `.mini-people` / `.mini-person-button` を再利用。

## 2026-06-29

- **地域タイムラインの「オスマン帝国末期」重複を解消**
  `kingdomCardGroups` に2回定義されていた `オスマン帝国末期` を「アジアの近代国家」グループの
  1枚に集約（「第一次世界大戦の勢力」グループ側の重複を削除）。
- **WHO を運動カラーで表示**
  WHO は団体であり勢力ではないため、`getTimelineKind` で `organizationNames` から `movementNames`
  へ移し、地域タイムラインのバーを運動カラー（緑系）に変更。



## 2026-07-17

### 人物データを research_complete_v15 に差し替え

- `C:\Users\tamak\OneDrive\Desktop\people-data_world_history_research_complete_v15.json` を最新版として、`data/people-data.json` と `data/people-data.js` に反映。
- メイン人物データは300人、`description` は0件、モーダル必須項目の欠損は0件。
- 新データに含まれない `genreGroups` と `inlineAliases` は既存の表示・分類互換性のため保持。
- 本文内人物リンクが切れないよう、旧 `peopleByName` の補助索引332件を保持し、全体の索引数は632件を維持。
- 新データで画像未指定だった人物のうち22件は、既存画像指定を引き継ぎ、人物カード画像の欠落増加を防止。
- 補助索引に残っていた弱い定型文3件（メネス、ブルートゥス、マリンチェ）は具体表現へ修正。
- `scripts/verify-static.ps1`、カード件数確認、弱い定型文チェックを通過。

### 専門語ツールチップが短い人物名・カード名で分割される問題を修正

- `ハンムラビ法典` が `ハンムラビ` の人物リンクと `法典` に分かれ、専門語ツールチップとして扱われない問題を修正。
- `enrichDetailLinks()` でツールチップ対象語も長さ優先の候補に含め、リンク対象語より長い専門語を丸ごと保護するよう変更。
- 全テキストを監査し、同じ構造の長い専門語52件・出現284箇所で分割が起きないことを確認。
- `scripts/verify-static.js` に再発防止チェックを追加し、今後のデータ追加でも同種の分割を検出できるようにした。

### モーダル内ツールチップがモーダル下に隠れる問題を修正

- `dialog.showModal()` の最上位レイヤーにより、`body` 直下のツールチップが人物・アクションモーダルの下へ隠れる問題を修正。
- ツールチップの発生元が開いている `dialog` 内にある場合、`.term-tooltip-layer` をその `dialog` 内へ移動するよう変更。
- 通常画面のツールチップは従来どおり `body` 直下に表示。
- `script.js` 構文チェックと `scripts/verify-static.ps1` を通過。

### 子カテゴリー本文データを complete_v1 に差し替え

- `C:\Users\tamak\OneDrive\Desktop\history-content_world_subcategories_complete_v1.json` を最新版として、`data/history-content.json` と `data/history-content.js` に反映。
- 子カテゴリー53件の `summary` / `text` を詳細版に更新。
- 件数は `groups: 10`、`eras: 10`、`subcategories: 53`、`powers: 10` を維持。
- 子カテゴリー画像欠損0件、本文欠損0件、`description` 0件を確認。
- 子カテゴリー53件すべてが対応するアクションカードへ接続できることを確認。
- `scripts/verify-static.ps1` を通過。

### 専門語ツールチップを各テキストエリア内で1回限りに変更

- 大カテゴリー、子カテゴリー、アクションカード、人物カード、勢力カードの本文系テキストで、同じ特殊語・専門語のツールチップを最初の1回だけ表示するよう変更。
- `enrichDetailLinks()` 内で分割処理される本文でも、同じテキストブロック内のツールチップ使用状況を共有するよう修正。
- `.term-tooltip` を太字表示に変更し、ツールチップ対象語が視覚的に分かるようにした。
- 全テキストブロック2143件を監査し、同一専門語が複数回出る89ケースでもツールチップ化は1回のみであることを確認。
- `script.js` 構文チェックと `scripts/verify-static.ps1` を通過。

### 一般語ツールチップを複合専門語単位へ整理

- `農業` と `文明` の単独ツールチップを削除し、読みルビのみ残すよう変更。
- `灌漑農業` と `都市文明` を専門語ツールチップとして追加。
- `農業`、`文明` はアクションカード名としては残るが、意味ツールチップ必須対象から除外。
- `scripts/verify-static.js` に、`農業`、`文明` は単独ツールチップを持たず、`灌漑農業`、`都市文明` はツールチップを持つことを検証するルールを追加。
- `scripts/verify-static.ps1` を通過。

### `文字` の単独ツールチップを `甲骨文字` 単位へ整理

- `文字` の単独ツールチップを削除し、読みルビのみ残すよう変更。
- `甲骨文字` を専門語ツールチップとして追加。
- `文字` はアクションカード名としては残るが、意味ツールチップ必須対象から除外。
- `scripts/verify-static.js` に、`文字` は単独ツールチップを持たず、`甲骨文字` はツールチップを持つことを検証するルールを追加。
- `scripts/verify-static.ps1` を通過。

### 漢字複合語が短い基本語ツールチップで分割される問題を全体修正

- 短い漢字ツールチップが長い漢字複合語の一部だけに付くケースを全データで監査。
- `仏教` は小学校でも扱う基本語として単独ツールチップを削除し、読みルビのみ維持。
- `仏教思想`、`仏教文化`、`日本仏教`、`大乗仏教`、`チベット仏教` を専門語単位で追加。
- `冷戦期`、`冷戦終結`、`冷戦下`、`冷戦時代`、`アメリカ合衆国冷戦期`、`ソビエト連邦冷戦期` を専門語単位で追加。
- `連合国軍`、`連合国側`、`連合国第二次大戦` を専門語単位で追加。
- 前後が漢字でつながる短い漢字ツールチップの分割候補は0件。
- `scripts/verify-static.ps1` を通過。

### 子カテゴリー本文のロールバックを検出し complete_v1 を再反映

- `data/history-content.json` / `.js` が短い旧本文へ戻っていたため、現行状態を退避。
- `C:\Users\tamak\OneDrive\Desktop\history-content_world_subcategories_complete_v1.json` を再反映。
- 再反映後、現行 `history-content.json` は入力元 complete_v1 と完全一致。
- `history-content.js` との同期も確認。
- `scripts/verify-static.ps1` を通過。

### 短い漢字ツールチップ分割の再発防止監査を追加

- 最新データ全体を監査し、`冷戦勢力` の中で `冷戦` が部分ツールチップ化される候補を検出。
- `冷戦勢力` を専門語単位のツールチップとして追加。
- `scripts/verify-static.js` に、短い漢字ツールチップが前後の漢字とつながって長い複合語を分割していないかを検査するルールを追加。
- 最終監査で短い漢字ツールチップの分割候補は0件。
- `scripts/verify-static.ps1` を通過。

## 2026-07-18

- 専門語ツールチップを厳格化し、`ミュール紡績機`、`水力紡績機`、`コモン・センス`、`封建的特権` などを追加しました。
- `文明化` 内の `文明`、`元奴隷` 内の `元` など、短い語が複合語へ食い込んでリンク・ルビ化される問題を修正しました。
- `鉄道`、`戦争`、`政治`、`文化`、`世界`、`王国` など小学生が読める短い普通語の単独ルビを削除し、再発防止チェックを `scripts/verify-static.js` に追加しました。
- 検証: `scripts/verify-static.ps1` が `Static verification passed: 515 learning terms` で通過。

## 2026-07-18

- 説明本文全体を5観点で専門語監査し、科学技術、政治制度、戦争・国際関係、宗教・思想・文化、植民地支配・社会運動・経済の専門語ツールチップを追加しました。
- `エックス線`、`X線`、`DNA`、`宥和政策`、`安全保障理事会`、`世界人権宣言`、`サンフランシスコ会議`、`ローマ法大全`、`ニューディール政策` などをツールチップ対象にしました。
- 短い普通語へのルビは戻さず、追加専門語は原則ツールチップ専用に統一しました。
- 複合語分割を防ぐため、`非同盟外交`、`初代教皇`、`共和政末期`、`原子爆弾`、`身分制度` など長い語も登録しました。
- 検証: `scripts/verify-static.ps1` が `Static verification passed: 755 learning terms` で通過。

## 2026-07-18

- 子カテゴリー本文が短い旧データへロールバックしていたため、最新の `history-content_world_subcategories_complete_v1.json` から `data/history-content.json` / `.js` を復元しました。
- 原因対策として、画像作業ページ保存サーバーに `history-content` の本文量・カナリー文言チェックを追加し、短い旧本文の保存およびバックアップ復元を拒否するようにしました。
- `scripts/verify-static.js` に同じロールバック検知を追加し、子カテゴリー本文合計15000字未満、最短本文250字未満、先頭カナリー不一致を検証失敗にしました。
- `AGENTS.md` に最重要データ保護ルールとして、子カテゴリー本文の意図しない短文化・旧版復帰禁止を追記しました。
- 検証: `scripts/verify-static.ps1` が `Static verification passed: 755 learning terms` で通過。

## 2026-07-18

- 勢力カード「金」と、航海・交易文脈の資源「金」を混同しないように、本文リンクの文脈判定を追加しました。
- `香辛料、金、陶磁器` や `金・象牙・奴隷` のような交易品の金は勢力カードへリンクせず、`金王朝`、`宋と金`、`北方の金` など王朝文脈だけを勢力リンク対象にしました。
- 検証: `script.js` / `scripts/verify-static.js` の構文確認、および `scripts/verify-static.ps1` が `Static verification passed: 755 learning terms` で通過。

## 2026-07-18

- 直近修正反映監査を実施し、人物データ300人のモーダル本文900項目が最新版v15ではなく汎用文へ戻っていた問題を検出しました。
- `people-data_world_history_research_complete_v15.json` を再反映し、人物の名前・かな・タイトル・ジャンル・モーダル本文がv15と差分0件で一致する状態に戻しました。画像指定はv15側に無い場合のみ既存指定を維持しています。
- 子カテゴリー本文が再び短い旧版へ戻っていたため、`history-content_world_subcategories_complete_v1.json` から再復元しました。
- 旧データを再保存する可能性があった起動中の画像作業サーバーを停止し、裏からの再ロールバック経路を止めました。
- v15人物本文で短い専門語が長い語を分割する候補を48件抽出し、`女性参政権`、`第三回十字軍`、`冷戦秩序`、`連合国遠征軍最高司令官` などを長い専門語単位のツールチップとして追加しました。
- 最終検証: `scripts/verify-static.ps1` が `Static verification passed: 803 learning terms` で通過。`recent-fixes-reflection-audit-final-20260718.json` も失敗0件。

## 2026-07-18

- `文明化` の中の `文明` がアクションカードへリンクされていた問題を修正しました。
- アクションカード名が漢字だけで構成されている場合、前後に漢字が続く語の内部では本文リンクを付けないようにしました。
- `文明は...` のような単独語は従来どおりリンク可能です。
- `script.js` の読み込みバージョンを `20260718-compound-action-link-guard` に更新し、ブラウザキャッシュで旧挙動が残らないようにしました。
- 検証: `scripts/verify-static.ps1` が `Static verification passed: 803 learning terms` で通過。

## 2026-07-18

- 小学生でも理解できる単独普通語の `王(おう)` ルビを削除しました。
- 同じ基準で、勢力名ではない単独普通語 `村`、`道`、`核`、`港`、`海`、`銀` のルビ登録も削除しました。
- `金` は中国史の勢力名としてのみ `kingdom` scope で保持し、交易品・普通語としての金には広げない方針を維持しました。
- `learning-terms.js` の読み込みバージョンを `20260718-remove-basic-single-kanji-ruby` に更新しました。
- 検証: `scripts/verify-static.ps1` が `Static verification passed: 796 learning terms` で通過。

## 2026-07-18

- `王(おう)` と同種の普通語ルビが残っていないか、`learning-terms` 全体を厳正監査しました。
- 追加で `進出期`、`文化交流`、`国際協力`、`地球規模`、`制度改革` の単独ルビ管理を削除しました。
- `列強`、`先住民`、`戦間期`、`港市`、`民族移動`、`市民政治`、`不平等条約`、`北大西洋条約機構`、`雑穀`、`牧畜`、`諸侯`、`抵抗勢力`、`律令`、`拮抗`、`均衡`、`航路開拓`、`香辛料`、`十六大国` はルビを外し、意味説明が必要な語としてツールチップ専用にしました。
- `先住民勢力`、`香辛料貿易`、`勢力均衡` など、短いツールチップ語が複合語を分割しないよう長い語単位のツールチップを追加しました。
- 残る1文字ルビは `秦`、`金`、`宋`、`元`、`蜀`、`呉` など中国史の勢力名・特殊名だけであることを確認しました。
- `learning-terms.js` の読み込みバージョンを `20260718-strict-basic-ruby-audit` に更新しました。
- 検証: `scripts/verify-static.ps1` が `Static verification passed: 809 learning terms` で通過。

## 2026-07-18

- `仰韶文化`、`河姆渡文化` などの難読文化名に whole-term ルビを追加しました。
- 追加対象: `仰韶文化`、`河姆渡文化`、`龍山文化`、`良渚文化`、`紅山文化`、`三星堆文化`、`馬家窯文化`、`大汶口文化`、`二里頭文化`、`裴李崗文化`、`老官台文化`、`興隆窪文化`、`石家河文化`。
- 普通語ルビ削除ルールとは別に、難読固有名・文化名はルビを保持する検証ルールを追加しました。
- `learning-terms.js` の読み込みバージョンを `20260718-difficult-culture-ruby` に更新しました。
- 検証: `scripts/verify-static.ps1` が `Static verification passed: 816 learning terms` で通過。

## 2026-07-18

- `瑜伽行派・唯識思想` に whole-term ルビ `ゆがぎょうは・ゆいしきしそう` を追加しました。
- 中黒 `・` を含む難読専門語がカタカナ語扱いで検証に弾かれないよう、検証ルールを調整しました。
- `learning-terms.js` の読み込みバージョンを `20260718-yugagyoha-yuishiki-ruby` に更新しました。
- 検証: `scripts/verify-static.ps1` が `Static verification passed: 816 learning terms` で通過。

## 2026-07-18

- `科挙` に whole-term ルビ `かきょ` を追加しました。
- 複合語分割を避けるため、`科挙官僚` は `かきょかんりょう`、`科挙文体` は `かきょぶんたい` の whole-term ルビにしました。
- 難読専門語として検証上もルビ保持対象へ追加しました。
- `learning-terms.js` の読み込みバージョンを `20260718-kakyo-ruby` に更新しました。
- 検証: `scripts/verify-static.ps1` が `Static verification passed: 816 learning terms` で通過。

## 2026-07-18

- `法華経` に whole-term ルビ `ほけきょう` を追加しました。
- `阿弥陀経` に whole-term ルビ `あみだきょう` とツールチップを追加しました。
- `中論` に whole-term ルビ `ちゅうろん` とツールチップを追加しました。
- 難読専門語として検証上もルビ保持対象へ追加しました。
- `learning-terms.js` の読み込みバージョンを `20260718-buddhist-text-ruby` に更新しました。
- 検証: `scripts/verify-static.ps1` が `Static verification passed: 818 learning terms` で通過。

## 2026-07-18

- `廬山` に whole-term ルビ `ろざん` とツールチップを追加しました。
- `唯識思想` に whole-term ルビ `ゆいしきしそう` とツールチップを追加しました。
- 難読専門語として検証上もルビ保持対象へ追加しました。
- `learning-terms.js` の読み込みバージョンを `20260718-rozan-yuishiki-ruby` に更新しました。
- 検証: `scripts/verify-static.ps1` が `Static verification passed: 820 learning terms` で通過。


