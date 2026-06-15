import { describe, it, expect } from 'vitest';
import { evalFormatString } from './format-string';
import {
  FunctionRegistry,
  basicFunctions,
  requiredFn,
  regexFn,
  lengthFn,
  numericFn,
  emailFn,
  andFn,
  orFn,
  notFn,
  formatNumberFn,
  formatDateFn,
  pluralizeFn,
  indexSystemFn,
} from './index';
import { DataContext } from '../context';
import { DataModel } from '../datamodel';

const registry = new FunctionRegistry(basicFunctions);
const ctx = (dm: DataModel, path = '') => new DataContext(dm, path, registry);
const empty = () => ctx(new DataModel());

describe('evalFormatString', () => {
  it('passes literals through', () => {
    expect(evalFormatString('hello world', empty())).toBe('hello world');
  });

  it('interpolates absolute paths', () => {
    const dm = new DataModel();
    dm.set('/name', 'World');
    expect(evalFormatString('Hi ${/name}!', ctx(dm))).toBe('Hi World!');
  });

  it('interpolates relative paths against the scope', () => {
    const dm = new DataModel();
    dm.set('/users/0/name', 'Bob');
    expect(evalFormatString('${name}', ctx(dm, '/users/0'))).toBe('Bob');
  });

  it('handles escaped \\${', () => {
    expect(evalFormatString('price \\${5}', empty())).toBe('price ${5}');
  });

  it('evaluates nested function calls', () => {
    const dm = new DataModel();
    dm.set('/d', '2026-06-15T12:00:00Z');
    expect(evalFormatString('${formatDate(value:${/d}, format:"yyyy")}', ctx(dm))).toBe('2026');
  });

  it('resolves @index within a collection scope', () => {
    expect(evalFormatString('#${@index(offset:1)}', ctx(new DataModel(), '/list/3'))).toBe('#4');
  });

  it('renders null/undefined as empty', () => {
    expect(evalFormatString('[${/missing}]', empty())).toBe('[]');
  });
});

describe('validation functions', () => {
  it('required', () => {
    expect(requiredFn.execute({ value: 'x' }, empty())).toBe(true);
    expect(requiredFn.execute({ value: '' }, empty())).toBe(false);
    expect(requiredFn.execute({ value: null }, empty())).toBe(false);
    expect(requiredFn.execute({ value: [] }, empty())).toBe(false);
  });

  it('regex', () => {
    expect(regexFn.execute({ value: '12345', pattern: '^\\d{5}$' }, empty())).toBe(true);
    expect(regexFn.execute({ value: '12', pattern: '^\\d{5}$' }, empty())).toBe(false);
  });

  it('length', () => {
    expect(lengthFn.execute({ value: 'abc', min: 2, max: 5 }, empty())).toBe(true);
    expect(lengthFn.execute({ value: 'a', min: 2 }, empty())).toBe(false);
  });

  it('numeric', () => {
    expect(numericFn.execute({ value: 5, min: 1, max: 10 }, empty())).toBe(true);
    expect(numericFn.execute({ value: 0, min: 1 }, empty())).toBe(false);
    expect(numericFn.execute({ value: 'x' }, empty())).toBe(false);
  });

  it('email', () => {
    expect(emailFn.execute({ value: 'a@b.c' }, empty())).toBe(true);
    expect(emailFn.execute({ value: 'nope' }, empty())).toBe(false);
  });
});

describe('logic functions', () => {
  it('and / or / not', () => {
    expect(andFn.execute({ values: [true, true] }, empty())).toBe(true);
    expect(andFn.execute({ values: [true, false] }, empty())).toBe(false);
    expect(orFn.execute({ values: [false, true] }, empty())).toBe(true);
    expect(notFn.execute({ value: false }, empty())).toBe(true);
  });
});

describe('formatting functions', () => {
  it('formatNumber without grouping is locale-stable', () => {
    expect(formatNumberFn.execute({ value: 42, grouping: false }, empty())).toBe('42');
  });

  it('formatDate renders the year', () => {
    expect(
      formatDateFn.execute({ value: '2026-06-15T12:00:00Z', format: 'yyyy' }, empty()),
    ).toBe('2026');
  });

  it('pluralize falls back to other', () => {
    expect(pluralizeFn.execute({ value: 99, other: 'items' }, empty())).toBe('items');
  });
});

describe('@index', () => {
  it('returns the scoped index with offset', () => {
    expect(indexSystemFn.execute({ offset: 1 }, ctx(new DataModel(), '/list/2'))).toBe(3);
  });

  it('is NaN outside a collection scope', () => {
    expect(Number.isNaN(indexSystemFn.execute({}, ctx(new DataModel(), '/x')) as number)).toBe(true);
  });
});

describe('FunctionRegistry', () => {
  it('invoke returns a reactive Computed', () => {
    const dm = new DataModel();
    dm.set('/n', 5);
    const result = registry.invoke('numeric', { value: { path: '/n' }, min: 0 }, ctx(dm));
    expect(result.value).toBe(true);
    dm.set('/n', -1);
    expect(result.value).toBe(false);
    result.dispose();
  });

  it('formatString is reactive through the registry', () => {
    const dm = new DataModel();
    dm.set('/name', 'A');
    const result = registry.invoke('formatString', { value: 'Hi ${/name}' }, ctx(dm));
    expect(result.value).toBe('Hi A');
    dm.set('/name', 'B');
    expect(result.value).toBe('Hi B');
    result.dispose();
  });

  it('throws on unknown function', () => {
    expect(() => registry.invoke('nope', {}, empty())).toThrow();
  });
});
