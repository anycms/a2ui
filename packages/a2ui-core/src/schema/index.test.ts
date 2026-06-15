import { describe, it, expect } from 'vitest';
import {
  parseA2uiMessage,
  A2uiValidationError,
  serializeClientEvent,
} from './index';
import type {
  CreateSurfaceMessage,
  UpdateComponentsMessage,
  UpdateDataModelMessage,
  DeleteSurfaceMessage,
} from './index';

const BASIC = 'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json';

describe('parseA2uiMessage — valid', () => {
  it('parses createSurface', () => {
    const msg = parseA2uiMessage({
      version: 'v1.0',
      createSurface: { surfaceId: 's1', catalogId: BASIC, sendDataModel: true },
    }) as CreateSurfaceMessage;
    expect(msg.createSurface.surfaceId).toBe('s1');
    expect(msg.createSurface.sendDataModel).toBe(true);
  });

  it('parses createSurface with embedded components + dataModel', () => {
    const msg = parseA2uiMessage({
      version: 'v1.0',
      createSurface: {
        surfaceId: 's1',
        catalogId: BASIC,
        components: [{ id: 'root', component: 'Text', text: 'hi' }],
        dataModel: { a: 1 },
      },
    }) as CreateSurfaceMessage;
    expect(msg.createSurface.components).toHaveLength(1);
  });

  it('parses updateComponents', () => {
    const msg = parseA2uiMessage({
      version: 'v1.0',
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'root', component: 'Column', children: [] }],
      },
    }) as UpdateComponentsMessage;
    expect(msg.updateComponents.components[0].component).toBe('Column');
  });

  it('parses updateDataModel', () => {
    const msg = parseA2uiMessage({
      version: 'v1.0',
      updateDataModel: { surfaceId: 's1', path: '/x', value: 9 },
    }) as UpdateDataModelMessage;
    expect(msg.updateDataModel.value).toBe(9);
  });

  it('parses deleteSurface', () => {
    const msg = parseA2uiMessage({
      version: 'v1.0',
      deleteSurface: { surfaceId: 's1' },
    }) as DeleteSurfaceMessage;
    expect(msg.deleteSurface.surfaceId).toBe('s1');
  });

  it('parses a JSON string input', () => {
    const msg = parseA2uiMessage(
      JSON.stringify({ version: 'v1.0', deleteSurface: { surfaceId: 's2' } }),
    ) as DeleteSurfaceMessage;
    expect(msg.deleteSurface.surfaceId).toBe('s2');
  });
});

describe('parseA2uiMessage — invalid', () => {
  it('rejects wrong version', () => {
    expect(() =>
      parseA2uiMessage({ version: 'v0.9', deleteSurface: { surfaceId: 's1' } }),
    ).toThrow(A2uiValidationError);
  });

  it('rejects malformed JSON string', () => {
    try {
      parseA2uiMessage('{not json');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(A2uiValidationError);
      expect((e as A2uiValidationError).issues[0].code).toBe('VALIDATION_FAILED');
    }
  });

  it('rejects an envelope with no message key', () => {
    expect(() => parseA2uiMessage({ version: 'v1.0' })).toThrow(A2uiValidationError);
  });

  it('rejects multiple message keys (strict)', () => {
    expect(() =>
      parseA2uiMessage({
        version: 'v1.0',
        createSurface: { surfaceId: 's1', catalogId: BASIC },
        deleteSurface: { surfaceId: 's1' },
      }),
    ).toThrow(A2uiValidationError);
  });

  it('populates surfaceId and VALIDATION_FAILED code on errors', () => {
    try {
      parseA2uiMessage({
        version: 'v1.0',
        updateComponents: { surfaceId: 'mySurf', components: [] },
      });
      throw new Error('should have thrown');
    } catch (e) {
      const err = e as A2uiValidationError;
      expect(err.code).toBe('VALIDATION_FAILED');
      expect(err.issues.length).toBeGreaterThan(0);
      expect(err.issues[0].surfaceId).toBe('mySurf');
    }
  });
});

describe('serializeClientEvent', () => {
  it('serializes an action envelope', () => {
    const json = serializeClientEvent({
      version: 'v1.0',
      action: {
        name: 'submit',
        surfaceId: 's1',
        sourceComponentId: 'btn',
        timestamp: '2026-06-15T00:00:00Z',
        context: { x: 1 },
      },
    });
    expect(JSON.parse(json).action.name).toBe('submit');
  });
});
