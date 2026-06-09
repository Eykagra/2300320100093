// Converts the API timestamp ("2026-04-22 17:51:30") into a human friendly
// relative string such as "5m ago" or "3d ago", falling back to the original
// timestamp if it cannot be parsed.
export function relativeTime(timestamp: string): string {
  const ms = Date.parse(timestamp.replace(" ", "T") + "Z");
  if (Number.isNaN(ms)) {
    return timestamp;
  }

  const diffSeconds = Math.floor((Date.now() - ms) / 1000);

  if (diffSeconds < 60) {
    return "just now";
  }
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `${weeks}w ago`;
  }
  return new Date(ms).toLocaleDateString();
}
