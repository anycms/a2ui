import type { SliderProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import { boundPath, LEAF_MARGIN } from '../helpers';

/**
 * Slider leaf: `<label.a2ui-leaf>` wrapping a native range input + a value
 * span. Mirrors `SliderView` in packages/a2ui-react/src/components.tsx.
 * Two-way binds `value` (as a number) on input, and keeps the span in sync.
 */
export const sliderView: DomView<SliderProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    const label = document.createElement('label');
    label.className = 'a2ui-leaf';
    label.style.margin = `${LEAF_MARGIN}px`;
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '8px';

    const input = document.createElement('input');
    input.type = 'range';

    const span = document.createElement('span');

    label.appendChild(input);
    label.appendChild(span);

    const apply = (p: SliderProps): void => {
      input.min = String(p.min);
      input.max = String(p.max);
      if (document.activeElement !== input || input.value !== String(p.value)) {
        input.value = String(p.value);
      }
      span.textContent = String(p.value);
    };

    apply(props);

    input.oninput = () => {
      const path = boundPath(viewCtx.ctx);
      if (path) viewCtx.ctx.set(path, input.valueAsNumber);
      span.textContent = input.value;
    };

    return {
      element: label,
      update: (next: unknown) => apply(next as SliderProps),
      dispose() {
        input.oninput = null;
      },
    };
  },
};
