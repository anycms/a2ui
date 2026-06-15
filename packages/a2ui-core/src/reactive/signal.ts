import { ReactiveNode, type Listener, type Subscription } from './runtime';

/**
 * A stateful reactive cell with an initial value. Reading `.value` inside a
 * tracking scope registers a dependency; writing notifies subscribers. Behaves
 * like a BehaviorSubject: `subscribe` replays the current value immediately,
 * while `onUpdate` listens to future changes only (used for chaining).
 */
export class Signal<T> extends ReactiveNode<T> {
  private _value: T;
  private readonly listeners = new Set<Listener<T>>();

  constructor(initialValue: T) {
    super();
    this._value = initialValue;
  }

  get value(): T {
    this.trackSelf();
    return this._value;
  }

  set value(next: T) {
    if (Object.is(next, this._value)) return;
    this._value = next;
    this.notify();
  }

  /** Set the value and notify even if Object.is-equal to the current value
   * (e.g. when a nested mutation left the reference unchanged). */
  setForce(next: T): void {
    this._value = next;
    this.notify();
  }

  protected runNotify(): void {
    const v = this._value;
    for (const l of [...this.listeners]) l(v);
  }

  /** Subscribe with immediate replay of the current value. */
  subscribe(listener: Listener<T>): Subscription {
    this.listeners.add(listener);
    listener(this._value);
    return { unsubscribe: () => this.listeners.delete(listener) };
  }

  /** Subscribe to future changes only (no replay). */
  onUpdate(listener: Listener<T>): Subscription {
    this.listeners.add(listener);
    return { unsubscribe: () => this.listeners.delete(listener) };
  }
}
