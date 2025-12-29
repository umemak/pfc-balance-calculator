# PFCバランス計算アプリ

## プロジェクト概要
- **名前**: PFCバランス計算アプリ
- **目標**: 個人の基本情報から最適なタンパク質・脂質・炭水化物のバランスを計算し、健康的な食事管理をサポート
- **主な機能**: 
  - 基礎代謝量（BMR）の自動計算
  - 総消費カロリー（TDEE）の算出
  - 目標に応じたPFCバランスの最適化
  - 視覚的な円グラフでの栄養素バランス表示
  - 参考食品のPFC値データベース

## URL
- **開発環境**: https://3000-i8gz3p2t4pnugsdajehtr-d0b9e1e2.sandbox.novita.ai
- **GitHub**: https://github.com/umemak/pfc-balance-calculator

## 現在完了している機能

### 1. 基礎代謝・カロリー計算
- ✅ 体重、性別、活動レベルに基づくBMR計算
- ✅ 活動レベル別のTDEE算出（5段階）
- ✅ 目標に応じたカロリー調整（維持・減量・増量）

### 2. PFCバランス計算
- ✅ タンパク質（Protein）のグラム数とカロリー計算
- ✅ 脂質（Fat）のグラム数とカロリー計算
- ✅ 炭水化物（Carbs）のグラム数とカロリー計算
- ✅ 目標別の最適なPFC比率の自動調整

### 3. 視覚化機能
- ✅ Chart.jsによる円グラフ表示
- ✅ レスポンシブデザイン対応
- ✅ TailwindCSSによる美しいUI

### 4. 食品データベース
- ✅ 8種類の代表的な食品のPFC値表示
- ✅ 食品カード形式での見やすい表示

## 機能エントリーURI

### API エンドポイント

#### 1. PFCバランス計算API
- **パス**: `POST /api/calculate`
- **説明**: 基本情報からPFCバランスを計算
- **リクエストボディ**:
  ```json
  {
    "weight": 70,
    "gender": "male",
    "activityLevel": "moderate",
    "goal": "maintain"
  }
  ```
- **パラメータ**:
  - `weight` (number): 体重（kg）、1〜300
  - `gender` (string): 性別（"male" または "female"）
  - `activityLevel` (string): 活動レベル
    - "sedentary": ほとんど運動しない
    - "light": 軽い運動（週1-2回）
    - "moderate": 中程度の運動（週3-5回）
    - "active": 激しい運動（週6-7回）
    - "veryActive": 非常に激しい運動
  - `goal` (string): 目標
    - "maintain": 体重維持
    - "lose": 減量
    - "gain": 増量
- **レスポンス**:
  ```json
  {
    "bmr": 1680,
    "tdee": 2604,
    "targetCalories": 2604,
    "pfc": {
      "protein": {
        "grams": 163,
        "calories": 652,
        "percentage": 25
      },
      "fat": {
        "grams": 72,
        "calories": 651,
        "percentage": 25
      },
      "carbs": {
        "grams": 325,
        "calories": 1301,
        "percentage": 50
      }
    }
  }
  ```

#### 2. 食品データベースAPI
- **パス**: `GET /api/foods`
- **説明**: サンプル食品のPFC値を取得
- **レスポンス**:
  ```json
  [
    {
      "id": 1,
      "name": "鶏むね肉（100g）",
      "protein": 23,
      "fat": 1.5,
      "carbs": 0
    },
    ...
  ]
  ```

### フロントエンド

#### メインページ
- **パス**: `GET /`
- **説明**: PFCバランス計算のメインUI
- **機能**:
  - 基本情報入力フォーム
  - リアルタイム計算とグラフ表示
  - 食品のPFC値参照

## 未実装機能

### 今後の拡張候補
- ⏳ ユーザーアカウント機能（Cloudflare D1使用）
- ⏳ 食事記録・トラッキング機能
- ⏳ 日々の摂取量の記録と履歴表示
- ⏳ 目標達成度の可視化
- ⏳ より詳細な食品データベース（API連携）
- ⏳ PWA対応（オフライン利用）
- ⏳ エクスポート機能（PDF/画像）

