// Tracks which notifications a user has already viewed. The set of seen IDs is
// persisted in localStorage so the new/viewed distinction survives reloads,
// satisfying the requirement to distinguish new from already-viewed items.

const STORAGE_KEY = "viewed_notification_ids";

// Reads the set of viewed notification IDs from localStorage.
export function getViewedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

// Marks the given notification IDs as viewed and persists the updated set.
export function markViewed(ids: string[]): void {
  const current = getViewedIds();
  ids.forEach((id) => current.add(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...current]));
}
