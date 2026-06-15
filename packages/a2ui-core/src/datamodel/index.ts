import { isTracking, Signal, type Listener, type Subscription } from '../reactive';
import {
  get as ptrGet,
  set as ptrSet,
  parsePointer,
  pointerFromTokens,
  isRelated,
} from '../json-pointer';

/**
 * The per-surface data store. Holds a single mutable JSON root and provides
 * JSON-Pointer get/set plus reactive path subscriptions.
 *
 * Reactivity bridge: when `get()` runs inside a tracking scope (e.g. a
 * Computed), it lazily materializes a per-path Signal proxy and reads it, so
 * the path registers as a dependency. `set()` then syncs & notifies every
 * related proxy — exact match, ancestors (bubble-up), descendants
 * (cascade-down) — driving dependent Computeds (formatString, formatters) to
 * recompute. This matches renderer_guide.md §DataModel "Granular Reactivity"
 * and the bubble & cascade notification strategy.
 */
export class DataModel {
  private root: unknown = {};
  private readonly pathSignals = new Map<string, Signal<unknown>>();

  get(path: string): unknown {
    const tokens = parsePointer(path);
    const value = ptrGet(this.root, tokens);
    if (isTracking()) {
      // register this path as a dependency of the active computation
      void this.ensureSignal(tokens).value;
    }
    return value;
  }

  set(path: string, value: unknown): void {
    const tokens = parsePointer(path);
    if (tokens.length === 0) {
      this.root = value;
    } else {
      ptrSet(this.root as object, tokens, value);
    }
    // sync & notify related path signals (exact / ancestors / descendants).
    // setForce: a nested mutation may leave an ancestor reference unchanged,
    // but its content did change, so subscribers must be notified.
    for (const [key, sig] of this.pathSignals) {
      if (isRelated(parsePointer(key), tokens)) {
        sig.setForce(ptrGet(this.root, parsePointer(key)));
      }
    }
  }

  subscribe<T>(path: string, onChange: Listener<T>): Subscription {
    const tokens = parsePointer(path);
    const sig = this.ensureSignal(tokens);
    return sig.subscribe(onChange as Listener<unknown>);
  }

  /** Snapshot the entire root (for inspection / sendDataModel). */
  snapshot(): unknown {
    return this.root;
  }

  /** Replace root wholesale (the path '/' semantics of updateDataModel). */
  replaceAll(value: unknown): void {
    this.set('', value);
  }

  private ensureSignal(tokens: string[]): Signal<unknown> {
    const key = pointerFromTokens(tokens);
    let sig = this.pathSignals.get(key);
    if (!sig) {
      sig = new Signal<unknown>(ptrGet(this.root, tokens));
      this.pathSignals.set(key, sig);
    }
    return sig;
  }

  dispose(): void {
    this.pathSignals.clear();
    this.root = {};
  }
}
