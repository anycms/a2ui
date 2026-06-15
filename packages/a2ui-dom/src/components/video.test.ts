import { describe, it, expect, vi } from 'vitest';
import { videoBinder, basicCatalogId } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { videoView } from './video';

describe('Video (dom)', () => {
  it('renders a controlled video element with leaf styles', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'Video', url: 'https://example.com/clip.mp4' }],
        },
      },
    ]);
    const { host } = mount(mp.model.get('s')!, {
      Video: createDomComponent(videoBinder, videoView),
    });

    const video = host.querySelector<HTMLVideoElement>('.a2ui-leaf');
    expect(video).toBeTruthy();
    expect(video!.tagName).toBe('VIDEO');
    expect(video!.controls).toBe(true);
    expect(video!.getAttribute('src')).toBe('https://example.com/clip.mp4');
    expect(video!.style.margin).toBe('8px');
    expect(video!.style.width).toBe('100%');
  });

  it('updates src reactively', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { u: 'https://example.com/a.mp4' },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'Video', url: { path: '/u' } }],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      Video: createDomComponent(videoBinder, videoView),
    });

    const video = host.querySelector<HTMLVideoElement>('.a2ui-leaf')!;
    expect(video.getAttribute('src')).toBe('https://example.com/a.mp4');

    surface.dataModel.set('/u', 'https://example.com/b.mp4');
    expect(video.getAttribute('src')).toBe('https://example.com/b.mp4');
  });

  it('pauses and clears src on dispose', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Row', children: ['vid'] },
            { id: 'vid', component: 'Video', url: 'https://example.com/clip.mp4' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      Video: createDomComponent(videoBinder, videoView),
    });

    const video = host.querySelector<HTMLVideoElement>('.a2ui-leaf')!;
    const pauseSpy = vi.spyOn(video, 'pause');
    expect(video.getAttribute('src')).toBe('https://example.com/clip.mp4');

    // Removing the Video child triggers the slot's dispose path, which calls
    // the view's dispose (pause + removeAttribute('src')).
    surface.componentsModel.remove('vid');
    // jsdom keeps the element reference alive; verify the dispose side-effects ran.
    expect(pauseSpy).toHaveBeenCalled();
    // removeAttribute('src') → getAttribute returns null (not empty string).
    expect(video.getAttribute('src')).toBeNull();
  });
});
