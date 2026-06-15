import type { ListProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import { reconcileChildren } from '../helpers';

/**
 * List container: `<div.a2ui-list>` flex container whose direction (and the
 * corresponding overflow axis) is driven by `props.direction`. Children are
 * mounted via `reconcileChildren`, which keys them by `${basePath}::${id}` so
 * template items disambiguate and persistent children keep their DOM/focus/state.
 * Mirrors `ListView` in packages/a2ui-react/src/components.tsx.
 */
export const listView: DomView<ListProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    const el = document.createElement('div');
    const cache = new Map<string, DomNodeMount>();

    const apply = (p: ListProps): void => {
      const horizontal = p.direction === 'horizontal';
      el.className = 'a2ui-list';
      el.style.display = 'flex';
      el.style.flexDirection = horizontal ? 'row' : 'column';
      el.style.overflowX = horizontal ? 'auto' : 'hidden';
      el.style.overflowY = horizontal ? 'hidden' : 'auto';
      reconcileChildren(el, cache, p.children, viewCtx.buildChild);
    };

    apply(props);
    return {
      element: el,
      update: (next: unknown) => apply(next as ListProps),
      dispose() {
        for (const m of cache.values()) m.dispose();
        cache.clear();
      },
    };
  },
};
