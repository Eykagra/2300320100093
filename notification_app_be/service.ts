import { Log } from "../logging_middleware/logger";
import { Notification, NotificationResponse } from "./types";
import { TopNHeap } from "./topNHeap";

// Source data endpoint. This is the upstream data provider that the
// application consumes internally; clients never call it directly.
const NOTIFICATIONS_URL =
  "http://4.224.186.213/evaluation-service/notifications";

const TOKEN = process.env.ACCESS_TOKEN?.trim();

// Fetches the full notification list from the protected notification API.
export async function fetchNotifications(): Promise<Notification[]> {
  await Log("backend", "info", "service", "fetching notifications from API");

  const response = await fetch(NOTIFICATIONS_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    await Log(
      "backend",
      "error",
      "service",
      `notification fetch failed with status ${response.status}`
    );
    throw new Error(`Request failed with status ${response.status}`);
  }

  const body = (await response.json()) as NotificationResponse;
  const list = body.notifications ?? [];

  await Log(
    "backend",
    "info",
    "service",
    `fetched ${list.length} notifications`
  );

  return list;
}

// Streams every notification through a bounded min-heap to compute the top N
// by priority without sorting the entire collection.
export function selectTopN(
  notifications: Notification[],
  n: number
): Notification[] {
  const heap = new TopNHeap(n);
  for (const item of notifications) {
    heap.push(item);
  }
  return heap.values();
}
