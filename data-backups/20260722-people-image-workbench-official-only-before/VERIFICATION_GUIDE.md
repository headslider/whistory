# 検証ガイド

このファイルは「スクロールでわかる 世界のれきし」の検証手順を記録する。作業者は、データ・表示・モーダル・デザインに関わる変更後、ここに書かれた効率的な方法を優先して使うこと。同じ失敗した検証方法を繰り返さない。

## 最重要ルール

- 検証中に、より効率的で再現性の高い方法、または失敗しやすい方法とその原因・解決策が分かった場合は、作業完了前に必ずこの `VERIFICATION_GUIDE.md` を更新する。
- 「今回だけ分かったこと」を口頭や最終報告だけで終わらせない。次回の作業者が同じ無駄を踏まないよう、コマンド、期待値、失敗原因、解決方法をこのファイルに残す。
- このガイドの記録内容と実装が矛盾した場合は、実装を確認し、ガイドを最新状態へ修正してから完了する。

## 基本方針

- まず静的検証、次にデータ検証、最後にブラウザ検証を行う。
- `node` は通常PATHにないことがあるため、必ず bundled Node を使う。
- `data/people-data.js`、`data/action-cards.js`、`data/modal-data.js`、`data/learning-terms.js` は `file://` でも読み込めるフォールバックである。通常利用では `index.html` を直接開いてもよい。
- `data/people-data.json`、`data/action-cards.json`、`data/modal-data.json`、`data/learning-terms.json` の `fetch` はHTTPサーバー用の補助経路である。JSON単体の取得確認や本番に近い確認をするときはローカルHTTPサーバーを使う。
- `data/history-content.json` は大カテゴリー、時代カード、子カテゴリー本文の正本である。`data/history-content.js` は `file://` と `fetch` 失敗時のフォールバックとして `script.js` より前に読み込む。
- ブラウザ検証は、全件を手で開かず、代表サンプルで「人物」「アクション」「王国・勢力」の3種類のモーダルを確認する。
- 検証で失敗した場合は、原因がコードなのか検証方法なのかを分けて判断する。

## 使うNode

通常の `node --check script.js` は、環境によって `node` が見つからず失敗する。

必ず次を使う。

```powershell
& 'C:\Users\tamak\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check script.js
```

カードJSON件数確認:

```powershell
@'
const fs = require('fs');
const people = JSON.parse(fs.readFileSync('data/people-data.json','utf8'));
const action = JSON.parse(fs.readFileSync('data/action-cards.json','utf8'));
const modal = JSON.parse(fs.readFileSync('data/modal-data.json','utf8'));
console.log(JSON.stringify({
  people: people.people.length,
  peopleByName: Object.keys(people.peopleByName).length,
  actionCards: Object.keys(action.actionCards).length,
  kingdomCards: modal.kingdomCards.length,
  kingdomPeople: Object.keys(modal.kingdomPeople).length
}, null, 2));
'@ | & 'C:\Users\tamak\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
```

期待値:

- `people`: 300
- `peopleByName`: 632
- `actionCards`: 111
- `kingdomCards`: 237
- `kingdomPeople`: 115

階層JSON件数確認:

```powershell
@'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/history-content.json','utf8'));
console.log(JSON.stringify({
  groups: data.groups.length,
  eras: data.groups.reduce((n,g)=>n+g.eras.length,0),
  subcategories: data.groups.reduce((n,g)=>n+g.eras.reduce((m,e)=>m+e.subcategories.length,0),0),
  powers: data.groups.reduce((n,g)=>n+g.eras.reduce((m,e)=>m+e.powers.length,0),0)
}, null, 2));
'@ | & 'C:\Users\tamak\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
```

期待値:

- `groups`: 10
- `eras`: 10
- `subcategories`: 53
- `powers`: 10


## 静的検証スクリプト

データ同期とルビ外部化の基本確認は、次でまとめて行う。

```powershell
& .\scripts\verify-static.ps1
```

確認内容:

