# Project Rules

このプロジェクトで作業するAI・開発者は、作業前に必ず [DESIGN_GUARDRAILS.md](C:/Users/tamak/Documents/history/DESIGN_GUARDRAILS.md) と [DESIGN_RESTORE.md](C:/Users/tamak/Documents/history/DESIGN_RESTORE.md) を読むこと。
検証を行う場合は、必ず [VERIFICATION_GUIDE.md](C:/Users/tamak/Documents/world_history/VERIFICATION_GUIDE.md) を読み、記載済みの失敗手順を繰り返さないこと。

## 絶対ルール

- モーダル以外の重要なデザイン、レイアウト、データ構造、復元仕様を変更する前に、必ずユーザーの許可を取る。
- 背景色を確認せずに文字色を固定しない。特に赤文字、薄い文字、半透明文字は、背景とのコントラスト確認なしで使わない。
- デザイン変更時は、`Noto Sans JP`、`Noto Serif JP`、`Shippori Mincho` を基準フォントとする。
- アコーディオンや詳細の開閉UIは、文字の「ひらく」「とじる」ではなく、一般的なWeb UIのシェブロンアイコンで統一する。
- 枠線や背景を持つコンテンツ領域は、枠と本文テキストの内側余白を15px以上確保する。15px未満の余白はアイコンボタン、タグ、チップ、タイムラインバーなど小さな操作・ラベル部品だけに限る。
- 時代カード下の詳細本文は、時代カードの `くらし`、`できごと`、`大きな力` と同じフォントサイズ基準で表示する。
- 子カテゴリー画像は高さ200pxで表示し、`object-fit: cover` で中央トリミングする。画像の原寸高さでカードを縦長にしない。
- `styles.css` の変更前にはバックアップを残す。承認済みデザインを上書きする場合は、ユーザー確認後に `scripts/save-design-baseline.ps1` を実行する。
- 復元基準は勝手に更新しない。見た目を確認し、ユーザーが「この状態を基準にする」と明示した場合だけ更新する。
- 変更後は、トップ、7つの大区切り、各時代カード、詳細アコーディオン、人物・アクションモーダル、西暦表示を必ず確認する。
- 人物カードとアクションカードを変更する場合は、[DESIGN_GUARDRAILS.md](C:/Users/tamak/Documents/history/DESIGN_GUARDRAILS.md) の「人物カードの仕様」「アクションカードの仕様」「詳細本文とカード連動の仕様」を必ず守る。
- 検証時は [VERIFICATION_GUIDE.md](C:/Users/tamak/Documents/world_history/VERIFICATION_GUIDE.md) の順序を優先し、`node` のPATH問題、短命サーバー、`networkidle`、`window.openPerson` 直接呼び出しなど、記録済みの失敗方法を繰り返さない。
- 大カテゴリー、時代カード、子カテゴリーのサブタイトルや見出し補足文では、人物・アクション・王国カードへの本文リンクを付けない。カード連動リンクは説明本文・詳細本文に限定する。
- `data/*.json`、`data/*.js`、またはデータ正規化に関わる `script.js` を変更する前後で必要な場合は、`data-backups/` にバックアップを残し、[DATA_BACKUPS.md](C:/Users/tamak/Documents/world_history/DATA_BACKUPS.md) に保存先、保存内容、復元時の注意を記録する。
