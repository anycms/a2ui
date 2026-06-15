import { describe, it, expect, vi } from 'vitest';
import { ComponentModel, SurfaceComponentsModel, SurfaceModel, SurfaceGroupModel } from './index';

describe('ComponentModel', () => {
  it('stores id/type/properties', () => {
    const c = new ComponentModel('btn', 'Button', { variant: 'primary' });
    expect(c.id).toBe('btn');
    expect(c.type).toBe('Button');
    expect(c.properties).toEqual({ variant: 'primary' });
  });

  it('fires onUpdated when properties change', () => {
    const c = new ComponentModel('t', 'Text', { text: 'a' });
    const cb = vi.fn();
    c.onUpdated.subscribe(cb);
    c.properties = { text: 'b' };
    expect(cb).toHaveBeenCalledWith(c);
  });
});

describe('SurfaceComponentsModel', () => {
  it('add emits onCreated', () => {
    const m = new SurfaceComponentsModel();
    const cb = vi.fn();
    m.onCreated.subscribe(cb);
    m.add(new ComponentModel('a', 'Text', {}));
    expect(cb).toHaveBeenCalledTimes(1);
    expect(m.get('a')?.id).toBe('a');
  });

  it('remove emits onDeleted', () => {
    const m = new SurfaceComponentsModel();
    m.add(new ComponentModel('a', 'Text', {}));
    const cb = vi.fn();
    m.onDeleted.subscribe(cb);
    m.remove('a');
    expect(cb).toHaveBeenCalledWith('a');
    expect(m.has('a')).toBe(false);
  });

  it('remove of unknown id is a no-op', () => {
    const m = new SurfaceComponentsModel();
    const cb = vi.fn();
    m.onDeleted.subscribe(cb);
    m.remove('nope');
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('SurfaceModel', () => {
  it('seeds the data model from constructor', () => {
    const s = new SurfaceModel({ id: 's1', catalogId: 'cat', dataModel: { a: 1 } });
    expect(s.dataModel.get('/a')).toBe(1);
    expect(s.sendDataModel).toBe(false);
  });

  it('dispatchAction emits a well-formed client action', () => {
    const s = new SurfaceModel({ id: 's1', catalogId: 'cat' });
    const cb = vi.fn();
    s.onAction.subscribe(cb);
    s.dispatchAction({ name: 'submit', context: { x: 1 } }, 'btn-1');
    expect(cb).toHaveBeenCalledTimes(1);
    const action = cb.mock.calls[0][0];
    expect(action).toMatchObject({
      name: 'submit',
      surfaceId: 's1',
      sourceComponentId: 'btn-1',
      context: { x: 1 },
    });
    expect(typeof action.timestamp).toBe('string');
  });
});

describe('SurfaceGroupModel', () => {
  it('add/delete emit lifecycle events', () => {
    const g = new SurfaceGroupModel();
    const created = vi.fn();
    const deleted = vi.fn();
    g.onSurfaceCreated.subscribe(created);
    g.onSurfaceDeleted.subscribe(deleted);
    g.addSurface(new SurfaceModel({ id: 's1', catalogId: 'cat' }));
    expect(created).toHaveBeenCalledTimes(1);
    expect(g.size).toBe(1);
    g.deleteSurface('s1');
    expect(deleted).toHaveBeenCalledWith('s1');
    expect(g.size).toBe(0);
  });

  it('rejects duplicate surface ids', () => {
    const g = new SurfaceGroupModel();
    g.addSurface(new SurfaceModel({ id: 's1', catalogId: 'cat' }));
    expect(() => g.addSurface(new SurfaceModel({ id: 's1', catalogId: 'cat' }))).toThrow();
  });

  it('forwards surface actions to the group stream', () => {
    const g = new SurfaceGroupModel();
    const s = new SurfaceModel({ id: 's1', catalogId: 'cat' });
    g.addSurface(s);
    const cb = vi.fn();
    g.onAction.subscribe(cb);
    s.dispatchAction({ name: 'click' }, 'b1');
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0].surfaceId).toBe('s1');
  });
});
