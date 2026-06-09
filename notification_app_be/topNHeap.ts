import { Notification } from "./types";
import { compareByPriority } from "./priority";

// A bounded min-heap that retains only the top "n" highest priority
// notifications. The heap root is always the lowest priority item currently
// held, so when a new item arrives we only need to compare it against the
// root to decide whether it belongs in the top "n".
//
// This is how the top "n" is maintained efficiently as new notifications keep
// streaming in: each incoming notification costs O(log n) instead of
// re-sorting the entire collection, and memory stays bounded at n items.
export class TopNHeap {
  private heap: Notification[] = [];

  constructor(private readonly capacity: number) {}

  // Considers a single notification for inclusion in the top "n".
  push(item: Notification): void {
    if (this.heap.length < this.capacity) {
      this.heap.push(item);
      this.bubbleUp(this.heap.length - 1);
      return;
    }

    // Heap is full. Only replace the root if the new item ranks higher than
    // the current lowest-priority item (the root).
    if (this.isHigherPriority(item, this.heap[0])) {
      this.heap[0] = item;
      this.bubbleDown(0);
    }
  }

  // Returns the retained notifications sorted from highest to lowest priority.
  values(): Notification[] {
    return [...this.heap].sort(compareByPriority);
  }

  // True when "a" is higher priority than "b".
  private isHigherPriority(a: Notification, b: Notification): boolean {
    return compareByPriority(a, b) < 0;
  }

  // Restores the min-heap order by moving a node up toward the root.
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      // In a min-heap the parent must be lower priority than the child.
      if (this.isHigherPriority(this.heap[parent], this.heap[index])) {
        break;
      }
      this.swap(parent, index);
      index = parent;
    }
  }

  // Restores the min-heap order by moving a node down away from the root.
  private bubbleDown(index: number): void {
    const size = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let lowest = index;

      if (left < size && this.isHigherPriority(this.heap[lowest], this.heap[left])) {
        lowest = left;
      }
      if (right < size && this.isHigherPriority(this.heap[lowest], this.heap[right])) {
        lowest = right;
      }
      if (lowest === index) {
        break;
      }
      this.swap(lowest, index);
      index = lowest;
    }
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}
