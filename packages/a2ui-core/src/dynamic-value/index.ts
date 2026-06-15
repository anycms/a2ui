import type { Computed, Listener, Subscription } from '../reactive';
import { resolvePointer, pointerFromTokens } from '../json-pointer';
import type { DataModel } from '../datamodel';

/**
 * Context required to resolve a dynamic value (literal | {path} | {call}).
 * Implemented by DataContext / ComponentContext; passed into functions that
 * need to evaluate bindings against a data scope.
 */
export interface DynamicValueContext {
  readonly dataModel: DataModel;
  /** Absolute base-scope pointer; relative paths resolve against it. */
  readonly path: string;
  readonly invoker: FunctionInvoker;
}

/**
 * Invokes a catalog function and returns a reactive result. Implemented by
 * the functions registry; dynamic-value depends only on this interface (no
 * import cycle with the concrete functions module).
 */
export interface FunctionInvoker {
  invoke(call: string, args: Record<string, unknown>, ctx: DynamicValueContext): Computed<unknown>;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isDataBinding(v: unknown): v is { path: string } {
  return isPlainObject(v) && typeof v.path === 'string';
}
function isFunctionCall(v: unknown): v is { call: string; args?: Record<string, unknown> } {
  return isPlainObject(v) && typeof v.call === 'string';
}

function resolvePointerIn(ctx: DynamicValueContext, pointer: string): string {
  return pointerFromTokens(resolvePointer(pointer, ctx.path));
}

/** Resolve a dynamic value to its current (snapshot) value. */
export function resolveDynamicValue(v: unknown, ctx: DynamicValueContext): unknown {
  if (!isPlainObject(v)) return v; // primitive or array (arrays are literal)
  if (isDataBinding(v)) {
    return ctx.dataModel.get(resolvePointerIn(ctx, v.path));
  }
  if (isFunctionCall(v)) {
    return ctx.invoker.invoke(v.call, v.args ?? {}, ctx).value;
  }
  return v; // literal config object
}

/** Subscribe to a dynamic value: {path} tracks the model; literals/calls resolve once or reactively. */
export function subscribeDynamicValue(
  v: unknown,
  ctx: DynamicValueContext,
  cb: Listener<unknown>,
): Subscription {
  if (!isPlainObject(v)) {
    cb(v);
    return { unsubscribe() {} };
  }
  if (isDataBinding(v)) {
    return ctx.dataModel.subscribe(resolvePointerIn(ctx, v.path), cb);
  }
  if (isFunctionCall(v)) {
    const computed = ctx.invoker.invoke(v.call, v.args ?? {}, ctx);
    const sub = computed.subscribe(cb);
    return {
      unsubscribe() {
        sub.unsubscribe();
        computed.dispose();
      },
    };
  }
  cb(v);
  return { unsubscribe() {} };
}

/**
 * Recursively resolve a function-call `args` object. Each value that is itself
 * a dynamic value (path/call) is resolved; arrays are mapped; plain config
 * objects are recursed. Runs inside a Computed (in the invoker) so dynamic
 * bindings register as dependencies.
 */
export function resolveArgs(
  args: Record<string, unknown>,
  ctx: DynamicValueContext,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, raw] of Object.entries(args)) {
    out[k] = resolveArgValue(raw, ctx);
  }
  return out;
}

function resolveArgValue(v: unknown, ctx: DynamicValueContext): unknown {
  if (Array.isArray(v)) {
    return v.map((item) => resolveArgValue(item, ctx));
  }
  if (!isPlainObject(v)) {
    return v; // primitive
  }
  if (isDataBinding(v) || isFunctionCall(v)) {
    return resolveDynamicValue(v, ctx);
  }
  // plain config object: recurse into its values
  const out: Record<string, unknown> = {};
  for (const [k, raw] of Object.entries(v)) out[k] = resolveArgValue(raw, ctx);
  return out;
}
