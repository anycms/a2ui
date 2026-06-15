import { ReactiveNode, type Listener, type Subscription } from './runtime';

/**
 * A discrete event stream (pub/sub). No current value, no replay — unlike
 * Signal. Used for lifecycle events (onSurfaceCreated, onAction) and other
 * one-shot notifications.
 *
 * Within a `batch()`, multiple `emit()` calls collapse: listeners are notified
 * once with the last emitted value.
 */
export class EventSource<T> extends ReactiveNode<T> {
  private lastEmitted: T | undefined = undefined;
  private hasLast = false;
  private readonly listeners = new Set<Listener<T>>();

  emit(value: T): void {
    this.lastEmitted = value;
    this.hasLast = true;
    this.notify();
  }

  protected runNotify(): void {
    if (!this.hasLast) return;
    const v = this.lastEmitted as T;
    for (const l of [...this.listeners]) l(v);
  }

  /** Subscribe to emitted events. No replay (events are discrete). */
  subscribe(listener: Listener<T>): Subscription {
    this.listeners.add(listener);
    return { unsubscribe: () => this.listeners.delete(listener) };
  }

  onUpdate(listener: Listener<T>): Subscription {
    return this.subscribe(listener);
  }
}
