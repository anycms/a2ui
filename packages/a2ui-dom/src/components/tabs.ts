import type { TabsProps } from '@anycms/a2ui-core';
import type { DomNodeMount, DomView, DomViewContext } from '../types';
import { LEAF_MARGIN, childKey } from '../helpers';

/**
 * Tabs: outer `<div.a2ui-leaf>` with a tab-bar `<div>` and a content `<div>`.
 * Local UI state (`selectedIdx`) lives in the closure and is NOT reset by
 * `update` — switching tabs and then receiving a prop change keeps the selected
 * tab (the vanilla analogue of React's `useState`). Mirrors `TabsView` in
 * packages/a2ui-react/src/components.tsx.
 */
export const tabsView: DomView<TabsProps> = {
  create(props, viewCtx: DomViewContext): DomNodeMount {
    const el = document.createElement('div');
    el.className = 'a2ui-leaf';
    el.style.margin = `${LEAF_MARGIN}px`;

    const tabBar = document.createElement('div');
    tabBar.style.display = 'flex';
    tabBar.style.borderBottom = '1px solid #ccc';

    const content = document.createElement('div');
    content.style.padding = `${LEAF_MARGIN}px`;

    el.appendChild(tabBar);
    el.appendChild(content);

    // --- local UI state (survives update) ---
    let selectedIdx = 0;
    let currentProps: TabsProps = props;
    let contentMount: DomNodeMount | null = null;
    let contentKey: string | null = null;

    const renderTabBar = (): void => {
      tabBar.innerHTML = '';
      currentProps.tabs.forEach((tab, i) => {
        const btn = document.createElement('button');
        btn.textContent = tab.title;
        btn.style.padding = '6px 12px';
        btn.style.border = 'none';
        btn.style.background = 'none';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = i === selectedIdx ? '700' : '400';
        btn.onclick = () => {
          selectedIdx = i;
          renderTabBar();
          renderContent();
        };
        tabBar.appendChild(btn);
      });
    };

    const renderContent = (): void => {
      if (contentMount) {
        contentMount.dispose();
        if (contentMount.element.parentNode === content) {
          content.removeChild(contentMount.element);
        }
        contentMount = null;
        contentKey = null;
      }
      const child = currentProps.tabs[selectedIdx]?.child;
      if (child) {
        contentMount = viewCtx.buildChild(child);
        content.appendChild(contentMount.element);
        contentKey = childKey(child);
      }
    };

    renderTabBar();
    renderContent();

    return {
      element: el,
      update(next: unknown): void {
        const p = next as TabsProps;
        currentProps = p;
        // Clamp selectedIdx into the new tab range (and >= 0); do NOT reset it.
        selectedIdx = Math.min(Math.max(selectedIdx, 0), p.tabs.length - 1);
        renderTabBar();
        // Only re-render content when the selected tab's child identity changed.
        const child = p.tabs[selectedIdx]?.child;
        const newKey = child ? childKey(child) : null;
        if (newKey !== contentKey) {
          renderContent();
        }
      },
      dispose(): void {
        if (contentMount) {
          contentMount.dispose();
          contentMount = null;
          contentKey = null;
        }
      },
    };
  },
};
