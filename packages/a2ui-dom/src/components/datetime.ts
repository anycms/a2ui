import type { DateTimeInputProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import { boundPath, LEAF_MARGIN } from '../helpers';

/** Resolve the native input `type` from enableDate/enableTime flags. */
function dateType(p: DateTimeInputProps): string {
  return p.enableDate && p.enableTime ? 'datetime-local' : p.enableDate ? 'date' : 'time';
}

/**
 * DateTimeInput leaf: `<input.a2ui-leaf>` whose `type` is driven by
 * enableDate/enableTime. Mirrors `DateTimeInputView` in
 * packages/a2ui-react/src/components.tsx. Two-way binds `value` on change.
 *
 * The focus guard in `update` avoids clobbering the field (and moving the
 * caret) while the user is typing into it.
 */
export const dateTimeInputView: DomView<DateTimeInputProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    const el = document.createElement('input');
    el.className = 'a2ui-leaf';
    el.style.margin = `${LEAF_MARGIN}px`;
    el.type = dateType(props);
    el.value = props.value;

    el.onchange = () => {
      const path = boundPath(viewCtx.ctx);
      if (path) viewCtx.ctx.set(path, el.value);
    };

    return {
      element: el,
      update: (next: unknown): void => {
        const p = next as DateTimeInputProps;
        el.type = dateType(p);
        if (document.activeElement !== el || el.value !== String(p.value)) {
          el.value = p.value;
        }
      },
      dispose() {
        el.onchange = null;
      },
    };
  },
};
