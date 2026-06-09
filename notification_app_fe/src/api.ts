import { Log } from "./logger";
import { Notification, NotificationResponse } from "./types";

const NOTIFICATIONS_URL = "/evaluation-service/notifications";
const TOKEN = import.meta.env.VITE_ACCESS_TOKEN?.trim();

// Options accepted by the notification fetch, mapped to the API's query params.
export interface FetchOptions {
  limit?: number;
  page?: number;
  notificationType?: string;
}

// Fetches notifications from the API, applying the optional limit, page, and
// notification_type query parameters supported by the endpoint.
export async function fetchNotifications(
  options: FetchOptions = {}
): Promise<Notification[]> {
  const params = new URLSearchParams();

  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options.page !== undefined) {
    params.set("page", String(options.page));
  }
  if (options.notificationType) {
    params.set("notification_type", options.notificationType);
  }

  const query = params.toString();
  const url = query ? `${NOTIFICATIONS_URL}?${query}` : NOTIFICATIONS_URL;

  await Log("frontend", "info", "api", `fetching notifications ${query}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    await Log(
      "frontend",
      "error",
      "api",
      `notification fetch failed with status ${response.status}`
    );
    throw new Error(`Request failed with status ${response.status}`);
  }

  const body = (await response.json()) as NotificationResponse;
  return body.notifications ?? [];
}
