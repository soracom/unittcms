# Polymorphic Comment System

## Overview

The comment system has been refactored to support polymorphic associations, allowing comments to be attached to multiple entity types: RunCases, Runs, and Cases.

## Database Schema

### Comments Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| commentableType | STRING | Entity type: 'RunCase', 'Run', or 'Case' |
| commentableId | INTEGER | ID of the associated entity |
| userId | INTEGER | User who created the comment |
| content | TEXT | Comment content |
| createdAt | DATE | Creation timestamp |
| updatedAt | DATE | Last update timestamp |

### Index
- Composite index on `(commentableType, commentableId)` for efficient querying

## Backend API

### Fetch Comments

**Endpoint**: `GET /comments`

**Query Parameters**:
- `commentableType` (string): Entity type ('RunCase', 'Run', or 'Case')
- `commentableId` (integer): Entity ID
- `runCaseId` (integer, legacy): For backward compatibility

**Example**:
```javascript
// New way (polymorphic)
GET /comments?commentableType=RunCase&commentableId=123

// Legacy way (backward compatible)
GET /comments?runCaseId=123
```

### Create Comment

**Endpoint**: `POST /comments/new`

**Request Body**:
```json
{
  "commentableType": "RunCase",
  "commentableId": 123,
  "content": "This is a comment"
}
```

**Legacy Format (backward compatible)**:
```json
{
  "runCaseId": 123,
  "content": "This is a comment"
}
```

### Update Comment

**Endpoint**: `POST /comments/edit`

**Request Body**:
```json
{
  "id": 456,
  "content": "Updated comment",
  "runCaseId": 123
}
```

### Delete Comment

**Endpoint**: `POST /comments/delete`

**Request Body**:
```json
{
  "id": 456,
  "runCaseId": 123
}
```

## Frontend Usage

### Comments Component

The Comments component now supports polymorphic entities:

```tsx
// For RunCase (current implementation)
<Comments 
  commentableType="RunCase" 
  commentableId={runCaseId} 
  projectId={projectId}
  onCommentCountChange={setCommentCount}
/>

// For Run (future)
<Comments 
  commentableType="Run" 
  commentableId={runId} 
  projectId={projectId}
  onCommentCountChange={setCommentCount}
/>

// For Case (future)
<Comments 
  commentableType="Case" 
  commentableId={caseId} 
  projectId={projectId}
  onCommentCountChange={setCommentCount}
/>

// Legacy way (still supported)
<Comments 
  runCaseId={runCaseId} 
  projectId={projectId}
  onCommentCountChange={setCommentCount}
/>
```

### Utility Functions

```typescript
import { fetchComments, createComment, updateComment, deleteComment } from '@/utils/commentControl';

// Fetch comments
const comments = await fetchComments(token, 'RunCase', 123);

// Create comment
const newComment = await createComment(token, 'RunCase', 123, 'Comment text');

// Update comment
const updatedComment = await updateComment(token, commentId, 'New text', runCaseId);

// Delete comment
await deleteComment(token, commentId, runCaseId);
```

## Migration

### Automatic Data Migration

The migration `20260131000001-convert-comments-to-polymorphic.js` automatically:
1. Adds new `commentableType` and `commentableId` columns
2. Migrates existing `runCaseId` data to the new structure (sets commentableType='RunCase')
3. Removes the old `runCaseId` column
4. Creates composite index for performance

### Running the Migration

```bash
cd backend
npx sequelize-cli db:migrate
```

### Rollback (if needed)

```bash
cd backend
npx sequelize-cli db:migrate:undo
```

**Note**: Rollback will delete any comments that are not of type 'RunCase'.

## Adding Comments to New Entity Types

### 1. Backend Routes

Create middleware for the new entity type in `backend/middleware/verifyVisible.js` and `verifyEditable.js`:

```javascript
// Example for Case
async function verifyProjectVisibleFromCaseId(req, res, next) {
  // ... implementation
}
```

Update routes to accept the new commentableType:

```javascript
// In routes/comments/index.js
if (commentableType === 'Case') {
  await verifyProjectVisibleFromCaseId(req, res, next);
}
```

### 2. Add Comment Count to Entity Queries

Update entity query to include comment count:

```javascript
// Example for Cases
attributes: [
  'id', 'title', 
  [
    sequelize.literal(
      "(SELECT COUNT(*) FROM comments WHERE comments.commentableType = 'Case' AND comments.commentableId = Cases.id)"
    ),
    'commentCount'
  ]
]
```

### 3. Frontend Integration

Add Comments component to the entity's detail page:

```tsx
<Comments 
  commentableType="Case" 
  commentableId={caseId} 
  projectId={projectId}
  onCommentCountChange={setCommentCount}
/>
```

## Benefits

1. **Extensibility**: Easy to add comments to new entity types without schema changes
2. **Flexibility**: Single comment system handles multiple entity types
3. **Backward Compatibility**: Existing code using runCaseId continues to work
4. **Performance**: Composite index ensures efficient queries
5. **Data Integrity**: Polymorphic associations maintain referential relationships

## Future Enhancements

- Add comment threading/replies
- Add comment reactions
- Add comment attachments
- Add comment notifications
- Add comment search functionality