- `data/*.json` と対応する `data/*.js` が同期していること。
- `data/learning-terms.json` と `data/learning-terms.js` が同期していること。
- `data/*.json` 内の画像参照がASCIIファイル名で、実ファイルが存在すること。
- `data/people-data.json` の `people[].image` は、複数人物で同じ画像パスを共有していないこと。共有がある場合は参照間違いとして失敗扱いにする。
- `script.js` に `const rubyGlossary = { ... }` の直書き辞書が戻っていないこと。
- `normalizeLearningTermsData()` と `loadLearningTermsData()` が存在すること。
- カタカナ混じり語を辞書語として丸ごとルビ管理していないこと。
- ツールチップは読みではなく、意味説明が必要なアクションカード名と本文内の特殊語・専門語に付いていること。

ルビ対象語は `data/learning-terms.json` / `.js` に個別登録する。小学生・中学生向けでも、簡単な漢字へ広く自動ルビを付ける処理は戻さない。`tooltip` は読み補助ではなく、意味説明が必要なアクション用語・専門語に限定する。`tooltip` が未設定の語には説明ポップアップを出さず、フォールバック定型文も作らない。
## モーダル用データの弱い定型文チェック

人物・アクション・王国・勢力のモーダル本文に、内容の薄い定型文が戻っていないか確認する。

```powershell
@'
const fs = require('fs');
const people = JSON.parse(fs.readFileSync('data/people-data.json','utf8'));
const action = JSON.parse(fs.readFileSync('data/action-cards.json','utf8'));
const modal = JSON.parse(fs.readFileSync('data/modal-data.json','utf8'));
const weak = /考える人物です|手がかりになります|重要人物です|人権と未来を考える人|戦争と平和を考える人/;
const values = [];
for (const p of Object.values(people.peopleByName)) values.push(`${p.name} ${p.title} ${p.modal?.profile || ''} ${p.modal?.whatDid || ''} ${p.modal?.whyImportant || ''}`);
for (const [name, card] of Object.entries(action.actionCards)) values.push(`${name} ${card.summary || ''} ${card.modal?.whatHappened || ''} ${card.modal?.whyImportant || ''}`);
for (const card of modal.kingdomCards) values.push(`${card.displayName} ${card.summary} ${card.text}`);
const hits = values.filter(v => weak.test(v));
console.log(JSON.stringify({ weakHits: hits.length }, null, 2));
'@ | & 'C:\Users\tamak\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
```

期待値:

- `weakHits`: 0

## 本文リンクとサブタイトル非リンクの静的チェック

サブタイトルや見出し補足文には人物・アクション・王国カードへの本文リンクを付けない。王国・勢力・その他カード名は、説明本文や詳細本文でリンク化されることを確認する。

効率的な確認は、ブラウザで表示後にDOMを数える。少なくとも次を確認する。

- `.action-subcategory-card header p .person-inline`
- `.action-subcategory-card header p .action-inline`
- `.action-subcategory-card header p .kingdom-inline`
- `.era-head > p:not(.eyebrow) .person-inline`
- `.era-head > p:not(.eyebrow) .action-inline`
- `.era-head > p:not(.eyebrow) .kingdom-inline`

期待値:

- 上記はいずれも `0`。
- アクションカード本文を開いた後の `#personDetail p .kingdom-inline` は、王国・勢力名を含むアクションカードでは `1` 以上。
- 説明本文・詳細本文・アクションカード本文の `唐`、`宋`、`中華人民共和国` などは、該当する王国・勢力・その他カードがある場合、`.kingdom-inline` で開ける。

## ローカルHTTPサーバー

`index.html` は `data/modal-data.js` を先に読み込むため、通常は `file://` でも表示できる。HTTPサーバー確認は、JSON取得経路も含めて確認したい場合に行う。

通常権限の `Start-Process` や `Start-Job` は、環境によってコマンド終了後にサーバーが終了し、ブラウザ側で `ERR_CONNECTION_REFUSED` になることがある。

安定して検証する場合は、承認付きでバックグラウンドサーバーを起動する。

```powershell
$python='C:\Users\tamak\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
Start-Process -FilePath $python -ArgumentList @(
  '-m','http.server','4176',
  '--bind','127.0.0.1',
  '--directory','C:\Users\tamak\Documents\world_history'
) -WindowStyle Hidden
Start-Sleep -Seconds 1
Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4176/data/people-data.json' |
  Select-Object StatusCode, @{Name='Length';Expression={$_.RawContentLength}}
```

期待値:

- `StatusCode`: 200
- `Length`: `people-data.json` と同程度

