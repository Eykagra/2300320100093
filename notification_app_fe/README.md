# Notification App Frontend

Responsive React + TypeScript + Material UI application for the campus notification platform. Runs exclusively on `http://localhost:3000`.

## Pages

- **All Notifications** (`/`) — every notification with a type filter. New (unviewed) items are highlighted until seen.
- **Priority Inbox** (`/priority`) — the top `n` notifications by priority (placement > result > event, then recency), with a type filter and a selectable count (top 10/15/20).

## Setup

```
npm install
```

Add a valid bearer token to `notification_app_fe/.env`:

```
VITE_ACCESS_TOKEN=<token>
```

## Run

```
npm run dev
```

The app starts on `http://localhost:3000`.

## Notes

- New vs already-viewed notifications are tracked in `localStorage`.
- All API calls and significant page events are sent through the logging middleware.
- Styling uses Material UI only.
