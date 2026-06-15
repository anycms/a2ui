import { describe, it, expect } from 'vitest';
import { modalBinder, textBinder, basicCatalogId } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { modalView } from './modal';
import { textView } from './text';

describe('Modal (dom)', () => {
  it('shows an overlay on trigger click and removes it on overlay click', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'Modal',
              trigger: 'trig',
              content: 'cnt',
            },
            { id: 'trig', component: 'Text', text: 'Open' },
            { id: 'cnt', component: 'Text', text: 'ModalBody' },
          ],
        },
      },
    ]);
    const { host } = mount(mp.model.get('s')!, {
      Modal: createDomComponent(modalBinder, modalView),
      Text: createDomComponent(textBinder, textView),
    });

    // Trigger rendered; no overlay yet (overlay lives on document.body).
    expect(host.textContent).toContain('Open');
    expect(document.body.querySelector('.a2ui-modal')).toBeNull();

    // Click the trigger span -> overlay appended to body.
    const triggerSpan = host.querySelector('span');
    expect(triggerSpan).toBeTruthy();
    triggerSpan!.click();

    const overlay = document.body.querySelector('.a2ui-modal');
    expect(overlay).toBeTruthy();
    expect(overlay!.textContent).toContain('ModalBody');

    // Click the overlay -> removed.
    (overlay as HTMLElement).click();
    expect(document.body.querySelector('.a2ui-modal')).toBeNull();
  });

  it('does not close when clicking inside the modal content (stopPropagation)', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'Modal',
              trigger: 'trig',
              content: 'cnt',
            },
            { id: 'trig', component: 'Text', text: 'Open' },
            { id: 'cnt', component: 'Text', text: 'ModalBody' },
          ],
        },
      },
    ]);
    const { host } = mount(mp.model.get('s')!, {
      Modal: createDomComponent(modalBinder, modalView),
      Text: createDomComponent(textBinder, textView),
    });

    host.querySelector('span')!.click();
    const overlay = document.body.querySelector('.a2ui-modal') as HTMLElement;
    expect(overlay).toBeTruthy();

    // Click the inner panel (first child div of overlay) — must NOT close.
    const inner = overlay.querySelector('div') as HTMLElement;
    inner.click();
    expect(document.body.querySelector('.a2ui-modal')).toBeTruthy();

    // Click the overlay backdrop itself — closes.
    overlay.click();
    expect(document.body.querySelector('.a2ui-modal')).toBeNull();
  });

  it('keeps the overlay mounted and can re-show after closing (isOpen preserved)', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'Modal',
              trigger: 'trig',
              content: 'cnt',
            },
            { id: 'trig', component: 'Text', text: 'Open' },
            { id: 'cnt', component: 'Text', text: 'ModalBody' },
          ],
        },
      },
    ]);
    const { host } = mount(mp.model.get('s')!, {
      Modal: createDomComponent(modalBinder, modalView),
      Text: createDomComponent(textBinder, textView),
    });

    // Open, then close.
    host.querySelector('span')!.click();
    expect(document.body.querySelector('.a2ui-modal')).toBeTruthy();
    (document.body.querySelector('.a2ui-modal') as HTMLElement).click();
    expect(document.body.querySelector('.a2ui-modal')).toBeNull();

    // Re-open: trigger still works, content still present (mounts kept alive).
    host.querySelector('span')!.click();
    const overlay = document.body.querySelector('.a2ui-modal');
    expect(overlay).toBeTruthy();
    expect(overlay!.textContent).toContain('ModalBody');
  });
});