確認URL:

```text
http://127.0.0.1:4176/
```

## ブラウザ検証で成功した方法

ページロード後、以下を確認する。

- `.era-group`: 10件
- `.era`: 10件
- `.action-subcategory-card`: 53件
- `.person-name-item`: 300件
- `.kingdom-chip`: 237件
- `データを読み込めませんでした` が表示されていない
- `document.documentElement.dataset.historyContentSource` が `js` または `json` になっている
- `document.documentElement.dataset.peopleDataSource`、`dataset.actionDataSource`、`dataset.modalDataSource` が `js` または `json` になっている
- 左メニューの大カテゴリーリンクに `data-group-id` があり、クリックすると他の `.era-group` が閉じ、指定した大カテゴリーだけが開く

モーダル確認は代表3種類で行う。

人物モーダル:

- 「奴隷制廃止運動」の本文リンクから `エイブラハム・リンカーン` を開く。
- 期待文言: `アメリカ第16代大統領`、`奴隷解放宣言`
- 左の人物アイコン直下に、人物モーダル専用の `☆` 星アイコンボタンが表示される。タグ下やタイトル下に横長のお気に入りボタンが出ない。
- ボタンを押すと `★` に変わり、人物図鑑の `お気に入り` フィルターに同じ人物が表示される。もう一度押すと `☆` に戻り、フィルターから消える。
- アクションモーダルと王国・勢力モーダルには `data-modal-favorite` が出ない。`script.js` に `heroActions` が残っていない。

アクションモーダル:

- `インターネットの広がり` を開く。
- 期待文言: `インターネット`、`生活`

王国・勢力モーダル:

- `中華人民共和国(中国)` を開く。
- 期待文言: `中華人民共和国`、`毛沢東`

## 実行できなかった方法・避ける方法

### 通常PATHのnode

失敗例:

```powershell
node --check script.js
```

原因:

- `node` がPATHにない環境がある。

解決:

- bundled Node の絶対パスを使う。

### `file://` での確認

原因:

- 以前は `script.js` が `data/modal-data.json` を `fetch` するだけだったため、ブラウザのローカルファイル制限に引っかかった。

解決:

- 現在は `index.html` で `data/people-data.js`、`data/action-cards.js`、`data/modal-data.js` を先に読み込む。直接ファイルを開いてもこのJSフォールバックで表示できる。
- JSON取得経路も検証する場合だけ `http://127.0.0.1:<port>/` で確認する。

### 自動ブラウザでの `file://` 直接確認

失敗例:

```text
file:///C:/Users/tamak/Documents/world_history/index.html
```

原因:

- Codexのブラウザ操作は安全ポリシーにより `file://` ページへの直接遷移がブロックされる。

解決:

- 自動検証では `http://127.0.0.1:<port>/` を使う。
- `file://` での読み込み互換性は、`index.html` に `data/people-data.js`、`data/action-cards.js`、`data/modal-data.js` が `script.js` より前に読み込まれていること、各JSの構文チェックが通ること、`script.js` が `window.WORLD_HISTORY_PEOPLE_DATA`、`window.WORLD_HISTORY_ACTION_CARDS_DATA`、`window.WORLD_HISTORY_MODAL_DATA` を優先することを確認する。
- 自動検証時は `document.documentElement.dataset.peopleDataSource`、`dataset.actionDataSource`、`dataset.modalDataSource` を確認する。`js` ならJSフォールバック、`json` ならHTTP経由のJSON取得で読み込んでいる。
- ユーザーが直接 `index.html` を開く確認は、手元ブラウザで行う。

### 通常権限の短命サーバー

失敗例:

- 起動直後の `Invoke-WebRequest` は成功するが、その後ブラウザで `ERR_CONNECTION_REFUSED` になる。

原因:

- サンドボックス環境では、通常権限で起動したバックグラウンドプロセスがコマンド終了後に維持されないことがある。

解決:

- ブラウザ確認が必要なときだけ、理由を付けて承認付きでサーバーを起動する。

### `networkidle` 待機

失敗例:

```js
await tab.playwright.waitForLoadState({ state: 'networkidle' });
```

原因:

- このブラウザAPIでは `networkidle` がサポートされていない。

解決:

