# Polymorphic Comment System Architecture

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Comments Table                            │
├─────────────────────────────────────────────────────────────────┤
│ id                    INTEGER (PK)                              │
│ commentableType       STRING  ('RunCase', 'Run', 'Case')        │
│ commentableId         INTEGER (polymorphic FK)                  │
│ userId                INTEGER → users.id                        │
│ content               TEXT                                      │
│ createdAt             DATE                                      │
│ updatedAt             DATE                                      │
│                                                                  │
│ INDEX: (commentableType, commentableId)                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ polymorphic association
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ RunCases │    │   Runs   │    │  Cases   │
    ├──────────┤    ├──────────┤    ├──────────┤
    │ id       │    │ id       │    │ id       │
    │ runId    │    │ name     │    │ title    │
    │ caseId   │    │ state    │    │ desc     │
    │ status   │    │ ...      │    │ ...      │
    └──────────┘    └──────────┘    └──────────┘
```

## How Polymorphic Association Works

### Example 1: Comment on RunCase
```
Comment {
  id: 1,
  commentableType: 'RunCase',  ← Identifies entity type
  commentableId: 123,           ← ID of RunCase #123
  content: 'Test failed due to network timeout'
}
```

### Example 2: Comment on Run
```
Comment {
  id: 2,
  commentableType: 'Run',      ← Identifies entity type
  commentableId: 456,           ← ID of Run #456
  content: 'This test run found 5 critical bugs'
}
```

### Example 3: Comment on Case
```
Comment {
  id: 3,
  commentableType: 'Case',     ← Identifies entity type
  commentableId: 789,           ← ID of Case #789
  content: 'Need to update test data for this case'
}
```

## Query Examples

### Fetch all comments for a specific entity

```sql
-- Comments for RunCase #123
SELECT * FROM comments 
WHERE commentableType = 'RunCase' 
  AND commentableId = 123
ORDER BY createdAt ASC;

-- Comments for Run #456
SELECT * FROM comments 
WHERE commentableType = 'Run' 
  AND commentableId = 456
ORDER BY createdAt ASC;

-- Comments for Case #789
SELECT * FROM comments 
WHERE commentableType = 'Case' 
  AND commentableId = 789
ORDER BY createdAt ASC;
```

### Count comments for each entity

```sql
-- Count comments for all RunCases
SELECT 
  rc.id,
  (SELECT COUNT(*) FROM comments 
   WHERE commentableType = 'RunCase' 
     AND commentableId = rc.id) as commentCount
FROM runCases rc;

-- Count comments for all Runs
SELECT 
  r.id,
  (SELECT COUNT(*) FROM comments 
   WHERE commentableType = 'Run' 
     AND commentableId = r.id) as commentCount
FROM runs r;

-- Count comments for all Cases
SELECT 
  c.id,
  (SELECT COUNT(*) FROM comments 
   WHERE commentableType = 'Case' 
     AND commentableId = c.id) as commentCount
FROM cases c;
```

## API Flow Diagram

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ GET /comments?commentableType=RunCase&commentableId=123
       │
       ▼
┌──────────────────────────────────────────────────┐
│               Backend API                        │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │ 1. Authentication & Authorization      │     │
│  │    - verifySignedIn                    │     │
│  │    - verifyProjectVisibleFromRunCaseId │     │
│  └────────────────────────────────────────┘     │
│                    │                             │
│                    ▼                             │
│  ┌────────────────────────────────────────┐     │
│  │ 2. Query Comments                      │     │
│  │    WHERE commentableType = 'RunCase'   │     │
│  │      AND commentableId = 123           │     │
│  └────────────────────────────────────────┘     │
│                    │                             │
│                    ▼                             │
│  ┌────────────────────────────────────────┐     │
│  │ 3. Include User Data                   │     │
│  │    JOIN users ON comments.userId       │     │
│  └────────────────────────────────────────┘     │
│                    │                             │
└────────────────────┼─────────────────────────────┘
                     │
                     ▼
              ┌────────────┐
              │  Response  │
              │  [Comment] │
              └────────────┘
```

## Migration Flow

```
┌─────────────────────────────────────────────┐
│  Before Migration (Old Schema)              │
├─────────────────────────────────────────────┤
│ Comments Table:                             │
│   id | runCaseId | userId | content         │
│  ────┼───────────┼────────┼────────         │
│   1  |    123    |   10   | "Test failed"   │
│   2  |    124    |   11   | "Passed"        │
└─────────────────────────────────────────────┘
                    │
                    │ db:migrate
                    ▼
┌─────────────────────────────────────────────────────────┐
│  After Migration (New Schema)                           │
├─────────────────────────────────────────────────────────┤
│ Comments Table:                                         │
│   id | commentableType | commentableId | userId | ...   │
│  ────┼─────────────────┼───────────────┼────────┼────   │
│   1  |    'RunCase'    |     123       |   10   | ...   │
│   2  |    'RunCase'    |     124       |   11   | ...   │
│                                                          │
│ Now ready for:                                          │
│   - 'Run' comments                                      │
│   - 'Case' comments                                     │
│   - Future entity types                                 │
└─────────────────────────────────────────────────────────┘
```

## Component Usage Diagram

```
┌─────────────────────────────────────────────────────────┐
│              Test Run Detail Page                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ RunCase Detail Pane                             │   │
│  │                                                 │   │
│  │  [Case Detail] [Comments] [History]            │   │
│  │                    │                            │   │
│  │                    ▼                            │   │
│  │  ┌──────────────────────────────────────┐      │   │
│  │  │ <Comments                            │      │   │
│  │  │   commentableType="RunCase"          │      │   │
│  │  │   commentableId={runCaseId}          │      │   │
│  │  │   projectId={projectId}              │      │   │
│  │  │   onCommentCountChange={setCount}    │      │   │
│  │  │ />                                   │      │   │
│  │  └──────────────────────────────────────┘      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

                  Future Implementations:

┌─────────────────────────────────────────────────────────┐
│              Test Run Page                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ <Comments                                        │   │
│  │   commentableType="Run"                          │   │
│  │   commentableId={runId}                          │   │
│  │   projectId={projectId}                          │   │
│  │ />                                               │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Test Case Detail Page                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │ <Comments                                        │   │
│  │   commentableType="Case"                         │   │
│  │   commentableId={caseId}                         │   │
│  │   projectId={projectId}                          │   │
│  │ />                                               │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Benefits of Polymorphic Design

```
┌─────────────────────────────────────────────────────────┐
│           Traditional Design (One Table Per Type)       │
├─────────────────────────────────────────────────────────┤
│  ✗ RunCase_Comments table                               │
│  ✗ Run_Comments table                                   │
│  ✗ Case_Comments table                                  │
│  ✗ Duplicate code for each entity type                  │
│  ✗ Difficult to maintain consistency                    │
│  ✗ Hard to add new entity types                         │
└─────────────────────────────────────────────────────────┘

                        VS

┌─────────────────────────────────────────────────────────┐
│          Polymorphic Design (One Comments Table)        │
├─────────────────────────────────────────────────────────┤
│  ✓ Single Comments table                                │
│  ✓ Works for RunCase, Run, Case, and future types       │
│  ✓ Shared codebase and logic                            │
│  ✓ Easy to maintain consistency                         │
│  ✓ Trivial to add new entity types                      │
│  ✓ Better code reuse                                    │
└─────────────────────────────────────────────────────────┘
```
