import { describe, it, expect, vi } from 'vitest';
import { Signal, EventSource, Computed, batch, untracked } from './index';

describe('Signal', () => {
  it('holds and returns its initial value', () => {
    const s = new Signal(5);
    expect(s.value).toBe(5);
  });

  it('updates value on set', () => {
    const s = new Signal(1);
    s.value = 2;
    expect(s.value).toBe(2);
  });

  it('replays current value on subscribe', () => {
    const s = new Signal('hi');
    const cb = vi.fn();
    s.subscribe(cb);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('hi');
  });

  it('onUpdate does not replay', () => {
    const s = new Signal(1);
    const cb = vi.fn();
    s.onUpdate(cb);
    expect(cb).not.toHaveBeenCalled();
  });

  it('notifies onUpdate listeners on change', () => {
    const s = new Signal(0);
    const cb = vi.fn();
    s.onUpdate(cb);
    s.value = 10;
    expect(cb).toHaveBeenCalledWith(10);
  });

  it('does not notify when set to an equal value (Object.is)', () => {
    const s = new Signal(1);
    const cb = vi.fn();
    s.onUpdate(cb);
    s.value = 1;
    expect(cb).not.toHaveBeenCalled();
  });

  it('unsubscribe stops notifications', () => {
    const s = new Signal(0);
    const cb = vi.fn();
    const sub = s.onUpdate(cb);
    s.value = 1;
    sub.unsubscribe();
    s.value = 2;
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(1);
  });
});

describe('EventSource', () => {
  it('delivers emitted events to subscribers', () => {
    const es = new EventSource<number>();
    const cb = vi.fn();
    es.subscribe(cb);
    es.emit(1);
    es.emit(2);
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenNthCalledWith(1, 1);
    expect(cb).toHaveBeenNthCalledWith(2, 2);
  });

  it('does not replay past events to late subscribers', () => {
    const es = new EventSource<number>();
    es.emit(1);
    const cb = vi.fn();
    es.subscribe(cb);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('Computed', () => {
  it('derives from a signal', () => {
    const a = new Signal(2);
    const c = new Computed(() => a.value * 3);
    expect(c.value).toBe(6);
  });

  it('updates when a dependency changes', () => {
    const a = new Signal(2);
    const c = new Computed(() => a.value * 3);
    a.value = 4;
    expect(c.value).toBe(12);
  });

  it('notifies subscribers on change (with replay)', () => {
    const a = new Signal(1);
    const c = new Computed(() => a.value + 1);
    const cb = vi.fn();
    c.subscribe(cb);
    expect(cb).toHaveBeenCalledWith(2);
    a.value = 5;
    expect(cb).toHaveBeenLastCalledWith(6);
  });

  it('supports chained computeds', () => {
    const a = new Signal(2);
    const b = new Computed(() => a.value * 2);
    const c = new Computed(() => b.value + 1);
    expect(c.value).toBe(5);
    a.value = 3;
    expect(c.value).toBe(7);
  });

  it('recomputes only from tracked deps', () => {
    const a = new Signal(1);
    const b = new Signal(100);
    let reads = 0;
    const c = new Computed(() => {
      reads++;
      return a.value;
    });
    expect(c.value).toBe(1);
    b.value = 200; // not a dep
    expect(reads).toBe(1);
    a.value = 2;
    expect(c.value).toBe(2);
    expect(reads).toBe(2);
  });

  it('dispose releases dependency subscriptions', () => {
    const a = new Signal(1);
    const computeSpy = vi.fn(() => a.value);
    const c = new Computed(computeSpy);
    c.subscribe(() => {});
    c.dispose();
    a.value = 999;
    expect(computeSpy).toHaveBeenCalledTimes(1);
  });
});

describe('batch', () => {
  it('collapses multiple writes into one notification', () => {
    const s = new Signal(0);
    const cb = vi.fn();
    s.onUpdate(cb);
    batch(() => {
      s.value = 1;
      s.value = 2;
      s.value = 3;
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(3);
  });

  it('delivers final value after batch', () => {
    const s = new Signal(0);
    batch(() => {
      s.value = 5;
    });
    expect(s.value).toBe(5);
  });

  it('flushes only at the outermost nested batch', () => {
    const s = new Signal(0);
    const cb = vi.fn();
    s.onUpdate(cb);
    batch(() => {
      s.value = 1;
      batch(() => {
        s.value = 2;
      });
      expect(cb).not.toHaveBeenCalled();
      s.value = 3;
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(3);
  });
});

describe('untracked', () => {
  it('reads do not register dependencies', () => {
    const a = new Signal(1);
    const b = new Signal(1);
    const c = new Computed(() => a.value + untracked(() => b.value));
    expect(c.value).toBe(2);
    b.value = 10; // not a tracked dep
    expect(c.value).toBe(2);
    a.value = 5;
    expect(c.value).toBe(15);
  });
});
