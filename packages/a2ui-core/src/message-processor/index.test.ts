import { describe, it, expect, vi } from 'vitest';
import { MessageProcessor } from './index';
import { basicCatalog, basicCatalogId } from '../catalogs/basic';

const mp = () => new MessageProcessor({ catalogs: [basicCatalog] });

describe('MessageProcessor', () => {
  it('creates a surface and applies components', () => {
    const p = mp();
    p.processMessages([
      { version: 'v1.0', createSurface: { surfaceId: 's1', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's1',
          components: [
            { id: 'root', component: 'Column', children: ['t'] },
            { id: 't', component: 'Text', text: 'hi' },
          ],
        },
      },
    ]);
    const s = p.model.get('s1');
    expect(s).toBeDefined();
    expect(s!.componentsModel.get('root')?.type).toBe('Column');
    expect(s!.componentsModel.get('t')?.properties.text).toBe('hi');
  });

  it('seeds the data model from createSurface', () => {
    const p = mp();
    p.processMessages([
      { version: 'v1.0', createSurface: { surfaceId: 's1', catalogId: basicCatalogId, dataModel: { x: 1 } } },
    ]);
    expect(p.model.get('s1')!.dataModel.get('/x')).toBe(1);
  });

  it('rebuilds a component when its type changes', () => {
    const p = mp();
    p.processMessages([
      { version: 'v1.0', createSurface: { surfaceId: 's1', catalogId: basicCatalogId } },
      { version: 'v1.0', updateComponents: { surfaceId: 's1', components: [{ id: 'c', component: 'Text', text: 'a' }] } },
    ]);
    expect(p.model.get('s1')!.componentsModel.get('c')?.type).toBe('Text');
    p.processMessages([
      { version: 'v1.0', updateComponents: { surfaceId: 's1', components: [{ id: 'c', component: 'Button', child: 'lbl' }] } },
    ]);
    expect(p.model.get('s1')!.componentsModel.get('c')?.type).toBe('Button');
  });

  it('updates and removes data via updateDataModel', () => {
    const p = mp();
    p.processMessages([{ version: 'v1.0', createSurface: { surfaceId: 's1', catalogId: basicCatalogId } }]);
    p.processMessages([{ version: 'v1.0', updateDataModel: { surfaceId: 's1', path: '/x', value: 5 } }]);
    expect(p.model.get('s1')!.dataModel.get('/x')).toBe(5);
    p.processMessages([{ version: 'v1.0', updateDataModel: { surfaceId: 's1', path: '/x' } }]);
    expect(p.model.get('s1')!.dataModel.get('/x')).toBeUndefined();
  });

  it('deletes a surface', () => {
    const p = mp();
    p.processMessages([{ version: 'v1.0', createSurface: { surfaceId: 's1', catalogId: basicCatalogId } }]);
    p.processMessages([{ version: 'v1.0', deleteSurface: { surfaceId: 's1' } }]);
    expect(p.model.get('s1')).toBeUndefined();
  });

  it('rejects duplicate surface creation', () => {
    const p = mp();
    p.processMessages([{ version: 'v1.0', createSurface: { surfaceId: 's1', catalogId: basicCatalogId } }]);
    expect(() =>
      p.processMessages([{ version: 'v1.0', createSurface: { surfaceId: 's1', catalogId: basicCatalogId } }]),
    ).toThrow();
  });

  it('emits lifecycle events', () => {
    const p = mp();
    const created = vi.fn();
    const deleted = vi.fn();
    p.addLifecycleListener({ onSurfaceCreated: created, onSurfaceDeleted: deleted });
    p.processMessages([{ version: 'v1.0', createSurface: { surfaceId: 's1', catalogId: basicCatalogId } }]);
    expect(created).toHaveBeenCalledTimes(1);
    p.processMessages([{ version: 'v1.0', deleteSurface: { surfaceId: 's1' } }]);
    expect(deleted).toHaveBeenCalledWith('s1');
  });

  it('getClientCapabilities lists catalog ids', () => {
    expect(mp().getClientCapabilities().v1_0.supportedCatalogIds).toContain(basicCatalogId);
  });

  it('getClientDataModel aggregates sendDataModel surfaces', () => {
    const p = mp();
    p.processMessages([
      { version: 'v1.0', createSurface: { surfaceId: 's1', catalogId: basicCatalogId, sendDataModel: true } },
      { version: 'v1.0', updateDataModel: { surfaceId: 's1', value: { a: 1 } } },
    ]);
    expect(p.getClientDataModel()?.surfaces['s1']).toEqual({ a: 1 });
  });

  it('getClientDataModel is undefined when no surface sends data', () => {
    const p = mp();
    p.processMessages([{ version: 'v1.0', createSurface: { surfaceId: 's1', catalogId: basicCatalogId } }]);
    expect(p.getClientDataModel()).toBeUndefined();
  });
});
