import type { CardProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import { LEAF_MARGIN, childKey } from '../helpers';

/**
 * Card leaf: `<div.a2ui-leaf>` with a 1px border, 8px radius and 12px padding,
 * wrapping a single optional child. The child is mounted via `buildChild` and
 * reconciled by its `${basePath}::${id}` key: an unchanged child self-updates,
 * a changed child is disposed and re-mounted in place, and a child going to
 * `null` is disposed and removed. Mirrors `CardView` in
 * packages/a2ui-react/src/components.tsx.
 */
export const cardView: DomView<CardProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    const el = document.createElement('div');
    let current: { key: string; mount: DomNodeMount } | null = null;

    const apply = (p: CardProps): void => {
      el.className = 'a2ui-leaf';
      el.style.margin = `${LEAF_MARGIN}px`;
      el.style.border = '1px solid #ccc';
      el.style.borderRadius = '8px';
      el.style.padding = '12px';

      const nextKey = p.child ? childKey(p.child) : '';

      // Unchanged child (and not null): the child self-updates; nothing to do.
      if (current && current.key === nextKey && nextKey !== '') return;

      if (!p.child) {
        // Child removed: dispose + remove the existing mount, if any.
        if (current) {
          if (current.mount.element.parentNode === el) el.removeChild(current.mount.element);
          current.mount.dispose();
          current = null;
        }
        return;
      }

      // Child changed (or first mount): dispose the old, mount the new.
      if (current) {
        if (current.mount.element.parentNode === el) el.removeChild(current.mount.element);
        current.mount.dispose();
        current = null;
      }
      const childMount = viewCtx.buildChild(p.child);
      el.appendChild(childMount.element);
      current = { key: nextKey, mount: childMount };
    };

    apply(props);
    return {
      element: el,
      update: (next: unknown) => apply(next as CardProps),
      dispose() {
        current?.mount.dispose();
        current = null;
      },
    };
  },
};
