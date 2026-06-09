import { Notification } from "./types";

// Weight assigned to each notification type. A higher number means a more
// important notification. Placement outranks Result, which outranks Event.
const TYPE_WEIGHT: Record<string, number> = {
  placement: 3,
  result: 2,
  event: 1,
};

// Returns the weight for a notification type, defaulting to 0 for any
// unrecognised type so it sinks to the bottom of the ranking.
export function typeWeight(type: string): number {
  return TYPE_WEIGHT[type.toLowerCase()] ?? 0;
}

// Parses the API timestamp ("2026-04-22 17:51:30") into epoch milliseconds.
// The space is replaced with "T" and a "Z" appended so it parses as UTC.
export function parsedTime(timestamp: string): number {
  const ms = Date.parse(timestamp.replace(" ", "T") + "Z");
  return Number.isNaN(ms) ? 0 : ms;
}

// Compares two notifications by priority.
// Primary key: type weight (higher first). Tie-breaker: more recent first.
// Returns a negative number when "a" is higher priority than "b".
export function compareByPriority(a: Notification, b: Notification): number {
  const weightDiff = typeWeight(b.Type) - typeWeight(a.Type);
  if (weightDiff !== 0) {
    return weightDiff;
  }
  return parsedTime(b.Timestamp) - parsedTime(a.Timestamp);
}
