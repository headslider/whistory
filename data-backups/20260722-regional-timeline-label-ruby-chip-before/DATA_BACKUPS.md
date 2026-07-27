# データバックアップ記録

このファイルは「スクロールでわかる 世界のれきし」のデータバックアップを記録する。作業者は、`data/*.json`、`data/*.js`、またはデータ正規化に関わる `script.js` を変更する前後に、必要に応じて `data-backups/` へ退避し、このファイルへ追記する。

## 対象データ

- `data/history-content.json`: 大カテゴリー、時代カード、子カテゴリー本文の正本。
- `data/history-content.js`: `file://` とJSON取得失敗時の階層データフォールバック。
- `data/people-data.json`: 人物カードと全人物名引きの正本。
- `data/action-cards.json`: アクションカードの正本。
- `data/modal-data.json`: 王国・勢力・その他モーダルの正本。
- `data/people-data.js`: `file://` とJSON取得失敗時の人物データフォールバック。
- `data/action-cards.js`: `file://` とJSON取得失敗時のアクションデータフォールバック。
- `data/modal-data.js`: `file://` とJSON取得失敗時の王国・勢力データフォールバック。
- `data/learning-terms.json`: ルビ対象語の正本。
- `data/learning-terms.js`: `file://` とJSON取得失敗時のルビ対象語フォールバック。

## 復元時の注意

- JSONとJSフォールバックは同じ内容を持つため、片方だけを戻さない。
- `history-content` 系を戻した場合は、`data/history-content.json` と `data/history-content.js` の両方を戻す。
- `people-data` 系を戻した場合は、`data/people-data.json` と `data/people-data.js` の両方を戻す。
- `action-cards` 系を戻した場合は、`data/action-cards.json` と `data/action-cards.js` の両方を戻す。
- `modal-data` 系を戻した場合は、`data/modal-data.json` と `data/modal-data.js` の両方を戻す。
- `learning-terms` 系を戻した場合は、`data/learning-terms.json` と `data/learning-terms.js` の両方を戻す。
- 復元後は [VERIFICATION_GUIDE.md](C:/Users/tamak/Documents/world_history/VERIFICATION_GUIDE.md) の順序で、構文チェック、件数確認、ブラウザ確認を行う。

