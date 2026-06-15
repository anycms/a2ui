import type { ContainerProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import { ALIGN, JUSTIFY, reconcileChildren } from '../helpers';

/**
 * Row container: `<div.a2ui-row>` flex-row. Children are mounted via
 * `reconcileChildren`, which keys them by `${basePath}::${id}` so template
 * items disambiguate and persistent children keep their DOM/focus/state.
 * Mirrors `RowView` in packages/a2ui-react/src/components.tsx.
 */
export const rowView: DomView<ContainerProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    const el = document.createElement('div');
    const cache = new Map<string, DomNodeMount>();

    const apply = (p: ContainerProps): void => {
      el.className = 'a2ui-row';
      el.style.display = 'flex';
      el.style.flexDirection = 'row';
      el.style.justifyContent = JUSTIFY[p.justify ?? 'start'];
      el.style.alignItems = ALIGN[p.align ?? 'start'];
      reconcileChildren(el, cache, p.children, viewCtx.buildChild);
    };

    apply(props);
    return {
      element: el,
      update: (next: unknown) => apply(next as ContainerProps),
      dispose() {
        for (const m of cache.values()) m.dispose();
        cache.clear();
      },
    };
  },
};
