import type { TextFieldProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import { LEAF_MARGIN, TEXTFIELD_TYPE, boundPath } from '../helpers';

/**
 * TextField leaf. Because `variant` can switch `<input>` <-> `<textarea>` and a
 * mount's root element identity is fixed (`DomNodeMount.element` is readonly),
 * we use a STABLE wrapper `<div.a2ui-leaf>` as `element` and swap the inner
 * control in place when the tag changes. The focus guard avoids clobbering the
 * DOM value (and caret) while the user is actively editing. Mirrors
 * `TextFieldView` in packages/a2ui-react/src/components.tsx.
 */
export const textFieldView: DomView<TextFieldProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    const wrapper = document.createElement('div');
    wrapper.className = 'a2ui-leaf';
    wrapper.style.margin = `${LEAF_MARGIN}px`;

    const buildControl = (p: TextFieldProps): HTMLInputElement | HTMLTextAreaElement => {
      let ctrl: HTMLInputElement | HTMLTextAreaElement;
      if (p.variant === 'longText') {
        const ta = document.createElement('textarea');
        ta.style.width = '100%';
        ta.style.minHeight = '80px';
        ctrl = ta;
      } else {
        const input = document.createElement('input');
        input.type = TEXTFIELD_TYPE[p.variant] ?? 'text';
        ctrl = input;
      }
      ctrl.value = p.value;
      ctrl.placeholder = p.label ?? '';
      ctrl.oninput = () => {
        const path = boundPath(viewCtx.ctx);
        if (path) viewCtx.ctx.set(path, ctrl.value);
      };
      return ctrl;
    };

    let control: HTMLInputElement | HTMLTextAreaElement = buildControl(props);
    // Last-applied variant; compared on update to detect a tag switch. The tag
    // check below (control.tagName) is the authoritative signal, but we keep
    // `variant` to mirror the contract and aid debugging.
    let variant: string = props.variant;
    void variant;
    wrapper.appendChild(control);

    return {
      element: wrapper,
      update(next: unknown): void {
        const p = next as TextFieldProps;
        const requiredTag = p.variant === 'longText' ? 'TEXTAREA' : 'INPUT';
        if (control.tagName !== requiredTag) {
          // Variant flipped the tag — rebuild the control, copy state, re-wire.
          const newControl = buildControl(p);
          control.replaceWith(newControl);
          control = newControl;
          variant = p.variant;
          // Fresh control: set value/placeholder unconditionally.
          control.value = p.value;
          control.placeholder = p.label ?? '';
          return;
        }
        // Focus guard: don't disrupt an actively-edited field.
        if (document.activeElement !== control || control.value !== p.value) {
          control.value = p.value;
        }
        control.placeholder = p.label ?? '';
        variant = p.variant;
      },
      dispose(): void {
        /* leaf: no listeners beyond oninput, which dies with the element */
      },
    };
  },
};
