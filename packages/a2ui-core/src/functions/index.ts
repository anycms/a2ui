import { Computed } from '../reactive';
import { resolveArgs } from '../dynamic-value';
import type { DynamicValueContext, FunctionInvoker } from '../dynamic-value';
import { evalFormatString, stringify } from './format-string';

/** The framework-agnostic API of a catalog function (renderer_guide.md §4). */
export interface FunctionApi {
  readonly name: string;
  readonly returnType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any' | 'void';
  readonly schema: unknown;
}

/**
 * A function implementation. `execute` receives *resolved* static args (dynamic
 * bindings already evaluated by the registry) plus the DataContext. It returns
 * a static value; the registry wraps it in a Computed so it recomputes when
 * any dynamic argument changes.
 */
export interface FunctionImplementation extends FunctionApi {
  execute(args: Record<string, unknown>, ctx: DynamicValueContext): unknown;
}

/**
 * Registry of function implementations; implements FunctionInvoker so the
 * dynamic-value layer can resolve `{call}` bindings without importing this
 * module (no cycle). `invoke` returns a Computed: execute runs lazily inside
 * it, and every dynamic arg registers as a dependency automatically.
 */
export class FunctionRegistry implements FunctionInvoker {
  private readonly fns = new Map<string, FunctionImplementation>();

  constructor(impls: FunctionImplementation[] = []) {
    for (const f of impls) this.fns.set(f.name, f);
  }

  register(impl: FunctionImplementation): this {
    this.fns.set(impl.name, impl);
    return this;
  }

  get(name: string): FunctionImplementation | undefined {
    return this.fns.get(name);
  }

  has(name: string): boolean {
    return this.fns.has(name);
  }

  invoke(call: string, args: Record<string, unknown>, ctx: DynamicValueContext): Computed<unknown> {
    const impl = this.fns.get(call);
    if (!impl) throw new Error(`Unknown A2UI function: ${call}`);
    return new Computed<unknown>(() => impl.execute(resolveArgs(args, ctx), ctx));
  }
}

// ---------------------------------------------------------------------------
// Validation functions (return boolean)
// ---------------------------------------------------------------------------

export const requiredFn: FunctionImplementation = {
  name: 'required',
  returnType: 'boolean',
  schema: {},
  execute(args) {
    const v = args.value;
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  },
};

export const regexFn: FunctionImplementation = {
  name: 'regex',
  returnType: 'boolean',
  schema: {},
  execute(args) {
    try {
      return new RegExp(String(args.pattern ?? '')).test(String(args.value ?? ''));
    } catch {
      return false;
    }
  },
};

export const lengthFn: FunctionImplementation = {
  name: 'length',
  returnType: 'boolean',
  schema: {},
  execute(args) {
    const v = String(args.value ?? '');
    if (typeof args.min === 'number' && v.length < args.min) return false;
    if (typeof args.max === 'number' && v.length > args.max) return false;
    return true;
  },
};

export const numericFn: FunctionImplementation = {
  name: 'numeric',
  returnType: 'boolean',
  schema: {},
  execute(args) {
    const n = Number(args.value);
    if (Number.isNaN(n)) return false;
    if (typeof args.min === 'number' && n < args.min) return false;
    if (typeof args.max === 'number' && n > args.max) return false;
    return true;
  },
};

export const emailFn: FunctionImplementation = {
  name: 'email',
  returnType: 'boolean',
  schema: {},
  execute(args) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(args.value ?? ''));
  },
};

// ---------------------------------------------------------------------------
// Logic functions
// ---------------------------------------------------------------------------
export const andFn: FunctionImplementation = {
  name: 'and',
  returnType: 'boolean',
  schema: {},
  execute(args) {
    return Array.isArray(args.values) && args.values.every((v) => Boolean(v));
  },
};

export const orFn: FunctionImplementation = {
  name: 'or',
  returnType: 'boolean',
  schema: {},
  execute(args) {
    return Array.isArray(args.values) && args.values.some((v) => Boolean(v));
  },
};

export const notFn: FunctionImplementation = {
  name: 'not',
  returnType: 'boolean',
  schema: {},
  execute(args) {
    return !args.value;
  },
};

// ---------------------------------------------------------------------------
// Formatting functions
// ---------------------------------------------------------------------------
export const formatStringFn: FunctionImplementation = {
  name: 'formatString',
  returnType: 'string',
  schema: {},
  execute(args, ctx) {
    const v = args.value;
    const template = typeof v === 'string' ? v : stringify(v);
    return evalFormatString(template, ctx);
  },
};

