import type { TextProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView } from '../types';
import { LEAF_MARGIN, TEXT_SIZE } from '../helpers';

/**
 * Text leaf: `<div.a2ui-leaf>` with typography driven by `variant`. Mirrors
 * `TextView` in packages/a2ui-react/src/components.tsx.
 */
export const textView: DomView<TextProps> = {
  create(props): DomNodeMount {
    const el = document.createElement('div');

    const apply = (p: TextProps): void => {
      const isHeading = p.variant.startsWith('h');
      el.className = 'a2ui-leaf';
      el.style.margin = `${LEAF_MARGIN}px`;
      el.style.fontSize = `${TEXT_SIZE[p.variant] ?? 1}em`;
      el.style.fontWeight = isHeading ? '600' : '400';
      el.style.fontStyle = p.variant === 'caption' ? 'italic' : 'normal';
      el.style.opacity = p.variant === 'caption' ? '0.7' : '1';
      el.style.color = 'inherit';
      el.textContent = p.text;
    };

    apply(props);
    return {
      element: el,
      update: (next: unknown) => apply(next as TextProps),
      dispose() {
        /* leaf: no listeners */
      },
    };
  },
};