- `load` 待機後、必要に応じて短い待機と具体的なDOM件数確認を行う。

### `window.openPerson` 直接呼び出し

失敗例:

```js
window.openPerson('エイブラハム・リンカーン')
```

原因:

- ブラウザ検証スコープからトップレベル関数が `window` に見えない場合がある。

解決:

- 実際のUI操作と同じく、本文リンクやチップをクリックして確認する。

### ブラウザ評価内の `eval`

失敗例:

```js
eval('openPerson("エイブラハム・リンカーン")')
```

原因:

- 読み取り用のブラウザ評価スコープでは `eval` が使えない。

解決:

- DOM上のボタンをクリックする。

### スクロール後の座標クリックだけで本文リンクを検証する方法

失敗例:

```js
await tab.cua.scroll({ x: 640, y: 640, scrollY: 2000, scrollX: 0 });
await tab.cua.click({ x, y });
```

原因:

- 長いページでは、スクロール後の座標クリックが意図したインラインリンクではなく、別の本文要素に当たることがある。
- `getBoundingClientRect()` で見える座標に見えても、`document.elementFromPoint()` が別要素を返す場合がある。

解決:

- サブタイトル非リンクや本文リンク生成の確認は、まずDOM件数と `data-kingdom-id` などの属性で確認する。
- 実クリック確認が必要な場合は、座標クリックを第一候補にせず、表示中の安定したボタンやチップを対象にする。
- 座標クリックを使う前に、同じ座標で `document.elementFromPoint()` が目的の `.person-inline`、`.action-inline`、`.kingdom-inline` を返すか確認する。

### 大きなDOM全体を属性セレクタで探索するブラウザ評価

失敗例:

```js
await tab.playwright.evaluate(() => ({
  lincolnInline: document.querySelectorAll('button[data-person-name="エイブラハム・リンカーン"]').length,
  internetButtons: document.querySelectorAll('button[data-action-name="インターネットの広がり"]').length
}));
```

原因:

- 年表、人物一覧、カード本文を全件描画した状態ではDOMが大きく、ブラウザ評価内で広範囲の属性セレクタをまとめて走らせるとタイムアウトし、ブラウザ操作セッションがリセットされることがある。

解決:

- 全体探索はブラウザではなく `data/history-content.json`、`data/people-data.json`、`data/action-cards.json`、`data/modal-data.json` の静的検証で行う。
- ブラウザでは `.era-group`、`.action-subcategory-card`、`.person-name-item` などの軽い件数確認と、左メニューのように対象が一意に絞れるUI操作を優先する。
- モーダルの実クリック確認は、対象セクションを開いて表示範囲を絞った後、安定したボタンやチップを1件ずつ確認する。

### アプリ内ブラウザ接続がUNC作業ディレクトリで落ちる場合

失敗例:

```text
node_repl kernel exited unexpectedly
windows sandbox failed: CreateProcessWithLogonW failed: 267
```

原因:

- Codexのアプリ内ブラウザ操作用ランタイムが、UNCパスを作業ディレクトリにした状態で起動できない場合がある。

解決:

- まず静的検証とローカルHTTPサーバー確認を行う。
- ブラウザ自動確認が必要で、アプリ内ブラウザ接続がこのエラーで落ちる場合は、bundled Node の `NODE_PATH` に `.pnpm\node_modules` も追加し、インストール済みChromeの `executablePath` を指定してPlaywrightを実行する。
- Playwright標準の bundled browser が未導入の場合、`npx playwright install` は外部ダウンロードになるため勝手に実行しない。

### Playwrightで折りたたみ内ボタンが非表示扱いになる場合

失敗例:

```text
locator.click: Timeout 30000ms exceeded
- element is not visible
```

原因:

- 初期状態で折りたたまれている人物図鑑や時代詳細内のボタンは、DOMに存在してもPlaywrightの通常クリックでは非表示扱いになることがある。

解決:

- 代表モーダルの生成確認では、まず表示中の安定したボタンを使う。
- 折りたたみ状態が検証対象でない場合は、DOM上のボタン要素の `click()` を使い、`window.openPerson` などのトップレベル関数を直接呼ばず、実際のクリックハンドラ経由で確認する。
- 検証ガイド指定の代表カードは、`data-action-name` や `aria-label` で対象ボタンを特定してからクリックする。
### 人物図鑑300件だけでの検証

