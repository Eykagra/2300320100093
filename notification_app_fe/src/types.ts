// A single notification as returned by the notification API.
export interface Notification {
  ID: string;
  Type: string;
  Message: string;
  Timestamp: string;
}

// Response envelope returned by the notification API.
export interface NotificationResponse {
  notifications: Notification[];
}

// The notification types supported by the API filter.
export type NotificationType = "Event" | "Result" | "Placement";
