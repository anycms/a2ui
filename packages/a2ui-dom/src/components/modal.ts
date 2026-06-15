import type { ModalProps } from '@anycms/a2ui-core';
import type { ChildNodeRef } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import { childKey } from '../helpers';

/**
 * Modal: an inline `<span>` trigger host plus a lazily-shown fixed overlay.
 * `isOpen` lives in the closure and survives `update`. The overlay is appended
 * to `document.body` (NOT inside the surface tree) so it escapes any
 * overflow/transform clipping; mounts are kept alive across hide/show so the
 * content's own state is preserved. Mirrors `ModalView` in
 * packages/a2ui-react/src/components.tsx.
 */
export const modalView: DomView<ModalProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    const span = document.createElement('span');

    // --- overlay (built up-front, appended to body only while open) ---
    const overlay = document.createElement('div');
    overlay.className = 'a2ui-modal';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000';

    const inner = document.createElement('div');
    inner.style.background = '#fff';
    inner.style.padding = '16px';
    inner.style.borderRadius = '8px';
    overlay.appendChild(inner);

    // --- local UI state ---
    let isOpen = false;
    let currentProps: ModalProps = props;
    let triggerMount: DomNodeMount | null = null;
    let triggerKey: string | null = null;
    let contentMount: DomNodeMount | null = null;
    let contentKey: string | null = null;

    const mountTrigger = (ref: ChildNodeRef): void => {
      if (triggerMount) {
        triggerMount.dispose();
        if (triggerMount.element.parentNode === span) span.removeChild(triggerMount.element);
        triggerMount = null;
        triggerKey = null;
      }
      triggerMount = viewCtx.buildChild(ref);
      span.appendChild(triggerMount.element);
      triggerKey = childKey(ref);
    };

    const mountContent = (ref: ChildNodeRef): void => {
      if (contentMount) {
        contentMount.dispose();
        if (contentMount.element.parentNode === inner) inner.removeChild(contentMount.element);
        contentMount = null;
        contentKey = null;
      }
      contentMount = viewCtx.buildChild(ref);
      inner.appendChild(contentMount.element);
      contentKey = childKey(ref);
    };

    const showOverlay = (): void => {
      // Ensure content is mounted (lazily, only when first shown).
      const contentRef = currentProps.content;
      if (contentRef && !contentMount) {
        mountContent(contentRef);
      }
      if (!overlay.parentNode) {
        document.body.appendChild(overlay);
      }
    };

    const hideOverlay = (): void => {
      // Keep mounts alive for re-show.
      overlay.remove();
    };

    // Initial trigger.
    if (props.trigger) mountTrigger(props.trigger);

    // Clicking the trigger span opens the overlay. Clicks inside the trigger
    // bubble to the span, so a button trigger still opens the modal.
    span.onclick = () => {
      if (!isOpen) {
        isOpen = true;
        showOverlay();
      }
    };
    overlay.onclick = () => {
      isOpen = false;
      hideOverlay();
    };
    inner.onclick = (e) => {
      e.stopPropagation();
    };

    return {
      element: span,
      update(next: unknown): void {
        const p = next as ModalProps;
        currentProps = p;
        // Re-mount trigger if its ref changed.
        const newTriggerKey = p.trigger ? childKey(p.trigger) : null;
        if (newTriggerKey !== triggerKey) {
          if (p.trigger) mountTrigger(p.trigger);
          else if (triggerMount) {
            triggerMount.dispose();
            if (triggerMount.element.parentNode === span) span.removeChild(triggerMount.element);
            triggerMount = null;
            triggerKey = null;
          }
        }
        // Re-mount content if its ref changed (only present while open, but
        // harmless to track regardless).
        const newContentKey = p.content ? childKey(p.content) : null;
        if (newContentKey !== contentKey) {
          if (p.content && isOpen) {
            mountContent(p.content);
          } else if (contentMount) {
            contentMount.dispose();
            if (contentMount.element.parentNode === inner) inner.removeChild(contentMount.element);
            contentMount = null;
            contentKey = null;
          }
        }
        // isOpen preserved across updates.
      },
      dispose(): void {
        if (triggerMount) {
          triggerMount.dispose();
          triggerMount = null;
          triggerKey = null;
        }
        if (contentMount) {
          contentMount.dispose();
          contentMount = null;
          contentKey = null;
        }
        overlay.remove();
      },
    };
  },
};
