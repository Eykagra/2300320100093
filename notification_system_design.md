# Notification System Design

## Stage 1

### Overview

The campus notification platform delivers real-time updates to students about Placements, Events, and Results. This document defines the core actions the platform supports, the REST API contract for each action, and the mechanism chosen for real-time delivery.

Authentication is assumed to be pre-authorised for the purpose of this evaluation. Every request carries a `Bearer` token in the `Authorization` header that identifies the calling student. No registration or login endpoints are exposed.

### Core Actions

| Action | Description |
| --- | --- |
| List notifications | Fetch a paginated list of notifications for the authenticated student. |
| Get a single notification | Fetch one notification by its identifier. |
| Mark one as read | Update the read state of a single notification. |
| Mark all as read | Update the read state of every unread notification for the student. |
| Get unread count | Return the number of unread notifications, used for badge counts. |
| Create a notification | Internal/admin action used by publishers to push a new notification. |
| Stream notifications | Open a real-time channel that pushes new notifications as they arrive. |

### Conventions

- Base path: `/api/v1`
- All request and response bodies are `application/json`.
- Resource collections are plural nouns (`/notifications`).
- Timestamps are ISO 8601 in UTC (`2026-04-22T17:51:30Z`).
- Identifiers are UUID v4 strings.
- Standard headers on every request:

