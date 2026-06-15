import type { ComponentContext } from '@anycms/a2ui-core';

/**
 * Extract a bound {path} from a component property (for two-way binding).
 * Mirrors the vanilla renderer's boundPath() helper.
 */
export function boundPath(ctx: ComponentContext, key = 'value'): string | null {
  const v = ctx.componentModel.properties[key];
  if (v && typeof v === 'object' && 'path' in v) {
    const p = (v as { path?: unknown }).path;
    if (typeof p === 'string') return p;
  }
  return null;
}

/** A2UI button action payload: either a client event or a function call. */
export type ButtonAction =
  | { event?: { name: string; context?: Record<string, unknown> } }
  | { functionCall?: { call: string; args?: Record<string, unknown> } }
  | undefined;

/** Dispatch a button action (event or functionCall) against the surface. */
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
