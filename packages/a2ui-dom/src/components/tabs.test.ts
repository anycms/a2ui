import { describe, it, expect } from 'vitest';
import { tabsBinder, textBinder, basicCatalogId } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { tabsView } from './tabs';
import { textView } from './text';

describe('Tabs (dom)', () => {
  it('renders the first tab content and switches on click', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'Tabs',
              tabs: [
                { title: 'One', child: 'a' },
                { title: 'Two', child: 'b' },
              ],
            },
            { id: 'a', component: 'Text', text: 'Alpha' },
            { id: 'b', component: 'Text', text: 'Beta' },
          ],
        },
      },
    ]);
    const { host } = mount(mp.model.get('s')!, {
      Tabs: createDomComponent(tabsBinder, tabsView),
      Text: createDomComponent(textBinder, textView),
    });

    // Tab 1 content is shown initially.
    expect(host.textContent).toContain('Alpha');
    expect(host.textContent).not.toContain('Beta');

    const buttons = host.querySelectorAll<HTMLButtonElement>('.a2ui-leaf button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].style.fontWeight).toBe('700'); // first selected
    expect(buttons[1].style.fontWeight).toBe('400');

    // Click tab 2. renderTabBar rebuilds the buttons in place, so re-query.
    buttons[1].click();
    expect(host.textContent).not.toContain('Alpha');
    expect(host.textContent).toContain('Beta');
    const buttonsAfter = host.querySelectorAll<HTMLButtonElement>('.a2ui-leaf button');
    expect(buttonsAfter[1].style.fontWeight).toBe('700');
    expect(buttonsAfter[0].style.fontWeight).toBe('400');
  });

  it('preserves selectedIdx across a reactive prop update (bound title)', () => {
    // Bind tab-1's title to a path so the propsStream re-emits when the data
    // changes — static literal prop changes don't register a reactive dependency,
    // so a bound path is the canonical way to drive an `update`.
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { t1: 'One' },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'Tabs',
              tabs: [
                { title: { path: '/t1' }, child: 'a' },
                { title: 'Two', child: 'b' },
              ],
            },
            { id: 'a', component: 'Text', text: 'Alpha' },
            { id: 'b', component: 'Text', text: 'Beta' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      Tabs: createDomComponent(tabsBinder, tabsView),
      Text: createDomComponent(textBinder, textView),
    });

    // Switch to tab 2.
    let buttons = host.querySelectorAll<HTMLButtonElement>('.a2ui-leaf button');
    buttons[1].click();
    expect(host.textContent).toContain('Beta');
    expect(host.textContent).not.toContain('Alpha');

    // Drive a prop update by changing tab-1's bound title.
    surface.dataModel.set('/t1', 'Renamed');

    // The selected tab must remain tab 2 (Beta still shown, Alpha not).
    expect(host.textContent).toContain('Beta');
    expect(host.textContent).not.toContain('Alpha');
    // Tab-1 button text updated; tab 2 still bold.
    buttons = host.querySelectorAll<HTMLButtonElement>('.a2ui-leaf button');
    expect(buttons[0].textContent).toBe('Renamed');
    expect(buttons[1].style.fontWeight).toBe('700');
    expect(buttons[0].style.fontWeight).toBe('400');
  });
});