## データアーキテクチャ

### データモデル
現在はステートレスな設計で、データの永続化は行っていません。

#### 計算ロジック
- **BMR計算**: Harris-Benedict方程式を使用
  - 男性: `13.397 × 体重 + 4.799 × 身長 - 5.677 × 年齢 + 88.362`
  - 女性: `9.247 × 体重 + 3.098 × 身長 - 4.330 × 年齢 + 447.593`
  - ※現在は簡易版（固定値使用）

- **TDEE計算**: `BMR × 活動係数`
  - sedentary: 1.2
  - light: 1.375
  - moderate: 1.55
  - active: 1.725
  - veryActive: 1.9

- **目標カロリー調整**:
  - 減量: TDEE - 500kcal
  - 維持: TDEE
  - 増量: TDEE + 500kcal

- **PFC比率**:
  - 減量時: P30% / F25% / C45%
  - 維持・増量時: P25% / F25% / C50%

### ストレージサービス
現在未使用。将来的にCloudflare D1の導入を検討。

## ユーザーガイド

### 使い方
1. **基本情報の入力**
   - 体重を入力（kg単位）
   - 性別を選択
   - 活動レベルを選択
   - 目標を選択（維持・減量・増量）

2. **計算**
   - 「計算する」ボタンをクリック

3. **結果の確認**
   - 代謝情報（BMR、TDEE、目標カロリー）
   - PFCバランスの円グラフ
   - 各栄養素の詳細（グラム数、カロリー、割合）
   - 参考食品のPFC値

### 推奨される使用方法
- **毎日の目標確認**: 朝に計算して1日の目標値を確認
- **食事計画**: 食品のPFC値を参考に献立を考える
- **進捗確認**: 定期的に体重を入力し直して調整

## デプロイ

### プラットフォーム
- **開発環境**: Cloudflare Pages（ローカル）
- **本番環境**: Cloudflare Pages（未デプロイ）

### デプロイ状況
- ✅ 開発環境: アクティブ
- ⏳ 本番環境: 未デプロイ

### 技術スタック
- **バックエンド**: Hono (v4.11.3)
- **フロントエンド**: HTML + TailwindCSS + Vanilla JavaScript
- **チャート**: Chart.js
- **アイコン**: Font Awesome
- **HTTPクライアント**: Axios
- **ランタイム**: Cloudflare Workers
- **ビルドツール**: Vite
- **デプロイ**: Wrangler

### ローカル開発
```bash
# ビルド
npm run build

# PM2で起動
pm2 start ecosystem.config.cjs

# テスト
npm run test

# ログ確認
pm2 logs webapp --nostream
```

### 本番デプロイ（予定）
```bash
# Cloudflare Pagesにデプロイ
npm run deploy:prod
```

## 推奨される次の開発ステップ

1. **データ永続化の実装**
   - Cloudflare D1でユーザーデータベースを作成
   - 食事記録機能の追加

2. **計算精度の向上**
   - 年齢・身長の入力項目追加
   - より正確なBMR計算式の実装

3. **UI/UX改善**
   - 入力履歴の保存（LocalStorage）
   - ダークモード対応
   - アニメーション追加

4. **食品データベースの拡張**
   - 外部API連携（例：USDA Food Database）
   - 食品検索機能
   - カスタム食品登録

## プロジェクト構成
```
webapp/
├── src/
│   └── index.tsx         # Honoアプリケーション
├── public/
│   └── static/
│       ├── app.js        # フロントエンドJavaScript
│       └── style.css     # カスタムCSS
├── dist/                 # ビルド出力
├── ecosystem.config.cjs  # PM2設定
├── package.json          # 依存関係
├── vite.config.ts        # Vite設定
├── wrangler.jsonc        # Cloudflare設定
└── README.md             # このファイル
```

## 最終更新日
2025-12-29