```
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

- `notificationType` is an enum: `placement`, `result`, `event`.
- Pagination uses `page` and `pageSize` query parameters with sensible defaults.

### Endpoints

#### 1. List notifications

```
GET /api/v1/notifications?page=1&pageSize=20&type=placement&unread=true
```

Query parameters:

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| page | integer | no | 1 | Page number, 1-based. |
| pageSize | integer | no | 20 | Items per page, max 100. |
| type | string | no | all | Filter by `placement`, `result`, or `event`. |
| unread | boolean | no | false | When true, return only unread items. |

Response `200 OK`:

```json
{
  "data": [
    {
      "id": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
      "type": "placement",
      "message": "CSX Corporation hiring",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:18Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 134,
    "totalPages": 7
  }
}
```

#### 2. Get a single notification

```
GET /api/v1/notifications/{id}
```

Response `200 OK`:

```json
{
  "id": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
  "type": "placement",
  "message": "CSX Corporation hiring",
  "isRead": false,
  "createdAt": "2026-04-22T17:51:18Z"
}
```

Response `404 Not Found`:

```json
{
  "error": "not_found",
  "message": "notification does not exist"
}
```

#### 3. Mark one as read

```
PATCH /api/v1/notifications/{id}
```

Request body:

```json
{
  "isRead": true
}
```

Response `200 OK`:

```json
{
  "id": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
  "type": "placement",
  "message": "CSX Corporation hiring",
  "isRead": true,
  "createdAt": "2026-04-22T17:51:18Z"
}
```

#### 4. Mark all as read

```
POST /api/v1/notifications/read-all
```

Response `200 OK`:

```json
{
  "updated": 12
}
```

#### 5. Get unread count

```
GET /api/v1/notifications/unread-count
```

Response `200 OK`:

```json
{
  "unread": 12
}
```

#### 6. Create a notification

```
POST /api/v1/notifications
```

Request body:

```json
{
  "studentId": "1042",
  "type": "placement",
  "message": "Advanced Micro Devices Inc. hiring"
}
```

Response `201 Created`:

```json
{
  "id": "8a7412bd-6065-4d09-8501-a37f11cc848b",
  "type": "placement",
  "message": "Advanced Micro Devices Inc. hiring",
  "isRead": false,
  "createdAt": "2026-04-22T17:49:42Z"
}
```

Response `400 Bad Request`:

```json
{
  "error": "validation_failed",
  "message": "type must be one of placement, result, event"
}
```

### Error Format

All errors share a consistent shape so clients can handle them uniformly.

```json
{
  "error": "string_code",
  "message": "human readable explanation"
}
```

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | validation_failed | Request body or query failed validation. |
| 401 | unauthorized | Missing or invalid token. |
| 404 | not_found | Resource does not exist. |
| 429 | rate_limited | Too many requests. |
| 500 | internal_error | Unexpected server error. |

### Real-Time Delivery Mechanism

For pushing notifications to a logged-in student the moment they are created, the design uses **Server-Sent Events (SSE)** over a single long-lived HTTP connection.

```
GET /api/v1/notifications/stream
Accept: text/event-stream
```

Each event pushed on the stream:

```
event: notification
data: {"id":"b283218f-ea5a-4b7c-93a9-1f2f240d64b0","type":"placement","message":"CSX Corporation hiring","isRead":false,"createdAt":"2026-04-22T17:51:18Z"}
```

Why SSE over the alternatives:

- **SSE vs WebSockets**: notification delivery is one-directional (server to client). SSE runs over plain HTTP, reconnects automatically, and needs no separate protocol upgrade or extra infrastructure. WebSockets add bidirectional complexity the platform does not need here.
- **SSE vs polling**: polling wastes requests and adds latency. SSE pushes the moment data is ready, with one open connection per client.

Client actions (mark read, list) continue to use the REST endpoints above. The stream is read-only and used purely for live delivery. When the connection drops, the browser's `EventSource` reconnects and the client can reconcile missed items with a `GET /notifications?unread=true` call.

## Stage 2

### Storage Choice

For this platform a **relational database (PostgreSQL)** is the right primary store.

The data is highly structured and relational: students own notifications, notifications have a fixed set of typed fields, and the read/unread state is a simple boolean flag. The access patterns are well known in advance (list a student's notifications, filter by type, count unread). These are exactly the workloads relational engines and B-tree indexes are built for.

PostgreSQL also gives strong consistency and transactional guarantees, which matter when a single "Notify All" action writes for many students and clients are simultaneously marking items read. A document store would not buy us anything here because there is no schema variability, and the relational model keeps the notification-to-student relationship clean and enforceable with foreign keys.

### Schema

```sql
-- Students who receive notifications.
CREATE TABLE students (
    id          BIGSERIAL PRIMARY KEY,
    roll_no     VARCHAR(20) UNIQUE NOT NULL,
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enum constraining the kind of notification.
CREATE TYPE notification_type AS ENUM ('placement', 'result', 'event');

-- Notifications belonging to a student.
CREATE TABLE notifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id        BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    message           TEXT NOT NULL,
    is_read           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Indexes

The dominant query fetches a single student's unread notifications ordered by time. A composite partial index serves it directly:

```sql
-- Optimises: unread notifications for a student, newest/oldest first.
CREATE INDEX idx_notifications_student_unread
    ON notifications (student_id, created_at)
    WHERE is_read = FALSE;

-- Supports filtering a student's notifications by type.
CREATE INDEX idx_notifications_student_type
    ON notifications (student_id, notification_type, created_at);
```

### Problems as Data Volume Grows

As the platform reaches tens of thousands of students and millions of notifications, a few issues surface:

1. **Table bloat and slow scans.** A single `notifications` table with millions of rows makes unindexed queries do full scans. Solved by the composite indexes above and by always querying with `student_id` as the leading predicate.
2. **Unbounded growth.** Old notifications accumulate forever. Solved with a retention policy and **time-based partitioning** (e.g. monthly partitions on `created_at`) so old partitions can be dropped or archived cheaply.
3. **Write contention on "Notify All".** Inserting 50,000 rows at once can lock and slow reads. Solved with batched inserts and, longer term, by moving fan-out writes through a queue (covered in Stage 5).
4. **Index write cost.** Every index slows inserts. Solved by keeping indexes minimal and purpose-built rather than indexing every column.
5. **Hot unread counts.** Counting unread on every page load is expensive at scale. Solved by caching the count and/or maintaining a per-student counter (covered in Stage 4).

### Queries

These map directly to the Stage 1 endpoints.

```sql
-- List notifications: GET /api/v1/notifications (paginated, newest first)
SELECT id, notification_type, message, is_read, created_at
FROM notifications
WHERE student_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- List unread only: GET /api/v1/notifications?unread=true
SELECT id, notification_type, message, is_read, created_at
FROM notifications
WHERE student_id = $1 AND is_read = FALSE
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- Filter by type: GET /api/v1/notifications?type=placement
SELECT id, notification_type, message, is_read, created_at
FROM notifications
WHERE student_id = $1 AND notification_type = 'placement'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- Get one: GET /api/v1/notifications/{id}
SELECT id, notification_type, message, is_read, created_at
FROM notifications
WHERE id = $1 AND student_id = $2;

-- Mark one read: PATCH /api/v1/notifications/{id}
UPDATE notifications
SET is_read = TRUE
WHERE id = $1 AND student_id = $2;

-- Mark all read: POST /api/v1/notifications/read-all
UPDATE notifications
SET is_read = TRUE
WHERE student_id = $1 AND is_read = FALSE;

-- Unread count: GET /api/v1/notifications/unread-count
SELECT count(*) AS unread
FROM notifications
WHERE student_id = $1 AND is_read = FALSE;

-- Create one: POST /api/v1/notifications
INSERT INTO notifications (student_id, notification_type, message)
VALUES ($1, $2, $3)
RETURNING id, notification_type, message, is_read, created_at;
```

## Stage 3

The query under review:

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### Is the query accurate?

Functionally, yes. It returns the correct rows: all unread notifications for student 1042, oldest first. The result is correct. The problem is not correctness, it is performance and the use of `SELECT *`.

### Why is it slow?

With 50,000 students and 5,000,000 notifications, and assuming no supporting index:

- The planner has no index that matches `(student_id, is_read)`, so it falls back to a **sequential scan** of all 5,000,000 rows, testing the predicate on each one.
- After filtering it must **sort** the surviving rows to satisfy `ORDER BY created_at ASC`, which adds CPU and possibly disk spill.
- `SELECT *` pulls every column, including the large `message` text, inflating I/O even for rows the client may not need in full.

The cost is roughly **O(N)** in rows scanned (N = 5,000,000) plus an **O(k log k)** sort on the k matching rows. Every call re-scans the whole table.

### What I would change

Add a composite partial index that matches the predicate and the sort order, and stop selecting all columns:

```sql
CREATE INDEX idx_notifications_student_unread
    ON notifications (student_id, created_at)
    WHERE is_read = FALSE;
```

```sql
SELECT id, notification_type, message, is_read, created_at
FROM notifications
WHERE student_id = 1042 AND is_read = FALSE
ORDER BY created_at ASC
LIMIT 20;
```

With this index the planner does an **index range scan** that jumps straight to student 1042's unread rows, already ordered by `created_at`, so the sort disappears too. The likely cost drops from scanning 5,000,000 rows to touching only the handful that belong to that student, roughly **O(log N + k)**. Adding `LIMIT` with pagination caps the work per request further.

### Is "add indexes on every column" good advice?

No. Indexing every column is a poor strategy:

- **Indexes are not free.** Each one consumes storage and must be updated on every `INSERT`, `UPDATE`, and `DELETE`. With 5,000,000 rows and a heavy write path (Notify All), redundant indexes slow writes and bloat the database.
- **The planner only uses indexes that match query shapes.** An index on `message` or `is_read` alone does nothing for this query. What helps is a **composite index in the right column order** that matches the predicates and sort.
- The right approach is to index based on **actual query patterns**, favouring composite and partial indexes, not to blanket-index every column.

### Students who got a placement notification in the last 7 days

```sql
SELECT DISTINCT s.id, s.roll_no, s.name
FROM students s
JOIN notifications n ON n.student_id = s.id
WHERE n.notification_type = 'placement'
  AND n.created_at >= now() - INTERVAL '7 days';
```

This is supported efficiently by an index on the type and time:

```sql
CREATE INDEX idx_notifications_type_created
    ON notifications (notification_type, created_at);
```

## Stage 4

### The Problem

Notifications are fetched from the database on every page load, for every student. With a large active user base this means the same unread lists and counts are read from the database over and over, even though the data rarely changes between loads. The database becomes the bottleneck, latency rises, and the user experience degrades.

The goal is to cut the number of database reads on the hot path and serve repeated requests from somewhere cheaper. Below are the strategies, each with its tradeoffs.

### Strategy 1: Cache the notification data (Redis)

Cache each student's unread list and unread count in an in-memory store such as Redis, keyed by `student_id`. Reads hit Redis first and only fall through to the database on a miss. The cache entry is invalidated or updated when a notification is created or marked read.

- **Benefit:** removes the vast majority of repeated reads from the database; sub-millisecond lookups; the database load becomes roughly proportional to writes, not page loads.
- **Tradeoff:** introduces a cache-consistency problem. A stale entry can show a wrong count until invalidated. It adds operational complexity (another service to run and monitor) and memory cost. Needs a sensible TTL and explicit invalidation on writes.

### Strategy 2: Maintain a denormalised unread counter

Keep a per-student `unread_count` column (or a Redis counter) that is incremented on insert and decremented on mark-read, so the badge count never runs `count(*)` over the notifications table.

- **Benefit:** the most frequent request, the unread badge, becomes an O(1) lookup instead of an aggregate scan.
- **Tradeoff:** the counter must be kept exactly in sync with the underlying rows. Concurrent updates need atomic increments/decrements, and a drift between counter and reality requires a periodic reconciliation job.

### Strategy 3: Stop polling, push instead (SSE)

Rather than re-fetching on every page load, the client loads notifications once and then keeps a Server-Sent Events connection open (the mechanism chosen in Stage 1). New notifications are pushed as they happen, so no repeated full fetches are needed.

- **Benefit:** eliminates redundant reads entirely for an open session; data arrives in real time; the database is touched only when something actually changes.
- **Tradeoff:** long-lived connections consume server resources and need careful handling behind load balancers and proxies. On reconnect the client must reconcile any missed items with a single catch-up query.

### Strategy 4: Client-side caching with HTTP headers

Use `ETag`/`Last-Modified` and short-lived client caching so the browser can issue conditional requests. When nothing has changed the server replies `304 Not Modified` with no body.

- **Benefit:** cheap to add, reduces payload size and some server work without new infrastructure.
- **Tradeoff:** the request still reaches the server, so it reduces bandwidth more than database load. Best used together with Strategies 1–3, not on its own.

### Recommended Combination

Use SSE to remove repeated fetches during an active session (Strategy 3), back the initial load and reconnect catch-up with a Redis cache (Strategy 1), and keep a denormalised unread counter for the badge (Strategy 2). HTTP caching (Strategy 4) is a low-cost addition on top. Together they shift the workload from "read on every page load" to "read only when data changes", which is what protects the database at scale.

## Stage 5

The proposed implementation:

```
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)   # calls Email API
        save_to_db(student_id, message)   # DB insert
        push_to_app(student_id, message)  # real-time push
```

### Shortcomings of this implementation

1. **Synchronous and serial.** It processes 50,000 students one at a time in a single loop. The HR request blocks until the whole loop finishes, which can take minutes, and likely times out.
2. **No fault isolation.** If `send_email` throws or hangs for one student, the loop can stop and every student after that point gets nothing.
3. **No retries.** A transient failure (email provider blip, network timeout) is permanent for that student. There is no record of what failed.
4. **Tight coupling of independent concerns.** Email delivery, persistence, and in-app push are bound together in lock-step, so the slowest/least reliable step (email) dictates the speed and success of the others.
5. **Email API is a bottleneck and rate limit risk.** Hammering the email provider with 50,000 sequential calls invites throttling.
6. **Not idempotent.** If the operation is retried after a partial failure, students who already received the message may be emailed and saved again, causing duplicates.

### "send_email failed for 200 students midway" — what now?

In the current design those 200 failures are silently lost because there is no record of per-student status and no retry path. The fix is to make delivery **tracked and retryable**: each student's notification should have a status (`pending`, `sent`, `failed`), and only the failed ones should be retried, without touching the students who already succeeded.

### Should save-to-DB and send-email happen together?

**No, they should be decoupled.** They have different reliability profiles and different meanings:

- Saving to the database is fast, local, and under our control. It is the **source of truth** that the notification exists.
- Sending email goes through an external provider, is slower, and fails independently.

If they are coupled, a flaky email provider can block or roll back a database write that should have succeeded, and a successful save can be undone by an unrelated email failure. The correct order is to **persist first** (so the in-app notification is guaranteed and the record exists), then dispatch email **asynchronously** as a separate, retryable step that updates the delivery status. This way email failures never cost us the notification itself.

### Redesign: reliable and fast

Turn the synchronous loop into an **asynchronous, queue-based fan-out**:

1. The `notify_all` request does minimal work: it persists the notifications in a batch and enqueues one delivery job per student (or per batch), then returns immediately. HR gets an instant response.
2. A pool of **workers** consumes the queue in parallel, sending email and pushing in-app notifications. Parallelism gives speed; the queue gives buffering and backpressure so the email provider is not overwhelmed.
3. Each job is **retried with backoff** on transient failure. Jobs that exhaust retries land in a **dead-letter queue** for inspection. Only failed students are retried, never the whole batch.
4. Delivery is **idempotent**: each notification row carries a status, and a job marks it `sent` only on success, so reprocessing never produces duplicates.

### Revised Pseudocode

```
# Step 1: the API call returns fast. Persist, then enqueue.
function notify_all(student_ids: array, message: string):
    # Batch insert all notifications as the source of truth (status = 'pending').
    rows = build_notification_rows(student_ids, message, status = 'pending')
    batch_insert(rows)                       # single fast DB write, in chunks

    # Enqueue one delivery job per student for async processing.
    for student_id in student_ids:
        enqueue(delivery_queue, { student_id, message })

    return { accepted: true, count: length(student_ids) }


# Step 2: workers run in parallel, consuming the queue.
function delivery_worker():
    while true:
        job = dequeue(delivery_queue)
        try:
            push_to_app(job.student_id, job.message)   # in-app, real-time
            send_email(job.student_id, job.message)    # external, may fail
            mark_status(job.student_id, job.message, 'sent')
        catch error:
            if job.attempts < MAX_RETRIES:
                requeue_with_backoff(job)              # retry only this job
            else:
                mark_status(job.student_id, job.message, 'failed')
                move_to_dead_letter(job)               # for later inspection
```

This keeps the user-facing request fast (it just writes and enqueues), makes delivery reliable (retries, dead-letter, per-student status), and isolates failures so 200 email errors no longer block or lose the other 49,800 notifications.

## Stage 6

### Goal

Introduce a Priority Inbox that surfaces the top `n` most important unread notifications first (the example uses top 10). Priority is determined by a combination of **type weight** (placement > result > event) and **recency**.

The implementation lives in the `notification_app_be/` directory, is written in TypeScript, fetches live data from the notification API, and uses the logging middleware throughout. It does not hard-code or invent notifications, and it does not use a database.

### Priority Rule

Each notification is ranked by two keys:

1. **Type weight (primary):** `placement = 3`, `result = 2`, `event = 1`. A higher weight always ranks higher.
2. **Recency (tie-breaker):** within the same type, the more recent `Timestamp` ranks higher.

This keeps the requested ordering strict and deterministic (a placement always outranks a result, which always outranks an event), while recency decides order inside a tier. The logic is in `notification_app_be/priority.ts`.

### Selecting the Top N Efficiently

A naive approach sorts the entire list (`O(m log m)` for `m` notifications) every time. Since we only need the top `n` and new notifications keep arriving, the implementation uses a **bounded min-heap of size `n`** (`notification_app_be/topNHeap.ts`):

- The heap root is always the lowest-priority item currently in the top `n`.
- Each incoming notification is compared against the root. If it is higher priority, it replaces the root; otherwise it is discarded.
- Cost is **`O(log n)` per notification** and memory stays bounded at `n`, regardless of how many notifications stream in.

This is exactly what makes maintaining the top `n` efficient as new notifications keep coming: there is no full re-sort, only a cheap heap operation per arrival. To return the final list in display order, the heap contents (at most `n` items) are sorted once.

### Files

- `notification_app_be/types.ts` — notification and response types.
- `notification_app_be/priority.ts` — type weights, timestamp parsing, and the priority comparator.
- `notification_app_be/topNHeap.ts` — the bounded min-heap that maintains the top `n`.
- `notification_app_be/index.ts` — fetches from the API, runs the heap, logs each step via the middleware, and prints the priority inbox.

### Running

```
npx ts-node notification_app_be/index.ts
```

A valid bearer token must be present in the repository root `.env` as `ACCESS_TOKEN`. The screenshots of the output are in `notification_app_be/screenshots/`.