原因:

- 人物図鑑に表示される300件以外にも、本文リンクや勢力カードから開ける人物がある。

解決:

- モーダル本文の網羅チェックは `people` ではなく `peopleByName` を使う。

## 効率的な検証順

1. `script.js`、`image-workbench.js`、`scripts/image-workbench-server.js`、`data/history-content.js`、`data/people-data.js`、`data/action-cards.js`、`data/modal-data.js` の構文チェック。
2. `data/history-content.json`、`data/people-data.json`、`data/action-cards.json`、`data/modal-data.json` のJSON parseと件数確認。
3. 弱い定型文チェック。
4. ローカルHTTPサーバー起動とJSON取得確認。
5. ブラウザで件数確認。
6. 左メニューの大カテゴリー移動をクリック確認。
7. 代表3モーダルをクリック確認。
8. 必要な場合だけスクリーンショット確認。

## 注意

- `styles.css` を変更した場合は、このガイドだけでなく `DESIGN_GUARDRAILS.md` の画面確認を必ず行う。
- モーダルデータを増減した場合は、期待件数もこのファイルに追記する。
- 新しい検証失敗が発生した場合は、原因と解決方法をこのファイルに追加する。

## 画像作業ページの検証

世界史側の画像作業ページは `data/history-content.*` と `data/modal-data.*` を直接更新する。日本史側の `people-data.*` / `action-cards.*` は使わない。

起動:

```powershell
$env:IMAGE_WORKBENCH_PORT=4185
& 'C:\Users\tamak\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'scripts\image-workbench-server.js'
```

確認URL:

```text
http://127.0.0.1:4185/image-workbench.html
```

期待値:

- 全件: 796件
- 人物カード: 632件
- アクションカード: 111件
- 子カテゴリー: 53件
- 既存カテゴリー画像プルダウン: プレースホルダー込み54件
- 人物・アクションでは `表示位置` 欄が非表示
- 子カテゴリーでは `表示位置` 欄が表示

保存APIの安全確認は、まず変更なしの再保存で行う。保存時に `backups/image-workbench-apply-*` が作られ、ロールバック時に `backups/image-workbench-rollback-before-restore-*` が作られる。JSON本体が変わらない場合でも、配布用JSはサーバー出力形式で再生成されることがあるため、必要に応じて作成直後のバックアップへ戻してから完了する。

人物画像の保存先は `data/people-data.json`、アクション画像の保存先は `data/action-cards.json` の各オブジェクト直下の画像フィールド。

- 人物: `{ "image": "...", "imageAlt": "..." }`
- アクション: `{ "image": "...", "imageAlt": "..." }`

本番表示では `script.js` の `findVisualForPerson()` / `findVisualForAction()` がこの直接割り当て画像を最優先で表示する。
失敗時の確認:

- 本体へ反映ボタンを押しても保存APIへ到達しない場合は、ブラウザコンソールで `embeddedImageCount is not defined` など、送信前のJavaScriptエラーが出ていないか確認する。
- 人物画像の保存で `画像保存の照合に失敗しました: person/...` が出る場合は、保存前ペイロードの `peopleData.people` と `peopleData.peopleByName[人物名]` の両方に、同じ `image` / `imageAlt` が入っているか確認する。サーバー側は人物名検索で `peopleByName` を優先するため、片方だけ更新されている状態は失敗扱いになる。
- 画像作業ページ側では、保存前に `syncModalPersonVisuals()` が走り、`buildPatch()` の前に人物データの複数コピーが同期されている必要がある。

## カード生成・データ管理の検証

世界史側も日本史側と同じく、人物カードは `data/people-data.*`、アクションカードは `data/action-cards.*`、王国・勢力カードは `data/modal-data.*` に分離して管理する。日本史側の検証手順を流用する場合も、この分離構成を前提に確認する。

### 正本と配布JSの同期

確認対象:

- `data/history-content.json` と `data/history-content.js`
- `data/people-data.json` と `data/people-data.js`
- `data/action-cards.json` と `data/action-cards.js`
- `data/modal-data.json` と `data/modal-data.js`

同期確認は bundled Node で行う。PowerShellではヒアストリングを使ってよいが、ここでは内容だけ示す。

