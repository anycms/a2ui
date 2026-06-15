import { describe, it, expect } from 'vitest';
import { basicCatalog, basicCatalogId, textBinder, buttonBinder } from './index';
import { ComponentContext } from '../../context';
import { SurfaceModel, ComponentModel } from '../../components';

const invoker = basicCatalog.functions;

describe('basic catalog', () => {
  it('has the correct id and 18 components', () => {
    expect(basicCatalog.id).toBe(basicCatalogId);
    expect(basicCatalog.components.size).toBe(18);
  });

  it('looks up components by name', () => {
    expect(basicCatalog.getComponent('Text')?.name).toBe('Text');
    expect(basicCatalog.getComponent('Button')?.name).toBe('Button');
    expect(basicCatalog.getComponent('NoSuch')).toBeUndefined();
  });

  it('ships the basic functions', () => {
    expect(basicCatalog.functions.has('required')).toBe(true);
    expect(basicCatalog.functions.has('formatString')).toBe(true);
    expect(basicCatalog.functions.has('@index')).toBe(true);
  });
});

describe('textBinder', () => {
  it('resolves text + variant and reacts to data', () => {
    const surface = new SurfaceModel({ id: 's', catalogId: basicCatalogId, dataModel: { x: 'hi' } });
    const component = new ComponentModel('t', 'Text', {
      component: 'Text',
      text: { path: '/x' },
      variant: 'h2',
    });
    const ctx = new ComponentContext({ surface, componentModel: component, invoker });
    const binding = textBinder.bind(ctx);
    expect(binding.propsStream.value).toEqual({ text: 'hi', variant: 'h2' });
    surface.dataModel.set('/x', 'yo');
    expect(binding.propsStream.value.text).toBe('yo');
    binding.dispose();
  });
});

describe('buttonBinder checks', () => {
  it('disables when a check fails, enables when it passes', () => {
    const surface = new SurfaceModel({ id: 's', catalogId: basicCatalogId, dataModel: { email: '' } });
    const component = new ComponentModel('btn', 'Button', {
      component: 'Button',
      child: 'lbl',
      action: { event: { name: 'submit' } },
      checks: [
        {
          condition: { call: 'required', args: { value: { path: '/email' } } },
          message: 'Email is required',
        },
      ],
    });
    const ctx = new ComponentContext({ surface, componentModel: component, invoker });
    const binding = buttonBinder.bind(ctx);
    expect(binding.propsStream.value.disabled).toBe(true);
    expect(binding.propsStream.value.checks[0].message).toBe('Email is required');
    surface.dataModel.set('/email', 'a@b.c');
    expect(binding.propsStream.value.disabled).toBe(false);
    binding.dispose();
  });
});
