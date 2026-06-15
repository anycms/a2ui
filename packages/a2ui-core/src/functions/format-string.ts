import { resolveDynamicValue, type DynamicValueContext } from '../dynamic-value';

// A small recursive-descent evaluator for the A2UI `formatString` `${...}`
// interpolation grammar (renderer_guide.md §formatString + protocol §formatString):
//   - escaped:        \${                  -> literal ${
//   - data path:      ${/abs/path}  ${rel}  (relative resolves against scope)
//   - function call:  ${name(arg: value, ...)}
//   - nested:         ${formatDate(value:${/d}, format:"yyyy")}
//   - @index:         ${@index(offset:1)}
//   - literals:       ${'str'}  ${42}  ${true}  ${null}

interface Pos {
  i: number;
}

const isWs = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r';
const skipWs = (s: string, p: Pos) => {
  while (p.i < s.length && isWs(s[p.i])) p.i++;
};
const isDigit = (c: string) => c >= '0' && c <= '9';

/** A2UI type-coercion to string (null/undefined -> "", objects -> JSON). */
export function stringify(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function parseStringLiteral(s: string, p: Pos): string {
  const quote = s[p.i++];
  let out = '';
  while (p.i < s.length && s[p.i] !== quote) {
    if (s[p.i] === '\\' && p.i + 1 < s.length) {
      out += s[p.i + 1];
      p.i += 2;
    } else {
      out += s[p.i++];
    }
  }
  p.i++; // closing quote
  return out;
}

function parseNumberLiteral(s: string, p: Pos): number {
  const start = p.i;
  if (s[p.i] === '-') p.i++;
  while (p.i < s.length && isDigit(s[p.i])) p.i++;
  if (s[p.i] === '.') {
    p.i++;
    while (p.i < s.length && isDigit(s[p.i])) p.i++;
  }
  return Number(s.slice(start, p.i));
}

function readIdentifier(s: string, p: Pos): string {
  const start = p.i;
  while (p.i < s.length && /[A-Za-z0-9_]/.test(s[p.i])) p.i++;
  return s.slice(start, p.i);
}

function readPathTail(s: string, p: Pos): string {
  let tail = '';
  while (p.i < s.length && s[p.i] === '/') {
    p.i++;
    tail += '/' + readIdentifier(s, p);
  }
  return tail;
}

function parseCall(name: string, s: string, p: Pos, ctx: DynamicValueContext): unknown {
  p.i++; // consume '('
  const args: Record<string, unknown> = {};
  while (true) {
    skipWs(s, p);
    if (p.i >= s.length || s[p.i] === ')') break;
    const argName = readIdentifier(s, p);
    skipWs(s, p);
    if (s[p.i] === ':') p.i++;
    args[argName] = parseArgValue(s, p, ctx);
    skipWs(s, p);
    if (s[p.i] === ',') {
      p.i++;
      continue;
    }
    break;
  }
  if (s[p.i] === ')') p.i++;
  return resolveDynamicValue({ call: name, args }, ctx);
}

function parseArgValue(s: string, p: Pos, ctx: DynamicValueContext): unknown {
  skipWs(s, p);
  if (s[p.i] === '$' && s[p.i + 1] === '{') {
    p.i += 2;
    const v = parsePrimary(s, p, ctx);
    skipWs(s, p);
    if (s[p.i] === '}') p.i++;
    return v;
  }
  return parsePrimary(s, p, ctx);
}

function parsePrimary(s: string, p: Pos, ctx: DynamicValueContext): unknown {
  skipWs(s, p);
  const c = s[p.i];
  if (c === '"' || c === "'") return parseStringLiteral(s, p);
  if (c === '-' || isDigit(c)) return parseNumberLiteral(s, p);
  if (c === '/') {
    p.i++;
    const path = '/' + readIdentifier(s, p) + readPathTail(s, p);
    return resolveDynamicValue({ path }, ctx);
  }
  if (c === '@') {
    p.i++;
    const name = '@' + readIdentifier(s, p);
    skipWs(s, p);
    if (s[p.i] === '(') return parseCall(name, s, p, ctx);
    return resolveDynamicValue({ call: name, args: {} }, ctx);
  }
  const word = readIdentifier(s, p);
  if (word === 'true') return true;
  if (word === 'false') return false;
  if (word === 'null') return null;
  if (word === '') return '';
  skipWs(s, p);
  if (s[p.i] === '(') return parseCall(word, s, p, ctx);
  const path = word + readPathTail(s, p);
  return resolveDynamicValue({ path }, ctx);
}

/** Evaluate a formatString template against a data context. */
export function evalFormatString(value: string, ctx: DynamicValueContext): string {
  let out = '';
  const p: Pos = { i: 0 };
  while (p.i < value.length) {
    const ch = value[p.i];
    if (ch === '\\' && value[p.i + 1] === '$' && value[p.i + 2] === '{') {
      out += '${';
      p.i += 3;
    } else if (ch === '$' && value[p.i + 1] === '{') {
      p.i += 2;
      const v = parsePrimary(value, p, ctx);
      skipWs(value, p);
      if (value[p.i] === '}') p.i++;
      out += stringify(v);
    } else {
      out += ch;
      p.i++;
    }
  }
  return out;
}
