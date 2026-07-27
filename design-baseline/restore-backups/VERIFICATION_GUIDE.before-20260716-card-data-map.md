# 検証ガイド

このファイルは「スクロールでわかる 世界のれきし」の検証手順を記録する。作業者は、データ・表示・モーダル・デザインに関わる変更後、ここに書かれた効率的な方法を優先して使うこと。同じ失敗した検証方法を繰り返さない。

## 最重要ルール

- 検証中に、より効率的で再現性の高い方法、または失敗しやすい方法とその原因・解決策が分かった場合は、作業完了前に必ずこの `VERIFICATION_GUIDE.md` を更新する。
- 「今回だけ分かったこと」を口頭や最終報告だけで終わらせない。次回の作業者が同じ無駄を踏まないよう、コマンド、期待値、失敗原因、解決方法をこのファイルに残す。
- このガイドの記録内容と実装が矛盾した場合は、実装を確認し、ガイドを最新状態へ修正してから完了する。

## 基本方針

- まず静的検証、次にデータ検証、最後にブラウザ検証を行う。
- `node` は通常PATHにないことがあるため、必ず bundled Node を使う。
- `data/modal-data.js` は `file://` でも読み込めるフォールバックである。通常利用では `index.html` を直接開いてもよい。
- `data/modal-data.json` の `fetch` はHTTPサーバー用の補助経路である。JSON単体の取得確認や本番に近い確認をするときはローカルHTTPサーバーを使う。
- `data/history-content.json` は大カテゴリー、時代カード、子カテゴリー本文の正本である。`data/history-content.js` は `file://` と `fetch` 失敗時のフォールバックとして `script.js` より前に読み込む。
- ブラウザ検証は、全件を手で開かず、代表サンプルで「人物」「アクション」「王国・勢力」の3種類のモーダルを確認する。
- 検証で失敗した場合は、原因がコードなのか検証方法なのかを分けて判断する。

## 使うNode

通常の `node --check script.js` は、環境によって `node` が見つからず失敗する。

必ず次を使う。

```powershell
& 'C:\Users\tamak\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check script.js
```

JSON件数確認:

```powershell
@'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/modal-data.json','utf8'));
console.log(JSON.stringify({
  people: data.people.length,
  peopleByName: Object.keys(data.peopleByName).length,
  actionCards: Object.keys(data.actionCards).length,
  kingdomCards: data.kingdomCards.length,
  kingdomPeople: Object.keys(data.kingdomPeople).length
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

## モーダル用データの弱い定型文チェック

人物・アクション・王国・勢力のモーダル本文に、内容の薄い定型文が戻っていないか確認する。

```powershell
@'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/modal-data.json','utf8'));
const weak = /考える人物です|手がかりになります|重要人物です|人権と未来を考える人|戦争と平和を考える人/;
const values = [];
for (const p of Object.values(data.peopleByName)) values.push(`${p[0]} ${p[4]} ${p[5]}`);
for (const [name, action] of Object.entries(data.actionCards)) values.push(`${name} ${action.join(' ')}`);
for (const card of data.kingdomCards) values.push(`${card.displayName} ${card.summary} ${card.text}`);
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
Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4176/data/modal-data.json' |
  Select-Object StatusCode, @{Name='Length';Expression={$_.RawContentLength}}
```

期待値:

- `StatusCode`: 200
- `Length`: `modal-data.json` と同程度

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
- `document.documentElement.dataset.modalDataSource` が `js` または `json` になっている
- 左メニューの大カテゴリーリンクに `data-group-id` があり、クリックすると他の `.era-group` が閉じ、指定した大カテゴリーだけが開く

モーダル確認は代表3種類で行う。

人物モーダル:

- 「奴隷制廃止運動」の本文リンクから `エイブラハム・リンカーン` を開く。
- 期待文言: `アメリカ第16代大統領`、`奴隷解放宣言`

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

- 現在は `index.html` で `data/modal-data.js` を先に読み込む。直接ファイルを開いてもこのJSフォールバックで表示できる。
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
- `file://` での読み込み互換性は、`index.html` に `data/modal-data.js` が `script.js` より前に読み込まれていること、`data/modal-data.js` の構文チェックが通ること、`script.js` が `window.WORLD_HISTORY_MODAL_DATA` を優先することを確認する。
- 自動検証時は `document.documentElement.dataset.modalDataSource` を確認する。`js` ならJSフォールバック、`json` ならHTTP経由のJSON取得で読み込んでいる。
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

- 全体探索はブラウザではなく `data/history-content.json`、`data/modal-data.json` の静的検証で行う。
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

1. `script.js`、`data/modal-data.js`、`data/history-content.js` の構文チェック。
2. `data/modal-data.json` と `data/history-content.json` のJSON parseと件数確認。
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

人物・アクション画像の保存先は `data/modal-data.json` の配列末尾メタ情報。

- 人物: 8番目の要素 `{ "image": "...", "imageAlt": "..." }`
- アクション: 4番目の要素 `{ "image": "...", "imageAlt": "..." }`

本番表示では `script.js` の `findVisualForPerson()` / `findVisualForAction()` がこの直接割り当て画像を最優先で表示する。