```js
const fs = require('fs');
const vm = require('vm');
const sandbox = { window: {} };
const history = JSON.parse(fs.readFileSync('data/history-content.json', 'utf8'));
const people = JSON.parse(fs.readFileSync('data/people-data.json', 'utf8'));
const action = JSON.parse(fs.readFileSync('data/action-cards.json', 'utf8'));
const modal = JSON.parse(fs.readFileSync('data/modal-data.json', 'utf8'));
vm.runInNewContext(fs.readFileSync('data/history-content.js', 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync('data/people-data.js', 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync('data/action-cards.js', 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync('data/modal-data.js', 'utf8'), sandbox);
console.log(JSON.stringify({
  historyJsMatchesJson: JSON.stringify(sandbox.window.historyContentData) === JSON.stringify(history),
  peopleJsMatchesJson: JSON.stringify(sandbox.window.WORLD_HISTORY_PEOPLE_DATA) === JSON.stringify(people),
  actionJsMatchesJson: JSON.stringify(sandbox.window.WORLD_HISTORY_ACTION_CARDS_DATA) === JSON.stringify(action),
  modalJsMatchesJson: JSON.stringify(sandbox.window.WORLD_HISTORY_MODAL_DATA) === JSON.stringify(modal),
  groups: history.groups.length,
  eras: history.groups.reduce((n,g)=>n+(g.eras||[]).length,0),
  subcategories: history.groups.reduce((n,g)=>n+(g.eras||[]).reduce((m,e)=>m+(e.subcategories||[]).length,0),0),
  people: people.people.length,
  peopleByName: Object.keys(people.peopleByName || {}).length,
  actionCards: Object.keys(action.actionCards || {}).length,
  kingdomCards: (modal.kingdomCards || []).length,
  kingdomPeople: Object.keys(modal.kingdomPeople || {}).length,
  replacementCharacterFiles: ['data/history-content.json','data/history-content.js','data/people-data.json','data/people-data.js','data/action-cards.json','data/action-cards.js','data/modal-data.json','data/modal-data.js','script.js']
    .filter(file => fs.readFileSync(file, 'utf8').includes('\\uFFFD'))
}, null, 2));
```

期待値:

- `historyJsMatchesJson`: `true`
- `peopleJsMatchesJson`: `true`
- `actionJsMatchesJson`: `true`
- `modalJsMatchesJson`: `true`
- `groups`: `10`
- `eras`: `10`
- `subcategories`: `53`
- `people`: `300`
- `peopleByName`: `632`
- `actionCards`: `111`
- `kingdomCards`: `237`
- `kingdomPeople`: `115`
- `replacementCharacterFiles`: `[]`

件数は教材更新で変わる場合がある。変えた場合は、なぜ増減したかを `CHANGELOG.md` とこのファイルへ記録してから期待値を更新する。

### カード生成関数の確認ポイント

`script.js` のカード生成・データ管理を変更した場合、最低限次を確認する。

- `normalizeHistoryContent(data)` が `history-content` から `eras`、`eraGroups`、`eraDetails`、`worldHistoryActionSubcategories`、`subcategoryImages`、`subcategoryImageFocusByName` を作る。
- `normalizePeopleData(data)` が `people-data` から `people` と `personByName` を作る。
- `normalizeActionData(data)` が `action-cards` から `actionCards` を作る。
- `normalizeModalData(data)` が `modal-data` から `kingdomCards` と `kingdomPeople` を作る。
- `renderTimeline()` が10大カテゴリーを描画する。
- `renderEraCard(era)` が時代カード、詳細、地域タイムライン、子カテゴリーを描画する。
- `renderActionSubcategories(group, groupEras)` が53件の子カテゴリーを描画する。
- `renderRegionalPowerTimeline(...)` が王国・勢力カードを地域タイムライン化する。
- `renderPeople()` が人物図鑑300件を描画する。
- `openPerson(name)` は `personByName` を使い、人物図鑑外の人物も開ける。
- `openAction(name)` は `actionCards` を使い、定型フォールバック文を生成しない。
- `openKingdom(id)` は `kingdomCards` を使い、王国・勢力モーダルを開く。

ブラウザDOM件数の期待値:

