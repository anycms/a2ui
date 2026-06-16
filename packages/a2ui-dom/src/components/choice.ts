import type { ChoicePickerProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import { LEAF_MARGIN, boundPath, applyCheckError, createCheckErrorEl } from '../helpers';

/**
 * ChoicePicker leaf: a flex-wrap row of `<label>` options, each an `<input>`
 * (radio when exclusive, checkbox otherwise) plus a `<span>` label. On update,
 * if the option VALUES set changed we rebuild all labels; otherwise we only
 * refresh each `input.checked` from the current value. Event handlers read
 * mutable instance state (`currentValue` / `variant`), updated each `update` —
 * this is the vanilla analogue of React closing over the latest render.
 * Mirrors `ChoicePickerView` in packages/a2ui-react/src/components.tsx.
 */
export const choicePickerView: DomView<ChoicePickerProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    const el = document.createElement('div');
    el.className = 'a2ui-leaf';
    el.style.margin = `${LEAF_MARGIN}px`;
    el.style.display = 'flex';
    el.style.flexWrap = 'wrap';

    // Mutable instance state read by event handlers — updated in `update`.
    let currentValue: string[] = props.value;
    let variant: string | undefined = props.variant;
    let displayStyle: string | undefined = props.displayStyle;
    let options: ChoicePickerProps['options'] = props.options;
    let optionsKey: string = props.options.map((o) => o.value).join('\n');

    const exclusive = (): boolean => variant === 'mutuallyExclusive';

    const toggle = (value: string, checked: boolean): void => {
      const path = boundPath(viewCtx.ctx);
      if (!path) return;
      if (exclusive()) {
        viewCtx.ctx.set(path, value);
      } else {
        const cur = Array.isArray(currentValue) ? currentValue : [];
        viewCtx.ctx.set(path, checked ? [...cur, value] : cur.filter((v) => v !== value));
      }
    };

    const buildLabel = (o: { label: string; value: string }): HTMLLabelElement => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '4px';

      const input = document.createElement('input');
      input.type = exclusive() ? 'radio' : 'checkbox';
      const selected = exclusive()
        ? currentValue[0] === o.value
        : currentValue.includes(o.value);
      input.checked = selected;
      input.onchange = () => toggle(o.value, input.checked);

      const span = document.createElement('span');
      span.textContent = o.label;

      label.appendChild(input);
      label.appendChild(span);
      return label;
    };

    const applyGap = (): void => {
      el.style.gap = displayStyle === 'chips' ? '6px' : '2px';
    };

    // Persistent error element (kept separate from the option labels so that
    // `renderAll` can rebuild labels without dropping it).
    const errorEl = createCheckErrorEl();
    errorEl.style.flexBasis = '100%';

    const renderAll = (): void => {
      // Remove only the option labels, preserving the error element.
      for (const node of Array.from(el.children)) {
        if (node !== errorEl) el.removeChild(node);
      }
      // Re-insert labels before the error element so it stays at the bottom.
      for (const o of options) el.insertBefore(buildLabel(o), errorEl);
    };

    applyGap();
    // errorEl must be a child of `el` before the first renderAll, since
    // renderAll re-inserts labels before it to keep it at the bottom.
    el.appendChild(errorEl);
    renderAll();
    applyCheckError(errorEl, props.checks);

    return {
      element: el,
      update(next: unknown): void {
        const p = next as ChoicePickerProps;
        currentValue = p.value;
        const variantChanged = variant !== p.variant;
        variant = p.variant;
        options = p.options;

        // Rebuild only if the option VALUE SET changed; else just refresh checks.
        const nextValuesKey = p.options.map((o) => o.value).join('\n');
        const optionsChanged = optionsKey !== nextValuesKey;
        optionsKey = nextValuesKey;
        if (optionsChanged || variantChanged) {
          renderAll();
        } else {
          // refresh each input in place from currentValue
          const labels = el.querySelectorAll('label');
          let i = 0;
          labels.forEach((labelEl) => {
            const o = p.options[i++];
            if (!o) return;
            const input = labelEl.querySelector('input');
            if (!input) return;
            input.checked = exclusive()
              ? currentValue[0] === o.value
              : currentValue.includes(o.value);
          });
        }

        if (displayStyle !== p.displayStyle) {
          displayStyle = p.displayStyle;
          applyGap();
        }

        applyCheckError(errorEl, p.checks);
      },
      dispose(): void {
        /* leaf: onchange dies with the elements */
      },
    };
  },
};
