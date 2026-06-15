import type { ComponentBinder, ComponentContext, ChildNodeRef } from '@anycms/a2ui-core';
import type { DomComponent, DomNodeMount, DomView, DomViewContext } from './types';

/**
 * Wrap an A2UI binder + a vanilla-DOM View into a {@link DomComponent}. Binds
 * ONCE and subscribes to `propsStream` ONCE. Because `Computed.subscribe`
 * replays the current value synchronously, `view.create` runs before this
 * function returns; subsequent emits call `instance.update`, mutating the
 * existing element in place so focus and local UI state survive (the vanilla
 * analogue of renderer_guide.md §5's React adapter).
 */
export function createDomComponent<P>(
  binder: ComponentBinder<P>,
  view: DomView<P>,
): DomComponent {
  return function domComponent(
    ctx: ComponentContext,
    buildChild: (ref: ChildNodeRef) => DomNodeMount,
  ): DomNodeMount {
    const viewCtx: DomViewContext = { ctx, buildChild };
    // Defensive fallback: a binder's stream always replays synchronously, so
    // `instance` is set before we return; this is only reached if create threw.
    const fallback = document.createElement('div');
    fallback.className = 'a2ui-pending';

    let instance: DomNodeMount | null = null;

    const binding = binder.bind(ctx);
    const sub = binding.propsStream.subscribe((props: P) => {
      if (instance === null) {
        instance = view.create(props, viewCtx);
      } else {
        instance.update(props);
      }
    });

    return {
      get element(): HTMLElement {
        return instance ? instance.element : fallback;
      },
      update(props: unknown): void {
        instance?.update(props);
      },
      dispose(): void {
        sub.unsubscribe();
        binding.dispose();
        instance?.dispose();
        instance = null;
      },
    };
  };
}
