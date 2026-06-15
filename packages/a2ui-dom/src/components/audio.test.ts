import { describe, it, expect, vi } from 'vitest';
import { audioPlayerBinder, basicCatalogId } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { audioPlayerView } from './audio';

describe('Audio (dom)', () => {
  it('renders a controlled audio element with leaf styles', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'AudioPlayer', url: 'https://example.com/track.mp3' }],
        },
      },
    ]);
    const { host } = mount(mp.model.get('s')!, {
      AudioPlayer: createDomComponent(audioPlayerBinder, audioPlayerView),
    });

    const audio = host.querySelector<HTMLAudioElement>('.a2ui-leaf');
    expect(audio).toBeTruthy();
    expect(audio!.tagName).toBe('AUDIO');
    expect(audio!.controls).toBe(true);
    expect(audio!.getAttribute('src')).toBe('https://example.com/track.mp3');
    expect(audio!.style.margin).toBe('8px');
    expect(audio!.style.width).toBe('100%');
  });

  it('updates src reactively', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { u: 'https://example.com/a.mp3' },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'AudioPlayer', url: { path: '/u' } }],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      AudioPlayer: createDomComponent(audioPlayerBinder, audioPlayerView),
    });

    const audio = host.querySelector<HTMLAudioElement>('.a2ui-leaf')!;
    expect(audio.getAttribute('src')).toBe('https://example.com/a.mp3');

    surface.dataModel.set('/u', 'https://example.com/b.mp3');
    expect(audio.getAttribute('src')).toBe('https://example.com/b.mp3');
  });

  it('pauses and clears src on dispose', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Row', children: ['aud'] },
            { id: 'aud', component: 'AudioPlayer', url: 'https://example.com/track.mp3' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      AudioPlayer: createDomComponent(audioPlayerBinder, audioPlayerView),
    });

    const audio = host.querySelector<HTMLAudioElement>('.a2ui-leaf')!;
    const pauseSpy = vi.spyOn(audio, 'pause');
    expect(audio.getAttribute('src')).toBe('https://example.com/track.mp3');

    // Removing the AudioPlayer child triggers the slot's dispose path.
    surface.componentsModel.remove('aud');
    expect(pauseSpy).toHaveBeenCalled();
    // removeAttribute('src') → getAttribute returns null (not empty string).
    expect(audio.getAttribute('src')).toBeNull();
  });
});