- `.era-group`: 10
- `.era`: 10
- `.action-subcategory-card`: 53
- `.person-name-item`: 300
- `.kingdom-chip`: 237

### モーダル本文の定型文禁止

人物・アクションモーダルは登録済みデータだけを表示する。`script.js` 側で欠損時フォールバック文や自動紹介文を生成しない。

確認対象:

- `personModalSections(person)`
- `actionModalSections(name, action)`
- `renderLearningModal(...)`
- `data/people-data.json` の `peopleByName` と `data/action-cards.json` の `actionCards`

期待値:

- 弱い定型表現のヒット数は `0`。
- `script.js` に「手がかりになります」「重要人物です」などの自動定型文が戻っていない。

### 本文リンクとサブタイトル非リンク

大カテゴリー、時代カード、子カテゴリーのサブタイトルや見出し補足文では、人物・アクション・王国カードへの本文リンクを付けない。リンク化は説明本文・詳細本文・モーダル本文に限定する。

DOM確認の期待値:

- `.action-subcategory-card header p .person-inline`: `0`
- `.action-subcategory-card header p .action-inline`: `0`
- `.action-subcategory-card header p .kingdom-inline`: `0`
- `.era-head > p:not(.eyebrow) .person-inline`: `0`
- `.era-head > p:not(.eyebrow) .action-inline`: `0`
- `.era-head > p:not(.eyebrow) .kingdom-inline`: `0`

本文や詳細本文では、該当データがある語だけ `.person-inline` / `.action-inline` / `.kingdom-inline` になる。

## 画像作業ページの本番データ直接保存ルール

日本史側で起きた不具合を避けるため、世界史側でも画像作業ページは本番データ全体を直接送信・保存する設計を維持する。

### 設計原則

- 編集対象は常に `historyData` と `modalData`。
- 差分表示のために保持してよいのは `image` / `imageFocus` / `imageAlt` の基準スナップショットだけ。
- 保存サーバーは `patch.operations` だけに依存しない。送信された `historyContent` と `modalData` を正として保存する。
- `patch.operations` が0件でも、API送信を止めない。
- 保存前に必ずバックアップを作る。

### 世界史側の保存対象

- 子カテゴリー画像: `data/history-content.json` / `data/history-content.js`
- 人物画像: `data/people-data.json` / `data/people-data.js`
- アクション画像: `data/action-cards.json` / `data/action-cards.js`

人物・アクション画像は各オブジェクト直下の `image` / `imageAlt` に保存する。

- 人物: `{ "image": "...", "imageAlt": "..." }`
- アクション: `{ "image": "...", "imageAlt": "..." }`

`imageFocus` は子カテゴリーだけで使う。人物・アクションでは表示位置UIを出さない。

### 保存API検証

変更なしの再保存でAPIの健全性を確認する場合:

1. `/api/apply-image-data` が `ok: true` を返す。
2. `backupDir` が新しく作成される。
3. `backups/.../manifest.json` に `kind: "apply"` が入る。
4. `data/history-content.*` と `data/modal-data.*` が保存後もJSON/JS同期している。
5. 必要に応じて作成直後のバックアップへロールバックし、復元後に4ファイルがバックアップ内容と一致することを確認する。

ロールバック確認:

1. `/api/rollback-image-data` が `ok: true` を返す。
2. `rollbackBackupDir` が新しく作成される。
3. `manifest.json` に `kind: "rollback-before-restore"` が入る。
4. 復元後の `data/history-content.*` と `data/modal-data.*` が選択バックアップと一致する。

禁止事項:

- `HTTP 200` や画面上の表示だけで保存完了と判断しない。
- 管理画面プレビューが動いたことだけで本番反映済みと判断しない。
- `patch.operations` が0件だからといってAPI送信を中断する実装へ戻さない。
- Data URL画像保存後の照合で、Data URL完全一致を期待しない。保存後は `assets/people/`、`assets/actions/`、`assets/subcategories/` に実体化される。

### imageFocus 検証

子カテゴリー画像の上下位置を変更した場合は、キャッシュやCSSを疑う前に次を確認する。

