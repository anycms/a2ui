import type { DividerProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView } from '../types';
import { LEAF_MARGIN } from '../helpers';

/**
 * Divider leaf: `<hr.a2ui-leaf>` rendered as a 1px line, vertical or
 * horizontal depending on `axis`. Mirrors `DividerView` in
 * packages/a2ui-react/src/components.tsx.
 */
export const dividerView: DomView<DividerProps> = {
  create(props): DomNodeMount {
    const el = document.createElement('hr');

    const apply = (p: DividerProps): void => {
      el.className = 'a2ui-leaf';
      el.style.margin = `${LEAF_MARGIN}px`;
      if (p.axis === 'vertical') {
        el.style.width = '1px';
        el.style.alignSelf = 'stretch';
        el.style.border = 'none';
        el.style.borderLeft = '1px solid #ccc';
        // Clear any horizontal-only rule left from a prior update.
        el.style.borderTop = '';
      } else {
        el.style.width = '100%';
        el.style.border = 'none';
        el.style.borderTop = '1px solid #ccc';
        // Clear vertical-only rules.
        el.style.alignSelf = '';
        el.style.borderLeft = '';
      }
    };

    apply(props);
    return {
      element: el,
      update: (next: unknown) => apply(next as DividerProps),
      dispose() {
        /* leaf: no listeners */
      },
    };
  },
};
