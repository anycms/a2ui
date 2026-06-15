import type { CheckBoxProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import { boundPath, LEAF_MARGIN } from '../helpers';

/**
 * CheckBox leaf: `<label.a2ui-leaf>` wrapping a native checkbox + label span.
 * Mirrors `CheckBoxView` in packages/a2ui-react/src/components.tsx. Two-way
 * binds `value` back to the bound `{path}` on change.
 */
export const checkBoxView: DomView<CheckBoxProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    const label = document.createElement('label');
    label.className = 'a2ui-leaf';
    label.style.margin = `${LEAF_MARGIN}px`;
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '6px';

    const input = document.createElement('input');
    input.type = 'checkbox';

    const span = document.createElement('span');

    label.appendChild(input);
    label.appendChild(span);

    const apply = (p: CheckBoxProps): void => {
      input.checked = p.value;
      span.textContent = p.label ?? '';
    };

    apply(props);

    input.onchange = () => {
      const path = boundPath(viewCtx.ctx);
      if (path) viewCtx.ctx.set(path, input.checked);
    };

    return {
      element: label,
      update: (next: unknown) => apply(next as CheckBoxProps),
      dispose() {
        input.onchange = null;
      },
    };
  },
};
