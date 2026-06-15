import { describe, it, expect } from 'vitest';
import { imageBinder, basicCatalogId } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { imageView } from './image';

describe('Image (dom)', () => {
  it('renders src, alt, and variant size styles', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'Image',
              url: 'https://example.com/a.png',
              description: 'A picture',
              variant: 'avatar',
              fit: 'cover',
            },
          ],
        },
      },
    ]);
    const { host } = mount(mp.model.get('s')!, {
      Image: createDomComponent(imageBinder, imageView),
    });

    const img = host.querySelector<HTMLImageElement>('.a2ui-leaf');
    expect(img).toBeTruthy();
    expect(img!.tagName).toBe('IMG');
    expect(img!.getAttribute('src')).toBe('https://example.com/a.png');
    expect(img!.getAttribute('alt')).toBe('A picture');
    expect(img!.style.margin).toBe('8px');
    expect(img!.style.objectFit).toBe('cover');
    // avatar variant
    expect(img!.style.width).toBe('40px');
    expect(img!.style.height).toBe('40px');
    expect(img!.style.borderRadius).toBe('50%');
  });

  it('applies each variant size', () => {
    const cases: Array<{ variant: string; width: string; height: string }> = [
      { variant: 'icon', width: '24px', height: '24px' },
      { variant: 'smallFeature', width: '100px', height: '100px' },
      { variant: 'header', width: '100%', height: '200px' },
    ];
    for (const c of cases) {
      const mp = setup([
        { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
        {
          version: 'v1.0',
          updateComponents: {
            surfaceId: 's',
            components: [
              { id: 'root', component: 'Image', url: 'u', variant: c.variant },
            ],
          },
        },
      ]);
      const { host } = mount(mp.model.get('s')!, {
        Image: createDomComponent(imageBinder, imageView),
      });
      const img = host.querySelector<HTMLImageElement>('.a2ui-leaf')!;
      expect(img.style.width, `variant=${c.variant}`).toBe(c.width);
      expect(img.style.height, `variant=${c.variant}`).toBe(c.height);
    }
  });

  it('updates src reactively without touching unchanged src', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { u: 'https://example.com/old.png' },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'Image',
              url: { path: '/u' },
              variant: 'icon',
            },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      Image: createDomComponent(imageBinder, imageView),
    });

    const img = host.querySelector<HTMLImageElement>('.a2ui-leaf')!;
    expect(img.getAttribute('src')).toBe('https://example.com/old.png');
    // variant is a static literal → icon box applied on first render
    expect(img.style.width).toBe('24px');
    expect(img.style.height).toBe('24px');

    // change url → src updates, variant box stays
    surface.dataModel.set('/u', 'https://example.com/new.png');
    expect(img.getAttribute('src')).toBe('https://example.com/new.png');
    expect(img.style.width).toBe('24px');
    expect(img.style.height).toBe('24px');
  });

  it('keeps src stable when only description changes', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { d: 'first' },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'Image',
              url: 'https://example.com/fix.png',
              description: { path: '/d' },
            },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      Image: createDomComponent(imageBinder, imageView),
    });

    const img = host.querySelector<HTMLImageElement>('.a2ui-leaf')!;
    expect(img.getAttribute('src')).toBe('https://example.com/fix.png');
    expect(img.getAttribute('alt')).toBe('first');

    // An update that only changes `description` must not touch `src`.
    surface.dataModel.set('/d', 'second');
    expect(img.getAttribute('src')).toBe('https://example.com/fix.png');
    expect(img.getAttribute('alt')).toBe('second');
  });
});
