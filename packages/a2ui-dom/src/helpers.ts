import { ComponentContext, type Catalog, type ChildNodeRef, type ComponentModel, type SurfaceModel } from '@anycms/a2ui-core';
import type { DomComponentRegistry, DomNodeMount } from './types';

// --- style maps (Leaf-Margin strategy: leaves carry 8px margin; containers flush) ---
// Mirrors packages/a2ui-react/src/components.tsx exactly.

/** Margin applied to leaf components. */
export const LEAF_MARGIN = 8;

export const JUSTIFY: Readonly<Record<string, string>> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  spaceBetween: 'space-between',
  spaceAround: 'space-around',
  spaceEvenly: 'space-evenly',
  stretch: 'stretch',
};

export const ALIGN: Readonly<Record<string, string>> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

export const TEXT_SIZE: Readonly<Record<string, number>> = {
  h1: 2.5, h2: 2, h3: 1.75, h4: 1.5, h5: 1.25, caption: 0.8, body: 1,
};

export const IMAGE_FIT: Readonly<Record<string, string>> = {
  contain: 'contain', cover: 'cover', fill: 'fill', none: 'none', scaleDown: 'scale-down',
};

export const TEXTFIELD_TYPE: Readonly<Record<string, string>> = {
  shortText: 'text', longText: 'text', number: 'number', obscured: 'password',
};

/** Button action payload — mirrors the React reference ButtonView handler. */
export type ButtonAction =
  | { event?: { name: string; context?: Record<string, unknown> } }
  | { functionCall?: { call: string; args?: Record<string, unknown> } }
  | undefined;

/**
 * Extract a bound `{path}` from a component property at event time, for
 * two-way write-back. Reads the raw (un-resolved) property so it always
 * reflects the current binding.
 */
export function boundPath(ctx: ComponentContext, key = 'value'): string | null {
  const v = ctx.componentModel.properties[key];
  if (v && typeof v === 'object' && 'path' in v) {
    const p = (v as { path?: unknown }).path;
    if (typeof p === 'string') return p;
  }
  return null;
}

/** Dispatch a button action: `event` → resolve context + dispatchAction; `functionCall` → resolveDynamicValue. */
export function dispatchButtonAction(ctx: ComponentContext, action: ButtonAction): void {
  if (action && 'event' in action && action.event) {
    const context: Record<string, unknown> = {};
    if (action.event.context) {
      for (const [k, v] of Object.entries(action.event.context)) context[k] = ctx.resolveDynamicValue(v);
    }
    ctx.dispatchAction({ name: action.event.name, context });
  } else if (action && 'functionCall' in action && action.functionCall) {
    ctx.resolveDynamicValue(action.functionCall);
  }
}

/** First failing check's message, or null if there is none. Mirrors React presets. */
export function firstErrorMessage(
  checks: ReadonlyArray<{ valid: boolean; message: string }> | undefined,
): string | null {
  return checks?.find((c) => !c.valid && c.message)?.message ?? null;
}

/**
 * Create a hidden error element for surfacing the first failing check message.
 * Shared by all input leaves (TextField, CheckBox, Slider, ChoicePicker,
 * DateTimeInput). Initially hidden (`display: 'none'`); the owning View toggles
 * it via {@link applyCheckError}.
 */
export function createCheckErrorEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'a2ui-check-error';
  el.style.color = '#dc2626';
  el.style.fontSize = '0.8em';
  el.style.marginTop = '2px';
  el.style.display = 'none';
  return el;
}

/**
 * Show/hide a {@link createCheckErrorEl} from a component's resolved checks.
 * Pass the props; this reads `checks` and applies the first error message.
 */
export function applyCheckError(
  el: HTMLDivElement,
  checks: ReadonlyArray<{ valid: boolean; message: string }> | undefined,
): void {
  const msg = firstErrorMessage(checks);
  if (msg) {
    el.style.display = 'block';
    el.textContent = msg;
  } else {
    el.style.display = 'none';
    el.textContent = '';
  }
}

/** Apply a Button variant as inline styles. Mirrors React's `buttonVariantStyle`. */
export function applyButtonVariant(el: HTMLElement, variant: string): void {
  if (variant === 'primary') {
    el.style.background = '#2563eb';
    el.style.color = '#fff';
    el.style.border = 'none';
  } else if (variant === 'borderless') {
    el.style.background = 'transparent';
    el.style.border = 'none';
    el.style.color = '#2563eb';
  } else {
    el.style.background = '#f0f0f0';
    el.style.border = '1px solid #ccc';
  }
}

// --- mounting & reconciliation (the vanilla equivalent of React's <A2uiNode>) ---

const PLACEHOLDER_CLASS = 'a2ui-pending';