## バックアップ一覧### 2026-07-19 00:17

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260719-001741-ascii-image-paths-before`

保存内容:

- `data/history-content.json`
- `data/history-content.js`
- `data/people-data.json`
- `data/people-data.js`
- `data/action-cards.json`
- `data/action-cards.js`
- `data/modal-data.json`
- `data/modal-data.js`
- `data/learning-terms.json`
- `data/learning-terms.js`
- `data/timeline-region-data.json`
- `data/timeline-region-data.js`
- `scripts/image-workbench-server.js`
- `image-workbench.js`
- `scripts/verify-static.js`

目的:

- 公開サーバーで画像URLが壊れないよう、データ内の画像参照をASCIIファイル名へ統一する前の状態を退避。
- 復元時は、`data/*.json` と `data/*.js` の同期、画像参照の存在、`history-content` の詳細本文保護条件を必ず確認する。

### 2026-07-18 10:15

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260718-shunju-sengoku-term`

保存内容:

- `data/learning-terms.json`
- `data/learning-terms.js`
- `scripts/verify-static.js`
- `index.html`

目的:

- 「春秋・戦国時代」を長い正式語として追加し、「戦国時代」だけが部分リンクされる問題を修正する前の状態を退避。
- 復元時は `learning-terms.json` と `learning-terms.js` を必ず同時に戻し、検証条件とキャッシュ更新も合わせて確認する。

### 2026-07-10 00:00

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260710-remove-description`

保存内容:

- `history-content.json`
- `history-content.js`

目的:

- `history-content` 系データからトップ階層の `description` 項目を廃止する前の状態を退避。
- 復元時は `history-content.json` と `history-content.js` を必ず同時に戻す。

### 2026-07-02 17:08

保存先:

`C:\Users\tamak\Documents\world_history\data-backups\20260702-170838-history-modal-data`

保存内容:

- `history-content.json`
- `history-content.js`
- `modal-data.json`
- `modal-data.js`

目的:

- 現行の階層データとモーダルデータを、次作業前に退避。
- 元ファイルとのSHA256照合で4ファイルすべて一致を確認。

### 2026-07-02 01:48

保存先:

`C:\Users\tamak\Documents\world_history\data-backups\20260702-014813-history-modal-data`

保存内容:

- `history-content.json`
- `history-content.js`
- `modal-data.json`
- `modal-data.js`

目的:

- 大カテゴリー、時代カード、子カテゴリーのJSON分離後の安定状態を退避。
- 人物、アクション、王国・勢力・その他モーダルデータの現行安定状態を退避。



### 2026-07-17 13:56

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-special-term-tooltips`

保存内容:

- `learning-terms.before.json`
- `learning-terms.before.js`
- `verify-static.before.js`
- `VERIFICATION_GUIDE.before.md`

目的:

- 人物・アクション説明文内の特殊語・専門語128件を、意味説明ツールチップとして `data/learning-terms.json` / `.js` に追加する前の状態を退避。
- 検証ルールを「アクションカード名のみ」から「アクションカード名と本文内専門語」へ広げる前の状態を退避。
- 復元時は `data/learning-terms.json` と `data/learning-terms.js` を必ず同時に戻し、必要に応じて `scripts/verify-static.js` と `VERIFICATION_GUIDE.md` も戻す。

### 2026-07-17 14:10

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-person-name-ruby-kanji`

保存内容:

- `learning-terms.before.json`
- `learning-terms.before.js`
- `script.before.js`
- `verify-static.before.js`

目的:

- 人物名の純漢字名・難読称号ルビを `data/learning-terms.json` / `.js` に追加する前の状態を退避。
- カタカナ混じり人物名で漢字称号だけを部分ルビ表示できるよう、`script.js` の人物名表示補助を追加する前の状態を退避。
- 復元時は `data/learning-terms.json`、`data/learning-terms.js`、`script.js` を同時に戻す。

### 2026-07-17 14:30

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-disable-subcategory-heading-tooltips`

保存内容:

- `script.before.js`

目的:

- 子カテゴリー見出し、地域ラベル、子カテゴリータイトル、サブタイトルでツールチップを出さない表示仕様へ変更する前の `script.js` を退避。
- 復元時は `script.js` を戻し、`scripts/verify-static.ps1` を実行する。

### 2026-07-17 16:40

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-replace-people-data-research-complete-v15`

保存内容:

- `people-data.before.json`
- `people-data.before.js`
- `people-data_world_history_research_complete_v15.source.json`

目的:

- `C:\Users\tamak\OneDrive\Desktop\people-data_world_history_research_complete_v15.json` を最新版人物データとして反映する前の状態を退避。
- `data/people-data.json` と `data/people-data.js` は必ず同時に戻す。
- 新データに含まれない `genreGroups`、`inlineAliases`、本文リンク用の補助 `peopleByName` 索引は表示互換性のため現行データから保持。
- 新データで画像未指定だった人物のうち、現行データに画像指定があるものは表示後退防止のため保持。

### 2026-07-17 17:05

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-protect-tooltip-terms-from-inline-links`

保存内容:

- `script.before.js`
- `verify-static.before.js`
- `VERIFICATION_GUIDE.before.md`

目的:

- `ハンムラビ法典` のような長い専門語が、内部に含まれる短い人物名・カード名で分割される問題を修正する前の状態を退避。
- 本文リンク処理でツールチップ対象語も長さ優先の候補に含め、専門語を丸ごと保護する。
- 復元時は `script.js` を戻し、必要に応じて `scripts/verify-static.js` と `VERIFICATION_GUIDE.md` も戻す。

### 2026-07-17 17:20

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-tooltip-layer-inside-dialog`

保存内容:

- `script.before.js`

目的:

- 人物・アクションモーダル内の専門語ツールチップが、モーダルの下側レイヤーに隠れる問題を修正する前の状態を退避。
- ツールチップ発生元が `dialog[open]` 内にある場合は、ツールチップレイヤーをそのモーダル内へ移動し、通常画面では従来どおり `body` 直下に表示する。
- 復元時は `script.js` を戻し、`scripts/verify-static.ps1` を実行する。

### 2026-07-17 22:45

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-replace-history-subcategories-complete-v1`

保存内容:

- `history-content.before.json`
- `history-content.before.js`
- `history-content_world_subcategories_complete_v1.source.json`

目的:

- `C:\Users\tamak\OneDrive\Desktop\history-content_world_subcategories_complete_v1.json` を子カテゴリー最新データとして反映する前の状態を退避。
- 復元時は `data/history-content.json` と `data/history-content.js` を必ず同時に戻す。
- 差し替え後は `groups: 10`、`eras: 10`、`subcategories: 53`、`powers: 10` を確認済み。

### 2026-07-17 23:05

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-tooltip-once-per-text-area`

保存内容:

- `script.before.js`

関連デザインバックアップ:

`\\LS720DD35\Family\永人\世界の歴史\design-baseline\restore-backups\20260717-tooltip-once-per-text-area\styles.before.css`

目的:

- 大カテゴリー、子カテゴリー、アクションカード、人物カード、勢力カードの各テキストエリアで、特殊語・専門語ツールチップを同一語につき最初の1回だけ表示し、ツールチップ対象語を太字にする前の状態を退避。
- 復元時は `script.js` と必要に応じて `styles.css` を同時に戻し、`scripts/verify-static.ps1` を実行する。

### 2026-07-17 23:20

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-refine-generic-term-tooltips`

保存内容:

- `learning-terms.before.json`
- `learning-terms.before.js`
- `verify-static.before.js`

目的:

- `農業`、`文明` のような一般語が複合語内で部分的にツールチップ化される問題を修正する前の状態を退避。
- `農業` と `文明` は読みルビを残し、単独ツールチップを削除。
- `灌漑農業` と `都市文明` は専門語単位のツールチップとして追加。
- 検証ルールも `農業`、`文明` はアクションカード名であっても単独ツールチップ必須対象から除外。

### 2026-07-17 23:30

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-refine-kokotsu-moji-tooltip`

保存内容:

- `learning-terms.before.json`
- `learning-terms.before.js`
- `verify-static.before.js`

目的:

- `文字` の単独ツールチップを外し、`甲骨文字` を専門語単位のツールチップとして追加する前の状態を退避。
- `文字` は読みルビを残し、単独ツールチップを削除。
- `甲骨文字` は読みルビと意味説明ツールチップを追加。
- 検証ルールも `文字` はアクションカード名であっても単独ツールチップ必須対象から除外。

### 2026-07-17 23:45

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-refine-kanji-compound-tooltips`

保存内容:

- `learning-terms.before.json`
- `learning-terms.before.js`
- `verify-static.before.js`

目的:

- 漢字で構成された複合語が、短い基本語ツールチップで分割表示される問題を全体監査・修正する前の状態を退避。
- `仏教` は読みルビを残し、単独ツールチップを削除。
- `仏教思想`、`仏教文化`、`日本仏教`、`大乗仏教`、`チベット仏教`、`冷戦期`、`冷戦終結`、`冷戦下`、`冷戦時代`、`連合国軍`、`連合国側`、`連合国第二次大戦`、`アメリカ合衆国冷戦期`、`ソビエト連邦冷戦期` を専門語単位のツールチップとして追加。
- 前後が漢字でつながる短い漢字ツールチップの分割候補が0件であることを確認。

### 2026-07-17 23:55

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260717-restore-history-subcategories-after-rollback`

保存内容:

- `history-content.rolled-back.json`
- `history-content.rolled-back.js`
- `history-content_world_subcategories_complete_v1.source.json`

目的:

- 子カテゴリー本文が短い旧版へ戻っていた状態を退避し、`history-content_world_subcategories_complete_v1.json` を再反映するため。
- 再反映後、`data/history-content.json` はデスクトップの最新版ソースと完全一致し、`data/history-content.js` とも同期していることを確認。

### 2026-07-18 00:05

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260718-add-cold-war-power-tooltip-audit`

保存内容:

- `learning-terms.before.json`
- `learning-terms.before.js`
- `verify-static.before.js`

目的:

- 最新指示の全体監査で残っていた `冷戦勢力` の分割候補を修正する前の状態を退避。
- `冷戦勢力` を専門語単位のツールチップとして追加。
- 短い漢字ツールチップが長い漢字複合語の一部だけに付く候補を `scripts/verify-static.js` で検出する再発防止チェックを追加。

## 2026-07-18 - 専門語ツールチップ追加と短い普通語ルビ削除

- 保存先: `data-backups/20260718-add-specialized-term-tooltips-strict-audit/`
  - `learning-terms.before.json` / `learning-terms.before.js` / `verify-static.before.js`
  - ミュール紡績機、水力紡績機、コモン・センス、封建的特権などの専門語ツールチップ追加前の状態。
- 保存先: `data-backups/20260718-fix-short-inline-compound-ruby/`
  - `script.before.js` / `learning-terms.before.json` / `learning-terms.before.js`
  - 文明化、元奴隷などで短い語が複合語に食い込む問題の修正前状態。
- 保存先: `data-backups/20260718-remove-common-short-ruby-terms/`
  - `learning-terms.before.json` / `learning-terms.before.js` / `verify-static.before.js`
  - 鉄道、戦争、政治、文化、世界、王国など短い普通語ルビの削除前状態。
- 復元時の注意: `data/learning-terms.json` を戻す場合は、同内容で `data/learning-terms.js` も再生成すること。短い普通語を戻すと、`文明化` や `元奴隷` のような語が分割表示される可能性がある。

## 2026-07-18 - 5周専門語監査とツールチップ追加

- 保存先: `data-backups/20260718-five-pass-specialized-term-audit/`
  - `learning-terms.before.json` / `learning-terms.before.js` / `verify-static.before.js`
  - 5観点監査による専門語ツールチップ追加前の状態。
- 監査記録:
  - `audits/specialized-terms-01_science_technology.json`
  - `audits/specialized-terms-02_political_systems_revolutions.json`
  - `audits/specialized-terms-03_war_international_relations.json`
  - `audits/specialized-terms-04_religion_thought_culture.json`
  - `audits/specialized-terms-05_colonial_society_economy.json`
  - `audits/specialized-terms-five-pass-finalcheck-20260718.json`
  - `audits/specialized-terms-broad-added-20260718.json`
  - `audits/specialized-terms-final-broad-added-20260718.json`
- 復元時の注意: `data/learning-terms.json` を戻す場合は、同内容で `data/learning-terms.js` を再生成すること。`scripts/verify-static.js` の専門語必須チェックも同時に戻すこと。

## 2026-07-18 - history-content 最新本文復元とロールバック防止ガード

- 保存先: `data-backups/20260718-restore-latest-history-content-and-rollback-guard/`
  - `history-content.before.json` / `history-content.before.js`: 短い旧本文へロールバックしていた状態。
  - `image-workbench-server.before.js` / `verify-static.before.js` / `AGENTS.before.md`: ロールバック防止ガード追加前の状態。
- 復元元: `C:/Users/tamak/OneDrive/Desktop/history-content_world_subcategories_complete_v1.json`
- 復元後条件: 子カテゴリー53件、本文合計17035字、最短本文283字、先頭本文に「肥沃な三日月地帯」「チャタル・ヒュユク」を含む。
- 復元時の注意: 画像作業ページやバックアップ復元で `history-content` を戻す場合、短い旧本文を含むデータは保存・復元してはいけない。

## 2026-07-18 - 金王朝リンクと交易品の金の誤リンク防止

- 保存先: `data-backups/20260718-fix-jin-dynasty-vs-gold-link/`
  - `script.before.js` / `verify-static.before.js`
  - 勢力カードの「金」と、交易品・資源としての「金」が同じ1文字で誤ってリンクされる問題の修正前状態。
- 復元時の注意: `script.js` を戻す場合は、交易品の「金、香辛料、陶磁器」などが勢力カード「金」へリンクされないことを必ず確認すること。

## 2026-07-18 - 直近修正反映監査による人物v15再復元・子カテゴリー再復元・複合専門語追加

- 保存先: `data-backups/20260718-restore-people-v15-after-rollback-audit/`
  - `people-data.before.json` / `people-data.before.js`: v15の300人本文ではなく、汎用化された人物モーダル本文へ戻っていた状態。
  - `people-data_world_history_research_complete_v15.source.json`: 復元元の最新版人物データ。
- 保存先: `data-backups/20260718-restore-history-after-second-rollback-audit/`
  - `history-content.rolled-back.json` / `history-content.rolled-back.js`: 再び短い旧子カテゴリー本文へ戻っていた状態。
- 保存先: `data-backups/20260718-add-people-v15-compound-tooltips/`
  - `learning-terms.before.json` / `learning-terms.before.js` / `verify-static.before.js`: v15人物本文に必要な複合専門語48件追加前の状態。
- 監査記録:
  - `audits/people-v15-core-diff-20260718.json`: 復元前、人物モーダル本文900項目がv15と不一致。
  - `audits/people-v15-core-diff-after-restore-20260718.json`: 復元後、v15本文差分0件。
  - `audits/people-v15-split-compound-candidates-20260718.json`: v15本文で必要になった複合専門語候補48件。
  - `audits/recent-fixes-reflection-audit-final-20260718.json`: 最終反映監査、失敗0件。
- 復元時の注意: 人物データを戻す場合は、`people-data_world_history_research_complete_v15` の本文と一致すること、子カテゴリー本文は `history-content_world_subcategories_complete_v1` と一致することを必ず確認すること。

## 2026-07-18 - 文明化など漢字複合語内のアクションカード誤リンク防止

- 保存先: `data-backups/20260718-fix-action-link-inside-compound/`
  - `script.before.js` / `verify-static.before.js` / `index.before.html`
  - `文明化` の中の `文明` がアクションカードへリンクされていた状態。
- 復元時の注意: `script.js` を戻す場合は、`文明化`、`都市文明`、`仏教文化` のような漢字複合語内部で短いアクションカード名がリンクされないことを必ず確認すること。

## 2026-07-18 - 小学生漢字の単独普通語ルビ削除

- 保存先: `data-backups/20260718-remove-basic-word-ou-ruby/`
  - `learning-terms.before.json` / `learning-terms.before.js` / `verify-static.before.js` / `index.before.html`
  - 単独普通語 `王`、および `村`、`道`、`核`、`港`、`海`、`銀` のルビ削除前状態。
- 監査記録:
  - `audits/removed-basic-single-kanji-ruby-20260718.json`
- 復元時の注意: `金` は中国史の勢力名として `kingdom` scope のみ保持する。交易品・普通語としての金へルビやリンクを広げないこと。

## 2026-07-18 - 普通語ルビの厳正監査と追加整理

- 保存先: `data-backups/20260718-audit-remove-elementary-common-ruby/`
  - `learning-terms.before.json` / `learning-terms.before.js` / `verify-static.before.js`
  - 教育漢字のみで構成される普通語・一般複合語ルビの追加監査前状態。
- 監査記録:
  - `audits/basic-ruby-candidates-20260718.json`
  - `audits/elementary-common-ruby-candidates-20260718.json`
  - `audits/removed-elementary-common-ruby-20260718.json`
  - `audits/elementary-tooltip-compound-candidates-20260718.json`
  - `audits/added-elementary-compound-tooltips-20260718.json`
  - `audits/ruby-only-study-classification-20260718.json`
  - `audits/ruby-only-study-cleanup-20260718.json`
  - `audits/ruby-cleanup-compound-candidates-2-20260718.json`
  - `audits/added-ruby-cleanup-compounds-2-20260718.json`
  - `audits/strict-ruby-final-audit-20260718.json`
- 復元時の注意: `王`、`村`、`道`、`核`、`港`、`海`、`銀`、`進出期`、`文化交流`、`国際協力`、`地球規模`、`制度改革` は単独ルビ・単独ツールチップ管理へ戻さないこと。`金`、`秦`、`宋` などは中国史の勢力名としてのみ保持する。

## 2026-07-18 - 難読文化名ルビ復元

- 保存先: `data-backups/20260718-restore-difficult-culture-ruby/`
  - `learning-terms.before.json` / `learning-terms.before.js` / `verify-static.before.js`
  - `仰韶文化`、`河姆渡文化` などがツールチップのみでルビを持たなかった状態。
- 監査記録:
  - `audits/restored-difficult-culture-ruby-20260718.json`
  - `audits/difficult-culture-ruby-final-20260718.json`
- 復元時の注意: 小学生漢字の普通語ルビ削除と、難読固有名・文化名のルビ付与は別基準。`仰韶文化`、`河姆渡文化` などの難読文化名は whole-term ルビを保持すること。

## 2026-07-18 - 瑜伽行派・唯識思想ルビ追加

- 保存先: `data-backups/20260718-add-yugagyoha-yuishiki-ruby/`
  - `learning-terms.before.json` / `learning-terms.before.js` / `verify-static.before.js`
  - `瑜伽行派・唯識思想` がツールチップのみでルビを持たなかった状態。
- 監査記録:
  - `audits/added-yugagyoha-yuishiki-ruby-20260718.json`
  - `audits/yugagyoha-yuishiki-ruby-final-20260718.json`
- 復元時の注意: `瑜伽行派・唯識思想` は中黒を含むがカタカナ語ではなく、難読専門語として whole-term ルビを保持すること。

## 2026-07-18 - 科挙ルビ追加

- 保存先: `data-backups/20260718-add-kakyo-ruby/`
  - `learning-terms.before.json` / `learning-terms.before.js` / `verify-static.before.js`
  - `科挙` がツールチップのみでルビを持たなかった状態。
- 監査記録:
  - `audits/added-kakyo-ruby-20260718.json`
  - `audits/kakyo-ruby-final-20260718.json`
- 復元時の注意: `科挙`、`科挙官僚`、`科挙文体` は難読専門語として whole-term ルビを保持すること。

## 2026-07-18 - 仏教経典・論書名ルビ追加

- 保存先: `data-backups/20260718-add-buddhist-text-ruby/`
  - `learning-terms.before.json` / `learning-terms.before.js` / `verify-static.before.js`
  - `法華経` がツールチップのみ、`阿弥陀経` と `中論` が未登録だった状態。
- 監査記録:
  - `audits/added-buddhist-text-ruby-20260718.json`
  - `audits/buddhist-text-ruby-final-20260718.json`
- 復元時の注意: `法華経`、`阿弥陀経`、`中論` は難読の仏教経典・論書名として whole-term ルビを保持すること。

## 2026-07-18 - 廬山・唯識思想ルビ追加

- 保存先: `data-backups/20260718-add-rozan-yuishiki-ruby/`
  - `learning-terms.before.json` / `learning-terms.before.js` / `verify-static.before.js`
  - `廬山` と `唯識思想` が未登録だった状態。
- 監査記録:
  - `audits/added-rozan-yuishiki-ruby-20260718.json`
  - `audits/rozan-yuishiki-ruby-final-20260718.json`
- 復元時の注意: `廬山`、`唯識思想` は難読固有名・専門語として whole-term ルビを保持すること。



## 2026-07-18 - メルッハ ツールチップ追加

- 保存先: `data-backups/add-meluhha-tooltip-20260718-202500/`
  - `learning-terms.json` / `learning-terms.js`
  - `メルッハ` が未登録だった状態。
- 監査記録:
  - `audits/added-meluhha-tooltip-20260718.json`
- 復元時の注意: `メルッハ` はカタカナ語のためルビを付けない。本文中で意味説明ツールチップだけを表示すること。


## 20260719-030542 person image assign before
- 保存先: data-backups/20260719-030542-person-image-assign-before/
- 内容: people-data.json / people-data.js 画像割り当て前バックアップ。
- 注意: history-content は変更していない。


## 20260719-042430 confirm folder person images before
- 保存先: data-backups/20260719-042430-confirm-folder-person-images-before/
- 内容: 世界史確認用フォルダ画像を人物データへ割り当てる前の people-data.json / people-data.js。
- 注意: history-content は変更していない。



## 20260720-185344 confirmed unmatched person images before
- 保存先: data-backups/20260720-185344-assign-confirmed-unmatched-person-images-before/
- 内容: 確認用フォルダで完全一致した未保存扱い画像16件を人物データへ割り当てる前の people-data.json / people-data.js。
- 注意: history-content は変更していない。完全一致しない6件は推測割り当てしていない。


## 20260720-195916 dedupe people assets before
- 保存先: data-backups/20260720-195916-dedupe-people-assets-before/
- 内容: assets/people の重複画像整理前の people-data.json / people-data.js、および削除対象画像の退避コピー。
- 注意: history-content は変更していない。削除対象画像は removed-assets に退避している。


## 20260720-203826 replace Hammurabi image before
- 保存先: data-backups/20260720-203826-replace-hammurabi-image-before/
- 内容: ハンムラビ画像を候補元画像へ差し替える前の people-data.json / people-data.js。
- 注意: history-content は変更していない。同一画像パス共有がないことを検証する。


## 20260720-204947 clear Gilles missing image before
- 保存先: data-backups/20260720-204947-clear-gilles-missing-image-before/
- 内容: 削除済み不適切画像を参照していたジル・ド・レエを画像未設定に戻す前の people-data.json / people-data.js。
- 注意: history-content は変更していない。同じ画像を別人物へ流用しない。


## 20260720-205342 fix Jeanne Gilles image swap before
- 保存先: data-backups/20260720-205342-fix-jeanne-gilles-image-swap-before/
- 内容: ジャンヌ・ダルクとジル・ド・レエの人物画像参照を正しいWebPへ修正する前の people-data.json / people-data.js。
- 注意: history-content は変更していない。同じ画像を複数人物で共有しないことを検証する。

## 20260722-113524-mobile-ui-tooltip-before mobile UI and tooltip before
- 保存先: data-backups/20260722-113524-mobile-ui-tooltip-before/
- 内容: スマホUI、子カテゴリー開閉、モーダル、ツールチップ操作を日本史準拠へ寄せる前の styles.css / script.js / VERIFICATION_GUIDE.md / ARCHITECTURE_MAP.md。
- 注意: history-content は変更していない。復元時も子カテゴリー53件、本文合計15000字以上、最短本文250字以上、先頭本文の「肥沃な三日月地帯」「チャタル・ヒュユク」を必ず確認する。

## 20260722-120625-fix-learning-term-ruby-scope-before fix learning term ruby scope before
- 保存先: data-backups/20260722-120625-fix-learning-term-ruby-scope-before/
- 内容: learning-terms の個別 uby 指定が scopes: [] の場合にルビ辞書へ読み込まれない問題を修正する前の script.js / DATA_BACKUPS.md。
- 注意: data/history-content.* と data/learning-terms.* は変更していない。scopes: [] の専門語は、個別 uby.base / uby.reading があれば本文・王国表示に適用される。

## 20260722-121859 mobile timeline dialog before
- 保存先: data-backups/20260722-121859-mobile-timeline-dialog-before/
- 内容: スマホ表示でタイムラインを閉じ、ボタンからモーダル表示する変更前の index.html / styles.css / script.js / DATA_BACKUPS.md。
- 注意: history-content は変更していない。復元時は子カテゴリー53件、本文合計15000字以上、最短本文250字以上、先頭本文の「肥沃な三日月地帯」「チャタル・ヒュユク」を必ず確認する。

## 20260722-124220 subcategory layout before
- 保存先: data-backups/20260722-124220-subcategory-layout-before/
- 内容: 子カテゴリーのモバイル表示を日本史と同じカード型に戻す修正前の styles.css / DATA_BACKUPS.md。
- 注意: history-content は変更していない。復元時は子カテゴリー53件、本文合計15000字以上、最短本文250字以上、先頭本文の「肥沃な三日月地帯」「チャタル・ヒュユク」を必ず確認する。

## 20260722-125701 remove unlinked no-image people before
- 保存先: data-backups/20260722-125701-remove-unlinked-noimage-people-before/
- 内容: 画像未設定かつ教材データから未参照だった人物を整理する前の people-data.json / people-data.js / DATA_BACKUPS.md。
- 注意: history-content は変更していない。復元時は人物画像の重複参照0件と子カテゴリー保護条件を必ず確認する。

## 20260722-125857 restore required no-image people before
- 保存先: data-backups/20260722-125857-restore-required-noimage-people-before/
- 内容: ヒポクラテス、ユークリッドを復元する前の people-data.json / people-data.js / DATA_BACKUPS.md。
- 注意: マルコムX、ダントン、ネフェルティティ、ヒポクラテス、ユークリッドは画像未設定でも残す指定。

## 20260722-130146 remove minor no-image people before
- 保存先: data-backups/20260722-130146-remove-minor-noimage-people-before/
- 内容: 画像未設定のマイナー人物を人物データおよび勢力カード等の関係人物リストから外す前の people-data.json / people-data.js / DATA_BACKUPS.md。
- 注意: マルコムX、ダントン、ネフェルティティ、ヒポクラテス、ユークリッド、ネロは画像未設定でも残す。history-content は変更していない。

## 20260722-133110 fix mobile subcategory hidden before
- 保存先: data-backups/20260722-133110-fix-mobile-subcategory-hidden-before/
- 内容: スマホで年表モーダルへ本体 timeline を移動した影響で、通常画面の子カテゴリーが表示されなくなった問題を修正する前の styles.css / script.js / DATA_BACKUPS.md。
- 注意: history-content は変更していない。通常画面には子カテゴリーを残し、年表ボタンはモーダル内に複製表示する。

## 20260722-135245-implement-regional-timeline-dialog-before
- 対象: `index.html`, `styles.css`, `script.js`, `DATA_BACKUPS.md`
- 保存先: `data-backups/20260722-135245-implement-regional-timeline-dialog-before/`
- 内容: スマホ表示で各地域勢力タイムラインを本文内の埋め込み表示から専用ボタン + モーダル表示へ切り替える前の状態。
- 復元注意: `data/history-content.json` / `data/history-content.js` の子カテゴリー本文はこの作業で変更していない。復元時も短い旧本文へ戻さないこと。
### 2026-07-22 14:38

保存先:

`\\LS720DD35\Family\永人\世界の歴史\data-backups\20260722-143822-jhistory-ui-carryover-before`

保存内容:

- `index.html`
- `script.js`
- `styles.css`
- `DATA_BACKUPS.md`
- `ARCHITECTURE_MAP.md`
- `VERIFICATION_GUIDE.md`

目的:

- 日本史側から引き継ぐ上部メニュー整理、時代カード詳細のスマホ表示位置、各地域勢力タイムラインのスマホモーダル化と二重横スクロール解消を反映する前の状態を退避。
- 復元時は `history-content` の詳細本文保護条件と、人物画像参照の重複禁止を必ず再検証する。

## 20260722-people-image-workbench-official-only-before
- 保存先: data-backups/20260722-people-image-workbench-official-only-before/
- 内容: 画像管理画面の人物対象を正式な people 配列だけに限定する前の image-workbench.js / scripts/image-workbench-server.js / DATA_BACKUPS.md / ARCHITECTURE_MAP.md / VERIFICATION_GUIDE.md。
- 注意: peopleByName は検索・リンク用の補助データとして残し、画像管理画面の一覧対象にはしない。history-content は変更していない。
## 20260722-fix-constantinus-emperor-person-before
- 保存先: data-backups/20260722-fix-constantinus-emperor-person-before/
- 内容: 「コンスタンティヌス帝」が「コンスタンティヌス」部分だけで人物リンク化される問題を修正する前の people-data.json / people-data.js / modal-data.json / modal-data.js / DATA_BACKUPS.md。
- 注意: history-content は変更していない。正式人物名は「コンスタンティヌス帝」、別名は「コンスタンティヌス1世」とし、「コンスタンティヌス」単独キーは部分一致誤爆防止のため削除する。
## 20260722-fix-modal-tooltip-layer-before
- 保存先: data-backups/20260722-fix-modal-tooltip-layer-before/
- 内容: 人物・アクションモーダル内の専門語ツールチップが dialog の下レイヤーに潜る問題を修正する前の script.js / styles.css / DATA_BACKUPS.md。
- 注意: ツールチップは通常画面では body、モーダル内では開いている dialog 内へ配置し、dialog のトップレイヤー内で表示する。
## 20260722-update-history-content-people-integrated-v2-before
- 保存先: data-backups/20260722-update-history-content-people-integrated-v2-before/
- 内容: 子カテゴリー本文更新前の history-content.json / history-content.js / DATA_BACKUPS.md。
- 取り込み元: C:/Users/tamak/OneDrive/Desktop/history-content_people_integrated_v2_neutral_audience (1).json
- 注意: 取り込み前に子カテゴリー53件、本文合計15000字以上、最短本文250字以上、先頭本文の「肥沃な三日月地帯」「チャタル・ヒュユク」を確認済み。
## 20260722-add-southern-song-kingdom-before
- 保存先: data-backups/20260722-add-southern-song-kingdom-before/
- 内容: 南宋を勢力カード・地域勢力タイムラインへ追加し、既存の宋カードを北宋へ整理する前の modal-data.json / modal-data.js / learning-terms.json / learning-terms.js / DATA_BACKUPS.md。
- 注意: history-content は変更していない。北宋は960-1127、南宋は1127-1279として東アジアタイムラインに表示する。
## 20260722-add-southern-song-to-mongol-timeline-before
- 保存先: data-backups/20260722-add-southern-song-to-mongol-timeline-before/
- 内容: 「モンゴル帝国と東西交流」の地域勢力タイムラインへ南宋を明示追加する前の timeline-region-data.json / timeline-region-data.js / DATA_BACKUPS.md。
- 注意: history-content は変更していない。南宋は勢力カード側の timelineRange [1127,1279] を参照し、対象子カテゴリーの keywords に含めることで表示される。

## 20260722-mobile-subcategory-modal-kingdoms-before
- 保存先: data-backups/20260722-mobile-subcategory-modal-kingdoms-before/
- 内容: 携帯表示の子カテゴリー横幅、人物・アクションモーダル配置、できた王国・勢力・その他の開閉化を修正する前の styles.css / script.js / DATA_BACKUPS.md。
- 注意: history-content は変更していない。王国・勢力一覧は details 化して初期閉じにする。子カテゴリー本文を短文化・復元しないこと。

## 20260722-mobile-regional-timeline-line-before
- 保存先: data-backups/20260722-mobile-regional-timeline-line-before/
- 内容: 携帯の地域タイムラインモーダルで基準ラインが見えない問題を修正する前の styles.css / DATA_BACKUPS.md。
- 注意: 表示CSSのみの修正。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-mobile-left-timeline-axis-before
- 保存先: data-backups/20260722-mobile-left-timeline-axis-before/
- 内容: 携帯表示の左側年表軸（日付ラベル、縦線、接続点）を日本史寄りに修正する前の styles.css / DATA_BACKUPS.md。
- 注意: 表示CSSのみの修正。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-mobile-regional-timeline-modal-layout-before
- 保存先: data-backups/20260722-mobile-regional-timeline-modal-layout-before/
- 内容: 携帯の勢力タイムラインモーダルで横棒ラベルがはみ出し、表示が崩れる問題を修正する前の styles.css / DATA_BACKUPS.md。
- 注意: 表示CSSのみの修正。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-mobile-regional-timeline-pc-like-before
- 保存先: data-backups/20260722-mobile-regional-timeline-pc-like-before/
- 内容: 携帯の勢力タイムラインモーダルをPC同様の横スクロール表示へ戻し、十分な横幅と行高さでラベル潰れを防ぐ前の styles.css / DATA_BACKUPS.md。
- 注意: 表示CSSのみの修正。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-mobile-regional-timeline-label-chip-before
- 保存先: data-backups/20260722-mobile-regional-timeline-label-chip-before/
- 内容: 携帯の勢力タイムラインモーダルでラベルが線や行に重なって読みにくい問題を修正する前の styles.css / DATA_BACKUPS.md。
- 注意: 表示CSSのみの修正。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-power-card-font-before
- 保存先: data-backups/20260722-power-card-font-before/
- 内容: 時代カード内の補助情報カード（どこ / 集まった人 / なぜ / くらし）のフォントサイズ調整前の styles.css / DATA_BACKUPS.md。
- 注意: 表示CSSのみの修正。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-mobile-regional-timeline-no-vertical-scroll-before
- 保存先: data-backups/20260722-mobile-regional-timeline-no-vertical-scroll-before/
- 内容: 携帯の地域勢力タイムラインモーダルで縦スクロールが出る問題を修正する前の styles.css / index.html / DATA_BACKUPS.md。
- 注意: 表示CSSとCSSキャッシュ更新のみ。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-power-card-font-selector-fix-before
- 保存先: data-backups/20260722-power-card-font-selector-fix-before/
- 内容: 時代カード内の補助情報カードが .fact-grid の外側にあるため、フォント調整CSSが効いていなかった問題を修正する前の styles.css / index.html / DATA_BACKUPS.md。
- 注意: 表示CSSとCSSキャッシュ更新のみ。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-regional-timeline-bar-height-before
- 保存先: data-backups/20260722-regional-timeline-bar-height-before/
- 内容: 地域勢力タイムラインの地域行と横棒の高さを正しい表示例に合わせる前の styles.css / index.html / DATA_BACKUPS.md。
- 注意: 表示CSSとCSSキャッシュ更新のみ。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-regional-timeline-real-bar-before
- 保存先: data-backups/20260722-regional-timeline-real-bar-before/
- 内容: 地域勢力タイムラインで中央基準線だけが目立ち、実際の勢力バーの高さ変更が見えない問題を修正する前の styles.css / index.html / DATA_BACKUPS.md。
- 注意: 表示CSSとCSSキャッシュ更新のみ。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-mobile-year-chip-overlap-before
- 保存先: data-backups/20260722-mobile-year-chip-overlap-before/
- 内容: 携帯表示で年代チップが時代カードに重なって一部しか見えない問題を修正する前の styles.css / index.html / DATA_BACKUPS.md。
- 注意: 表示CSSとCSSキャッシュ更新のみ。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-power-card-pc-font-smaller-before
- 保存先: data-backups/20260722-power-card-pc-font-smaller-before/
- 内容: PC表示でも時代カード内の補助情報カード（どこ / 集まった人 / なぜ / くらし）のフォントをさらに小さくする前の styles.css / index.html / DATA_BACKUPS.md。
- 注意: 表示CSSとCSSキャッシュ更新のみ。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-power-card-font-specified-before
- 保存先: data-backups/20260722-power-card-font-specified-before/
- 内容: 時代カード内の補助情報カードのフォントを指定値（PC: 見出し14px / 本文12px / 太字12px、携帯: 見出し14px / 説明文12px）へ合わせる前の styles.css / index.html / DATA_BACKUPS.md。
- 注意: 表示CSSとCSSキャッシュ更新のみ。history-content と people-data は変更していない。子カテゴリー本文を短文化・復元しないこと。

## 20260722-history-content-v3-region-corrected-before
- 保存先: data-backups/20260722-history-content-v3-region-corrected-before/
- 内容: history-content_people_integrated_v3_region_corrected.json へ子カテゴリーデータを差し替える前の data/history-content.json / data/history-content.js / DATA_BACKUPS.md。
- 注意: 差し替え元は C:/Users/tamak/OneDrive/Desktop/history-content_people_integrated_v3_region_corrected.json。差し替え後も子カテゴリー53件、本文合計15000字以上、最短本文250字以上、先頭本文に「肥沃な三日月地帯」「チャタル・ヒュユク」が含まれることを確認すること。
