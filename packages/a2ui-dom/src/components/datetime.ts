import type { DateTimeInputProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import { boundPath, LEAF_MARGIN, applyCheckError, createCheckErrorEl } from '../helpers';

/** Resolve the native input `type` from enableDate/enableTime flags. */
function dateType(p: DateTimeInputProps): string {
  return p.enableDate && p.enableTime ? 'datetime-local' : p.enableDate ? 'date' : 'time';
}

/**
 * DateTimeInput leaf: an `<input.a2ui-leaf>` whose `type` is driven by
 * enableDate/enableTime, wrapped in a stable `<div>` that also hosts the check
 * error element (an `<input>` can't have children). Mirrors `DateTimeInputView`
 * in packages/a2ui-react/src/components.tsx. Two-way binds `value` on change.
 *
 * The focus guard in `update` avoids clobbering the field (and moving the
 * caret) while the user is typing into it.
 */
export const dateTimeInputView: DomView<DateTimeInputProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    // Stable wrapper is the mount's `element`; the inner input can be swapped
    // if needed but stays identity-stable across updates here.
    const wrapper = document.createElement('div');
    wrapper.className = 'a2ui-leaf';

    const el = document.createElement('input');
    el.className = 'a2ui-leaf';
    el.style.margin = `${LEAF_MARGIN}px`;
    el.type = dateType(props);
    el.value = props.value;

    const errorEl = createCheckErrorEl();
    wrapper.appendChild(el);
    wrapper.appendChild(errorEl);
    applyCheckError(errorEl, props.checks);

    el.onchange = () => {
      const path = boundPath(viewCtx.ctx);
      if (path) viewCtx.ctx.set(path, el.value);
    };

    return {
      element: wrapper,
      update: (next: unknown): void => {
        const p = next as DateTimeInputProps;
        el.type = dateType(p);
        if (document.activeElement !== el || el.value !== String(p.value)) {
          el.value = p.value;
        }
        applyCheckError(errorEl, p.checks);
      },
      dispose() {
        el.onchange = null;
      },
    };
  },
};
