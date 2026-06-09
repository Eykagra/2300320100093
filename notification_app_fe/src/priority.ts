import { Notification } from "./types";

// Weight per notification type: placement outranks result, which outranks event.
const TYPE_WEIGHT: Record<string, number> = {
  placement: 3,
  result: 2,
  event: 1,
};

// Returns the weight for a notification type, defaulting to 0 for unknowns.
function typeWeight(type: string): number {
  return TYPE_WEIGHT[type.toLowerCase()] ?? 0;
}

// Parses the API timestamp ("2026-04-22 17:51:30") into epoch milliseconds.
function parsedTime(timestamp: string): number {
  const ms = Date.parse(timestamp.replace(" ", "T") + "Z");
  return Number.isNaN(ms) ? 0 : ms;
}

// Orders notifications by priority: type weight first, then most recent.
export function sortByPriority(items: Notification[]): Notification[] {
  return [...items].sort((a, b) => {
    const weightDiff = typeWeight(b.Type) - typeWeight(a.Type);
    if (weightDiff !== 0) {
      return weightDiff;
    }
    return parsedTime(b.Timestamp) - parsedTime(a.Timestamp);
  });
}

// Returns the top "n" notifications by priority.
export function topN(items: Notification[], n: number): Notification[] {
  return sortByPriority(items).slice(0, n);
}
