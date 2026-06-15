import type { MediaProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView } from '../types';
import { LEAF_MARGIN } from '../helpers';

/**
 * Video leaf: `<video.a2ui-leaf>` with native controls. `src` is only written
 * when it changes (avoids a reload). Mirrors `VideoView` in
 * packages/a2ui-react/src/components.tsx.
 */
export const videoView: DomView<MediaProps> = {
  create(props): DomNodeMount {
    const el = document.createElement('video');
    let lastSrc: string | null = null;

    const apply = (p: MediaProps): void => {
      el.className = 'a2ui-leaf';
      if (p.url !== lastSrc) {
        el.src = p.url;
        lastSrc = p.url;
      }
      el.controls = true;
      el.style.margin = `${LEAF_MARGIN}px`;
      el.style.width = '100%';
    };

    apply(props);
    return {
      element: el,
      update: (next: unknown) => apply(next as MediaProps),
      dispose() {
        el.pause();
        el.removeAttribute('src');
      },
    };
  },
};