/**
 * Mount one component by ref (id + basePath). This owns a SINGLE live DOM slot
 * and reconciles it against the components model on every structural event.
 *
 * IMPORTANT: core's `EventSource` collapses multiple `emit()` calls within a
 * single `batch()` into one notification carrying only the LAST value. A
 * `processMessages` call batches, so several `onCreated`/`onDeleted` events
 * (e.g. a type-change rebuild + a sibling add) fire the listeners once with an
 * unrelated payload. We therefore MUST NOT trust the event payload — on any
 * structural event we re-evaluate THIS slot's state against the model (present?
 * same type?) and act. This mirrors how the React surface re-walks the tree on
 * any structural change, but localized per slot.
 */
export function mountChild(
  surface: SurfaceModel,
  ref: ChildNodeRef,
  registry: DomComponentRegistry,
  catalog: Catalog,
): DomNodeMount {
  let current: DomNodeMount | null = null;
  /** Type currently rendered into the slot (real mount OR unknown-type placeholder). */
  let liveType: string | null = null;
  let liveEl: HTMLElement = document.createElement('div');
  liveEl.className = PLACEHOLDER_CLASS;

  /** Make `el` the element occupying this slot, swapping the previous one in place. */
  function present(el: HTMLElement): void {
    if (el === liveEl) return;
    if (liveEl.parentNode) liveEl.parentNode.replaceChild(el, liveEl);
    liveEl = el;
  }

  function showPlaceholder(): void {
    const ph = document.createElement('div');
    ph.className = PLACEHOLDER_CLASS;
    current = null;
    liveType = null;
    present(ph);
  }

  function mountFresh(component: ComponentModel): void {
    const domComp = registry.get(component.type);
    if (!domComp) {
      const err = document.createElement('div');
      err.className = 'a2ui-unknown';
      err.textContent = `Unknown component: ${component.type}`;
      current = null;
      liveType = component.type;
      present(err);
      return;
    }
    const ctx = new ComponentContext({
      surface,
      componentModel: component,
      basePath: ref.basePath,
      invoker: catalog.functions,
    });
    current = domComp(ctx, (r: ChildNodeRef) => mountChild(surface, r, registry, catalog));
    liveType = component.type;
    present(current.element);
  }

  /** Reconcile this slot against the current model state (idempotent). */
  function sync(): void {
    const component = surface.componentsModel.get(ref.id);
    const wantType = component?.type ?? null;
    if (wantType === liveType) return; // already showing this type; content updates flow via propsStream
    current?.dispose();
    current = null;
    if (!component) showPlaceholder();
    else mountFresh(component);
  }

  sync();

  // Any structural event re-syncs; the payload is intentionally ignored (see above).
  const createdSub = surface.componentsModel.onCreated.subscribe(() => sync());
  const deletedSub = surface.componentsModel.onDeleted.subscribe(() => sync());

  return {
    get element(): HTMLElement {
      return liveEl;
    },
    update(): void {
      // Children self-update via their own propsStream subscription; nothing to do here.
    },
    dispose(): void {
      createdSub.unsubscribe();
      deletedSub.unsubscribe();
      current?.dispose();
      current = null;
    },
  };
}

/** Stable key for a ChildNodeRef — disambiguates template items by basePath. */
export function childKey(ref: ChildNodeRef): string {
  return `${ref.basePath}::${ref.id}`;
}

/**
 * Keyed reconciliation: given a new list of refs and a function to mount a
 * fresh child, reconcile the cache + DOM in place. Reuses existing mounts
 * (preserving their DOM/focus/state), creates new ones, disposes removed
 * ones, and reorders DOM elements via `appendChild`-in-order (which moves
 * already-present nodes to their correct position).
 *
 * Each container View keeps its own `Map<string, DomNodeMount>` and calls this
 * on every `update`.
 */
export function reconcileChildren(
  containerEl: HTMLElement,
  cache: Map<string, DomNodeMount>,
  refs: ReadonlyArray<ChildNodeRef>,
  mountFn: (ref: ChildNodeRef) => DomNodeMount,
): void {
  const newKeys = new Set(refs.map(childKey));

  // Dispose + remove mounts whose key is gone.
  for (const [key, m] of cache) {
    if (!newKeys.has(key)) {
      if (m.element.parentNode === containerEl) containerEl.removeChild(m.element);
      m.dispose();
      cache.delete(key);
    }
  }

  // Create new mounts and reorder all to match refs order.
  for (const ref of refs) {
    const key = childKey(ref);
    let m = cache.get(key);
    if (!m) {
      m = mountFn(ref);
      cache.set(key, m);
    }
    containerEl.appendChild(m.element);
  }
}
