// Shape of a single notification as returned by the notification API.
export interface Notification {
  ID: string;
  Type: string;
  Message: string;
  Timestamp: string;
}

// Shape of the notification API response body.
export interface NotificationResponse {
  notifications: Notification[];
}
