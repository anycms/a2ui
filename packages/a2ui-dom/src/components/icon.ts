import type { IconProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView } from '../types';
import { LEAF_MARGIN } from '../helpers';

/**
 * Icon leaf: `<span.a2ui-leaf>` rendering a fixed diamond glyph, with the icon
 * name exposed via the `title` attribute. Mirrors `IconView` in
 * packages/a2ui-react/src/components.tsx.
 */
export const iconView: DomView<IconProps> = {
  create(props): DomNodeMount {
    const el = document.createElement('span');

    const apply = (p: IconProps): void => {
      el.className = 'a2ui-leaf';
      el.textContent = '◆';
      el.style.margin = `${LEAF_MARGIN}px`;
      el.style.display = 'inline-block';
      el.style.color = 'inherit';
      el.title = p.name;
    };

    apply(props);
    return {
      element: el,
      update: (next: unknown) => apply(next as IconProps),
      dispose() {
        /* leaf: no listeners */
      },
    };
  },
};
