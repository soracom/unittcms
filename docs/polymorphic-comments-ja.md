# コメントシステムのポリモーフィック対応について

## 問題の理解

ご指摘の通り、当初の実装では`runCaseId`というカラムのみを持ち、runCaseにしか紐付けできない設計でした。しかし、今後はrunやcaseにもコメントを紐づける必要があるため、この設計では不十分でした。

## 実装した解決策

**ポリモーフィック関連（Polymorphic Association）** パターンを採用し、コメントを複数のエンティティタイプに柔軟に関連付けられるようにしました。

### データベーススキーマの変更

以前：
```
comments テーブル
- id
- runCaseId (INTEGER) ← runCaseにしか紐付けられない
- userId
- content
```

現在：
```
comments テーブル
- id
- commentableType (STRING) ← 'RunCase', 'Run', 'Case' のいずれか
- commentableId (INTEGER) ← 関連付けるエンティティのID
- userId
- content
```

### 利点

1. **拡張性**: runCaseだけでなく、run、caseにもコメントを付けられる
2. **将来性**: 新しいエンティティタイプを追加する際、スキーマ変更不要
3. **後方互換性**: 既存のrunCaseIdパラメータも引き続き使用可能
4. **データ移行**: 既存のコメントは自動的に新しい構造に変換される

## 使用例

### RunCaseへのコメント（現在の実装）
```javascript
// フロントエンド
<Comments 
  commentableType="RunCase" 
  commentableId={runCaseId} 
  projectId={projectId}
/>

// バックエンドAPI
GET /comments?commentableType=RunCase&commentableId=123
POST /comments/new { commentableType: "RunCase", commentableId: 123, content: "..." }
```

### Runへのコメント（将来の実装）
```javascript
// フロントエンド
<Comments 
  commentableType="Run" 
  commentableId={runId} 
  projectId={projectId}
/>

// バックエンドAPI
GET /comments?commentableType=Run&commentableId=456
POST /comments/new { commentableType: "Run", commentableId: 456, content: "..." }
```

### Caseへのコメント（将来の実装）
```javascript
// フロントエンド
<Comments 
  commentableType="Case" 
  commentableId={caseId} 
  projectId={projectId}
/>

// バックエンドAPI
GET /comments?commentableType=Case&commentableId=789
POST /comments/new { commentableType: "Case", commentableId: 789, content: "..." }
```

## 実装の詳細

### マイグレーション

`backend/migrations/20260131000001-convert-comments-to-polymorphic.js`

既存のデータを自動的に変換します：
1. 新しいカラム `commentableType` と `commentableId` を追加
2. 既存の `runCaseId` のデータを新しい構造に変換（commentableType='RunCase'に設定）
3. 古い `runCaseId` カラムを削除
4. パフォーマンスのため複合インデックスを作成

### モデル

`backend/models/comments.js`

ポリモーフィック関連を定義：
```javascript
Comment.belongsTo(models.RunCase, {
  foreignKey: 'commentableId',
  constraints: false,
  as: 'runCase',
});
Comment.belongsTo(models.Run, {
  foreignKey: 'commentableId',
  constraints: false,
  as: 'run',
});
Comment.belongsTo(models.Case, {
  foreignKey: 'commentableId',
  constraints: false,
  as: 'case',
});
```

### APIルート

`backend/routes/comments/`

後方互換性を維持しながら、新しいポリモーフィックパラメータをサポート：
```javascript
// 新しい方法
GET /comments?commentableType=RunCase&commentableId=123

// 古い方法（後方互換性のため引き続きサポート）
GET /comments?runCaseId=123
```

## 今後の対応

新しいエンティティタイプ（RunやCase）にコメント機能を追加する際は、以下の手順で実装できます：

1. ミドルウェアに新しいエンティティタイプの権限チェックを追加
2. エンティティのクエリにコメント数を含める
3. フロントエンドにCommentsコンポーネントを配置

詳細は `docs/polymorphic-comments.md` を参照してください。

## まとめ

✅ **問題は解決されました**

- runCaseだけでなく、runやcaseにもコメントを付けられる設計に変更
- 既存のコメントは自動的に新しい構造に移行
- 後方互換性を維持
- 新しいエンティティタイプの追加が容易

この変更により、将来的な機能拡張に柔軟に対応できるようになりました。
