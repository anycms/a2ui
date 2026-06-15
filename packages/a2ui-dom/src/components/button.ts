import type { ButtonProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import {
  applyButtonVariant,
  dispatchButtonAction,
  LEAF_MARGIN,
  type ButtonAction,
} from '../helpers';

/**
 * Button leaf: `<button.a2ui-leaf>` with a variant style + an optional single
 * child. Mirrors `ButtonView` in packages/a2ui-react/src/components.tsx.
 *
 * Because the DOM instance persists across prop updates, the click handler
 * reads `currentAction` (an instance variable refreshed in `update`) rather
 * than a stale create-time capture — the vanilla analogue of React re-reading
 * `props.action` on every render.
 */
export const buttonView: DomView<ButtonProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    const el = document.createElement('button');
    el.className = 'a2ui-leaf';

    // Child mount (single child, owned by this view).
    let childMount: DomNodeMount | null = null;
    let childKey: string | null = null;

    // Current action — refreshed in `update` so the click handler always
    // dispatches the live action, not a create-time snapshot.
    let currentAction: ButtonAction = props.action as ButtonAction;

    const apply = (p: ButtonProps): void => {
      el.disabled = p.disabled;
      el.style.margin = `${LEAF_MARGIN}px`;
      el.style.padding = '6px 14px';
      el.style.borderRadius = '6px';
      el.style.cursor = p.disabled ? 'not-allowed' : 'pointer';
      applyButtonVariant(el, p.variant);

      currentAction = p.action as ButtonAction;

      // Re-mount the child only if its ref identity changed.
      const ref = p.child;
      const key = ref ? `${ref.basePath}::${ref.id}` : null;
      if (key !== childKey) {
        if (childMount) {
          if (childMount.element.parentNode === el) el.removeChild(childMount.element);
          childMount.dispose();
          childMount = null;
        }
        childKey = key;
        if (ref) {
          childMount = viewCtx.buildChild(ref);
          el.appendChild(childMount.element);
        }
      }
    };

    apply(props);

    el.onclick = () => {
      if (el.disabled) return;
      dispatchButtonAction(viewCtx.ctx, currentAction);
    };

    return {
      element: el,
      update: (next: unknown) => apply(next as ButtonProps),
      dispose() {
        el.onclick = null;
        childMount?.dispose();
        childMount = null;
        childKey = null;
      },
    };
  },
};
