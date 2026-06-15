// JSON Pointer (RFC 6901) with A2UI v1.0 extensions:
//   - relative paths (not starting with '/') resolved against a scope
//   - auto-vivification of intermediate containers
//   - prefix/related helpers for the DataModel's bubble & cascade notification
//
// See renderer_guide.md §DataModel "JSON Pointer Implementation Rules".

export function unescapeToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

export function escapeToken(token: string): string {
  return token.replace(/~/g, '~0').replace(/\//g, '~1');
}

/** True if the pointer is absolute (root-scoped, empty or starts with '/'). */
export function isAbsolutePointer(pointer: string): boolean {
  return pointer.length === 0 || pointer.startsWith('/');
}

function relativeTokens(pointer: string): string[] {
  if (pointer.length === 0) return [];
  return pointer.split('/').map(unescapeToken);
}

/** Parse an absolute JSON Pointer into unescaped reference tokens. */
export function parsePointer(pointer: string): string[] {
  if (pointer === '' || pointer === '/') return [];
  if (!pointer.startsWith('/')) {
    throw new Error(`Absolute JSON Pointer must start with '/': ${JSON.stringify(pointer)}`);
  }
  return pointer.split('/').slice(1).map(unescapeToken);
}

/**
 * Resolve a possibly-relative A2UI pointer against a base scope into absolute
 * reference tokens. Absolute pointers (starting with '/') ignore the base.
 */
export function resolvePointer(pointer: string, basePath: string = ''): string[] {
  if (pointer.startsWith('/')) return parsePointer(pointer);
  const baseTokens = basePath === '' || basePath === '/' ? [] : parsePointer(basePath);
  return [...baseTokens, ...relativeTokens(pointer)];
}

/** Build an absolute pointer string from reference tokens. '' denotes root. */
export function pointerFromTokens(tokens: readonly string[]): string {
  if (tokens.length === 0) return '';
  return '/' + tokens.map(escapeToken).join('/');
}

function isNumericKey(tok: string): boolean {
  return /^(0|[1-9]\d*)$/.test(tok);
}

/** Read the value at an absolute token path. Returns undefined if missing. */
export function get(root: unknown, tokens: readonly string[]): unknown {
  let cur: unknown = root;
  for (const tok of tokens) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[tok];
  }
  return cur;
}

/**
 * Write a value at an absolute token path with auto-vivification: missing
 * intermediate containers are created, typed by the *next* token (numeric →
 * Array, otherwise Object). Setting `undefined` deletes the key (sparse for
 * arrays, preserving length).
 *
 * `tokens` must be non-empty; whole-model replacement is the caller's job.
 */
export function set(root: object, tokens: readonly string[], value: unknown): void {
  if (tokens.length === 0) {
    throw new Error('Cannot replace root via pointer tokens.');
  }
  let cur: Record<string, unknown> = root as Record<string, unknown>;
  for (let i = 0; i < tokens.length - 1; i++) {
    const tok = tokens[i];
    const nextTok = tokens[i + 1];
    let child = cur[tok];
    if (child == null || typeof child !== 'object') {
      child = isNumericKey(nextTok) ? [] : {};
      cur[tok] = child;
    }
    cur = child as Record<string, unknown>;
  }
  const last = tokens[tokens.length - 1];
  if (value === undefined) {
    if (Array.isArray(cur)) {
      // sparse: preserve length, empty the slot
      delete (cur as unknown as Record<string, unknown>)[last];
    } else {
      delete cur[last];
    }
  } else {
    cur[last] = value;
  }
}

/** True when `prefix` tokens are a leading subsequence of `full` (or equal). */
export function isPrefix(prefix: readonly string[], full: readonly string[]): boolean {
  if (prefix.length > full.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== full[i]) return false;
  }
  return true;
}

/**
 * Whether two token paths are related by ancestry/descendance (one a prefix of
 * the other, or equal). Drives the DataModel's bubble + cascade notification:
 * on `set(path)`, every subscriber whose path is related to `path` is notified.
 */
export function isRelated(sp: readonly string[], path: readonly string[]): boolean {
  return isPrefix(sp, path) || isPrefix(path, sp);
}
