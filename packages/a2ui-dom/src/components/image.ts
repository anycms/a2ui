import type { ImageProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView } from '../types';
import { IMAGE_FIT, LEAF_MARGIN } from '../helpers';

/**
 * Image leaf: `<img.a2ui-leaf>` with object-fit driven by `fit` and a fixed
 * size box driven by `variant`. Mirrors `ImageView` in
 * packages/a2ui-react/src/components.tsx.
 */
export const imageView: DomView<ImageProps> = {
  create(props): DomNodeMount {
    const el = document.createElement('img');
    // Track the last-set url so we only write `src` when it actually changes,
    // avoiding a reload flicker on otherwise-identical updates.
    let lastSrc: string | null = null;

    const applyVariantSize = (variant: string): void => {
      switch (variant) {
        case 'icon':
          el.style.width = '24px';
          el.style.height = '24px';
          break;
        case 'avatar':
          el.style.width = '40px';
          el.style.height = '40px';
          el.style.borderRadius = '50%';
          break;
        case 'smallFeature':
          el.style.width = '100px';
          el.style.height = '100px';
          break;
        case 'largeFeature':
          el.style.width = '100%';
          el.style.maxHeight = '400px';
          break;
        case 'header':
          el.style.width = '100%';
          el.style.height = '200px';
          break;
        case 'mediumFeature':
        default:
          el.style.maxWidth = '300px';
          break;
      }
    };

    const apply = (p: ImageProps): void => {
      el.className = 'a2ui-leaf';
      if (p.url !== lastSrc) {
        el.src = p.url;
        lastSrc = p.url;
      }
      el.alt = p.description ?? '';
      el.style.margin = `${LEAF_MARGIN}px`;
      el.style.objectFit = IMAGE_FIT[p.fit ?? 'fill'];
      applyVariantSize(p.variant ?? 'mediumFeature');
    };

    apply(props);
    return {
      element: el,
      update: (next: unknown) => apply(next as ImageProps),
      dispose() {
        /* leaf: no listeners */
      },
    };
  },
};
