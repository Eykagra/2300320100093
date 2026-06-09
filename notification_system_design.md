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
