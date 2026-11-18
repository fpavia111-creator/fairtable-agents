# Fairtable 飲食店向けエージェント

*Claude による翻訳です。ネイティブスピーカーによる確認は未了です。英語の [README](README.md) が正本です。*

レストラン、バー、カフェ、複数店舗グループのバックオフィス向けの、32 の小さな MCP エージェントです。それぞれが**ひとつの仕事**（実際原価と理論原価の比較、チッププール、デリバリーアプリの入金、アレルゲン表など）だけを受け持ち、それ以外のことはできません。POS、シフト管理、仕入先の請求書、デリバリーアプリ、予約システムから既に書き出しているファイルを読み、レポートをお客様のパソコンに書き出し、お金の移動・メッセージの送信・稼働中のシステムの変更の前には、名前の分かる担当者の承認を待ちます。

Mythos Machines の Fair Agents の一部です。MIT ライセンス · Node 20 以上 · ローカルファイルのみ · 認証情報不要 · 依存パッケージなし。ソフトウェアは無料で、有料なのはお客様のファイルでの定額の導入作業です。

## 試す

```bash
npx -y fairtable-food-cost demo            # 実際原価と理論原価（架空データ）
npx -y fairtable-delivery-payouts demo   # デリバリーアプリの入金と注文の照合
```

各エージェントには架空ファイルでの `demo`、独自テストケースの `eval`、MCP サーバー（`npx -y <エージェント> mcp --root <フォルダー>`）があります。

## エージェント一覧

**食材・仕入・バー（9）:** `fairtable-food-cost`（実際原価と理論原価）、`fairtable-recipe-costs`（最新単価でのレシピ原価）、`fairtable-price-creep`（仕入先の値上げ）、`fairtable-receiving-credits`（請求書と納品・返品の照合）、`fairtable-inventory-counts`（棚卸差異）、`fairtable-waste-log`（廃棄記録）、`fairtable-pour-cost`（バーの原価）、`fairtable-menu-engineering`（メニュー分析）、`fairtable-stockouts`（品切れ）。

**ホールと現金（6）:** `fairtable-voids-comps`（取消と無料提供）、`fairtable-discounts-promos`（値引きとプロモーション）、`fairtable-cash-drawers`（現金過不足）、`fairtable-gift-cards`（ギフトカード）、`fairtable-no-shows`（予約の無断キャンセル）、`fairtable-catering-deposits`（ケータリングの前受金）。

**人件費（5）:** `fairtable-tip-pooling`（チッププール）、`fairtable-overtime`（残業・分割シフト）、`fairtable-schedule-vs-actual`（予定と実績）、`fairtable-labor-dayparts`（時間帯別人件費率）、`fairtable-meal-breaks`（休憩と未成年）。

**デリバリー・手数料・税・請求書（6）:** `fairtable-delivery-payouts`（入金）、`fairtable-delivery-marketing`（販促費）、`fairtable-card-fees`（カード手数料）、`fairtable-sales-tax`（売上税）、`fairtable-duplicate-invoices`（重複請求・勘定科目）、`fairtable-utility-bills`（水道光熱費）。

**法令対応と複数店舗（6）:** `fairtable-equipment-maintenance`（設備保守）、`fairtable-health-inspections`（立入検査と許可）、`fairtable-food-handler-cards`（食品取扱者証）、`fairtable-allergen-matrix`（アレルゲン表）、`fairtable-prime-cost`（プライムコスト）、`fairtable-location-comparison`（店舗比較）。

## 安全のしくみ

- **1 エージェント 1 業務。** それ以外のツール名はすべてブロックされます。
- **拘束力のある操作は自動では行いません。** 支払い、返金、POS の変更、シフトの公開、給与計算、税の申告、メッセージ送信は行いません。下書きは DRAFT として保存され、承認には Auto モードでも必ず名前の分かる担当者のクリックが必要です。
- **個人情報はマスクします。** 従業員やお客様の氏名・電話番号・メールアドレスは、AI モデルに返す結果では `A.R.#3f9a2c` のような記号になります。パソコンに保存されるファイルには実際の値が残ります。
- **ローカルファイルのみ。** 通信なし。`.fairtable/` にハッシュチェーン付きの監査ログを残します。
- **ルールはお客様のもの。** 目標値、しきい値、賃金、税率、休憩ルール、アレルゲン一覧は、お客様自身の設定ファイルで決めます。

## テスト

Windows・Node 24 で 807 件のテストと 703 件の評価ケース（各エージェント 21 件以上）がすべて合格し、悪意ある入力のテストでも問題は見つかっていません。詳細は [REVIEW-ver1.md](REVIEW-ver1.md) を参照してください。

## 制限事項

名前付きエクスポートの列構成は各システムの知識に基づいて作成したもので、実際のアカウントでは確認していません。賃金・税・休憩・衛生のルールは国や地域で異なるため、専門家の確認が必要です。法律・税務・労務・衛生に関する助言ではありません。

MIT © 2026 Kurt Francisco