export const formatNumberFn: FunctionImplementation = {
  name: 'formatNumber',
  returnType: 'string',
  schema: {},
  execute(args) {
    const n = Number(args.value ?? 0);
    const opts: Intl.NumberFormatOptions = {};
    if (typeof args.decimals === 'number') {
      opts.minimumFractionDigits = args.decimals;
      opts.maximumFractionDigits = args.decimals;
    }
    if (args.grouping === false) opts.useGrouping = false;
    return new Intl.NumberFormat(undefined, opts).format(n);
  },
};

export const formatCurrencyFn: FunctionImplementation = {
  name: 'formatCurrency',
  returnType: 'string',
  schema: {},
  execute(args) {
    const n = Number(args.value ?? 0);
    const opts: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: String(args.currency ?? 'USD'),
    };
    if (typeof args.decimals === 'number') {
      opts.minimumFractionDigits = args.decimals;
      opts.maximumFractionDigits = args.decimals;
    }
    if (args.grouping === false) opts.useGrouping = false;
    return new Intl.NumberFormat(undefined, opts).format(n);
  },
};

const WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const formatDateFn: FunctionImplementation = {
  name: 'formatDate',
  returnType: 'string',
  schema: {},
  execute(args) {
    const d = new Date(args.value as string);
    if (Number.isNaN(d.getTime())) return '';
    const f = String(args.format ?? '');
    return f.replace(
      /yyyy|yy|MMMM|MMM|MM|M|dd|d|HH|H|mm|m|ss|s|EEEE|EEE|E|a|hh|h/g,
      (tok) => {
        switch (tok) {
          case 'yyyy':
            return String(d.getFullYear());
          case 'yy':
            return String(d.getFullYear()).slice(-2);
          case 'MMMM':
            return d.toLocaleString(undefined, { month: 'long' });
          case 'MMM':
            return d.toLocaleString(undefined, { month: 'short' });
          case 'MM':
            return String(d.getMonth() + 1).padStart(2, '0');
          case 'M':
            return String(d.getMonth() + 1);
          case 'dd':
            return String(d.getDate()).padStart(2, '0');
          case 'd':
            return String(d.getDate());
          case 'HH':
            return String(d.getHours()).padStart(2, '0');
          case 'H':
            return String(d.getHours());
          case 'mm':
            return String(d.getMinutes()).padStart(2, '0');
          case 'm':
            return String(d.getMinutes());
          case 'ss':
            return String(d.getSeconds()).padStart(2, '0');
          case 's':
            return String(d.getSeconds());
          case 'EEEE':
            return WEEK_LONG[d.getDay()];
          case 'EEE':
          case 'E':
            return WEEK_SHORT[d.getDay()];
          case 'a':
            return d.getHours() < 12 ? 'AM' : 'PM';
          case 'h': {
            const h = d.getHours() % 12 || 12;
            return String(h);
          }
          case 'hh': {
            const h = d.getHours() % 12 || 12;
            return String(h).padStart(2, '0');
          }
          default:
            return tok;
        }
      },
    );
  },
};

export const pluralizeFn: FunctionImplementation = {
  name: 'pluralize',
  returnType: 'string',
  schema: {},
  execute(args) {
    const n = Number(args.value);
    const cat = new Intl.PluralRules().select(Number.isNaN(n) ? 0 : n);
    if (args[cat] !== undefined) return String(args[cat]);
    if (args.other !== undefined) return String(args.other);
    return '';
  },
};

// ---------------------------------------------------------------------------
// Effect functions
// ---------------------------------------------------------------------------
export const openUrlFn: FunctionImplementation = {
  name: 'openUrl',
  returnType: 'void',
  schema: {},
  execute(args) {
    const url = String(args.url ?? '');
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(url, '_blank');
    }
    return undefined;
  },
};

// ---------------------------------------------------------------------------
// System functions
// ---------------------------------------------------------------------------
export const indexSystemFn: FunctionImplementation = {
  name: '@index',
  returnType: 'number',
  schema: {},
  execute(args, ctx) {
    const segs = ctx.path === '' ? [] : ctx.path.split('/').filter(Boolean);
    const last = segs[segs.length - 1];
    const offset = typeof args.offset === 'number' ? args.offset : 0;
    if (last != null && /^\d+$/.test(last)) return Number(last) + offset;
    return Number.NaN;
  },
};

/** All Basic Catalog functions (renderer_guide.md §Functions table). */
export const basicFunctions: FunctionImplementation[] = [
  requiredFn,
  regexFn,
  lengthFn,
  numericFn,
  emailFn,
  formatStringFn,
  formatNumberFn,
  formatCurrencyFn,
  formatDateFn,
  pluralizeFn,
  andFn,
  orFn,
  notFn,
  openUrlFn,
  indexSystemFn,
];