1. 対象子カテゴリーの `data/history-content.json` に希望する `imageFocus` が保存されている。
2. `data/history-content.js` も同じ `imageFocus` を持つ。
3. 画像作業ページの `patch.operations[].after.imageFocus` に希望値が入っている。
4. 本番 `script.js` が `subcategoryImageFocusByName` から `.subcategory-image-up` / `.subcategory-image-down` を出す。
5. `styles.css` に `.subcategory-image-up` / `.subcategory-image-down` がある。

同じ画像URLのまま `imageFocus` だけ変更する場合も保存対象とする。画像URL差分だけで変更有無を判断してはいけない。

## 静的検証だけで十分な場合・不十分な場合

静的検証だけで十分な場合:

- `data/history-content.json` / `.js` の本文、画像パス、タグだけを変更した。
- `data/people-data.json` / `.js` の人物データ、`data/action-cards.json` / `.js` のアクションデータ、`data/modal-data.json` / `.js` の王国データだけを変更した。
- UI、CSS、クリック処理、モーダル生成関数を変更していない。

静的検証だけでは不十分な場合:

- `script.js` の `renderTimeline()`、`renderEraCard()`、`renderActionSubcategories()`、`renderLearningModal()`、`openPerson()`、`openAction()`、`openKingdom()`、`handleInlineCardLink()` を変更した。
- `styles.css` を変更した。
- 画像作業ページ、保存API、ロールバックAPIを変更した。

この場合は静的検証後に、ローカルHTTPサーバーまたは画像作業ページ専用サーバーでDOM件数・代表モーダル・保存APIを確認する。







## 専門語ツールチップと本文リンクの分割確認

`ハンムラビ法典` のように、専門語の中に人物名やカード名が含まれる場合、短い語を先に本文リンク化すると専門語ツールチップが分割される。

対策:

- `enrichDetailLinks()` では、人物・アクション・王国リンク候補に加えて `termTooltipGlossary` の語も候補に含める。
- 候補は長さ降順で正規表現化し、長い専門語を先に消費する。
- ツールチップ専用語はリンクボタン化せず、`applyStudyRuby()` で丸ごとツールチップ表示する。
- `scripts/verify-static.js` は、長い専門語の中に短いリンク語が含まれる全テキスト出現を検査し、短い語で分割される可能性があれば失敗する。

代表確認:

- ハンムラビの人物モーダル本文で `ハンムラビ法典` が `ハンムラビ` + `法典` に分かれず、専門語ツールチップとして丸ごと扱われること。
- `ナポレオン法典`、`東ローマ帝国`、`アケメネス朝ペルシャ` など、同じ構造の語も分割されないこと。



## スマホUI・子カテゴリー開閉・ツールチップ操作の確認

styles.css または script.js のスマホUI、子カテゴリー、モーダル、ツールチップ周辺を変更した場合は、静的検証に加えて次を確認する。

- スマホ幅ではトップバーが1行に収まり、設定ボタン類が本文を押し下げない。
- 子カテゴリーカードは本文プレビューを常時表示せず、右上シェブロンだけで本文を開閉する。カード全体タップで意図せず開閉しない。
- 子カテゴリーを開いた時だけ画像が横長表示になり、imageFocus の上下指定が反映される。
- 人物・アクションモーダルはスマホ幅で画面内に収まり、閉じるボタン、タイトル、画像、説明本文が重ならない。
- 専門語ツールチップはPCではホバー/フォーカス、スマホではタップ/長押しで開閉する。ツールチップ操作は親カード開閉やモーダルリンクへ伝播しない。
- モーダル内のツールチップはモーダル下に隠れず、画面内に表示される。

## 2026-07-22 UI引き継ぎ検証追加項目

- スマホ幅で上部バーに旧「ふりがな」「動き」「音」ボタンが出ず、「オプション」ボタンとページ目次ボタンが横一列に収まること。
- スマホ幅で大カテゴリー・時代カード・子カテゴリーは通常本文内に表示され、ページ目次の「年表」リンクで旧年表モーダルへ飛ばないこと。
- スマホ幅で `くらし`、`できごと`、`大きな力` の詳細は押したカードの直下に表示され、PC幅では3カード下の横断パネルとして表示されること。
- スマホ幅で各地域勢力タイムラインは本文内に直接表示されず、「各地域勢力タイムラインを開く」ボタンからモーダル表示されること。モーダル内の横スクロールバーはタイムライン部品の1本だけで、モーダル本文側に二重横スクロールが出ないこと。
