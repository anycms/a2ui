// Zero-dependency reactive runtime: batch, dependency tracking, and the
// ReactiveNode base class shared by Signal / EventSource / Computed.
//
// Two primitive shapes are required by the A2UI renderer guide §3:
//   - discrete event streams   (EventSource, pub/sub, no replay)
//   - stateful streams / signals (Signal/Computed, carry a current value)
// A clear unsubscribe mechanism is mandatory to avoid leaks.

/** A teardown handle. Idempotent: unsubscribing twice is a no-op. */
export interface Subscription {
  unsubscribe(): void;
}

/** An object that owns resources it must release. */
export interface Disposable {
  dispose(): void;
}

export type Listener<T> = (value: T) => void;

// ---------------------------------------------------------------------------
// Batching
// ---------------------------------------------------------------------------

let batchDepth = 0;
let pendingNotifiers: Array<() => void> = [];

/**
 * Run `fn`, deferring all reactive notifications until it returns. Multiple
 * updates to the same node collapse into a single notification. Matches the
 * A2UI requirement that a renderer not repaint until a full message list is
 * applied (extension spec: "SHOULD NOT repaint until all messages processed").
 */
export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && pendingNotifiers.length > 0) {
      const queued = pendingNotifiers;
      pendingNotifiers = [];
      for (const run of queued) run();
    }
  }
}

export function isInBatch(): boolean {
  return batchDepth > 0;
}

// ---------------------------------------------------------------------------
// Dependency tracking
// ---------------------------------------------------------------------------

type DepSet = Set<ReactiveNode>;
let trackingStack: DepSet[] = [];

/**
 * Run `fn` while collecting every ReactiveNode read (via `.value` /
 * `trackSelf`) into a dependency set. Returns that set.
 */
export function runTracking<T>(fn: () => T): DepSet {
  const deps: DepSet = new Set();
  trackingStack.push(deps);
  try {
    fn();
  } finally {
    trackingStack.pop();
  }
  return deps;
}

/** Read a value without registering it as a dependency of the current scope. */
export function untracked<T>(fn: () => T): T {
  const saved = trackingStack;
  trackingStack = [];
  try {
    return fn();
  } finally {
    trackingStack = saved;
  }
}

/** Whether a dependency-tracking scope is currently active. */
export function isTracking(): boolean {
  return trackingStack.length > 0;
}

// ---------------------------------------------------------------------------
// ReactiveNode base
// ---------------------------------------------------------------------------

/**
 * Base for all reactive sources. Provides batched, deduplicated notification
 * and dependency-tracking registration.
 */
export abstract class ReactiveNode<T = unknown> {
  private pending = false;

  /** Subclasses push the current value to all listeners here. */
  protected abstract runNotify(): void;

  /** Enqueue (or run) a notification, deduped within a batch. */
  protected notify(): void {
    if (batchDepth > 0) {
      if (this.pending) return;
      this.pending = true;
      const node = this;
      pendingNotifiers.push(() => {
        node.pending = false;
        node.runNotify();
      });
    } else {
      this.runNotify();
    }
  }

  /** Register this node as a dependency of the active tracking scope. */
  protected trackSelf(): void {
    if (trackingStack.length > 0) {
      trackingStack[trackingStack.length - 1].add(this);
    }
  }

  /** Subscribe to future changes only (no replay). Used for chaining. */
  abstract onUpdate(listener: Listener<T>): Subscription;
}
