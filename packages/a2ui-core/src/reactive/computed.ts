import {
  ReactiveNode,
  type Disposable,
  type Listener,
  type Subscription,
  runTracking,
} from './runtime';

/**
 * A derived reactive value. Recomputes when any tracked dependency changes,
 * and pushes the new value to subscribers. Notifies are batched and deduped.
 *
 * Computed subscribes to its dependencies eagerly on construction; call
 * `dispose()` to release those subscriptions when no longer needed (e.g. when
 * a component binding is torn down). Required for `formatString` per the
 * renderer guide, which must return a reactive computed stream.
 */
export class Computed<T> extends ReactiveNode<T> implements Disposable {
  private _value!: T;
  private readonly compute: () => T;
  private depSubs: Subscription[] = [];
  private readonly listeners = new Set<Listener<T>>();

  constructor(compute: () => T) {
    super();
    this.compute = compute;
    this.recompute();
  }

  private recompute(): void {
    for (const s of this.depSubs) s.unsubscribe();
    this.depSubs = [];
    const deps = runTracking(() => {
      this._value = this.compute();
    });
    for (const d of deps) {
      this.depSubs.push(d.onUpdate(() => this.invalidate()));
    }
  }

  private invalidate(): void {
    this.recompute();
    this.notify();
  }

  get value(): T {
    this.trackSelf();
    return this._value;
  }

  protected runNotify(): void {
    const v = this._value;
    for (const l of [...this.listeners]) l(v);
  }

  subscribe(listener: Listener<T>): Subscription {
    this.listeners.add(listener);
    listener(this._value);
    return { unsubscribe: () => this.listeners.delete(listener) };
  }

  onUpdate(listener: Listener<T>): Subscription {
    this.listeners.add(listener);
    return { unsubscribe: () => this.listeners.delete(listener) };
  }

  dispose(): void {
    for (const s of this.depSubs) s.unsubscribe();
    this.depSubs = [];
    this.listeners.clear();
  }
}
