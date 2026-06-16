import {
  Component,
  computed,
  effect,
  input,
  signal,
  type OnDestroy,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import {
  type ComponentBinder,
  type ComponentBinding,
  type ComponentContext,
  type Subscription,
} from '@anycms/a2ui-core';

/**
 * The bridge between an A2UI binder and an Angular View — the Angular analogue
 * of `createReactComponent` / `createVueComponent` (renderer_guide.md §5).
 *
 * An `effect` (re)binds whenever the `binder` identity changes (i.e. the node's
 * component type changed). The binder's `propsStream` writes into the `props`
 * signal; under zoneless change detection each `.set()` marks this component
 * dirty and the embedded View (via `NgComponentOutlet`) updates. Core's
 * `Computed` replays its current value synchronously on subscribe, so the first
 * render already has props (no flash of empty). Disposes the binding on destroy.
 */
@Component({
  selector: 'a2ui-bound',
  template: `
    @if (props(); as p) {
      <ng-container *ngComponentOutlet="view(); inputs: outletInputs()" />
    }
  `,
  imports: [NgComponentOutlet],
})
export class A2uiBoundComponent implements OnDestroy {
  readonly binder = input.required<ComponentBinder<unknown>>();
  readonly view = input.required<unknown>();
  readonly ctx = input.required<ComponentContext>();

  readonly props = signal<unknown | null>(null);

  private binding?: ComponentBinding<unknown>;
  private sub?: Subscription;

  /** Inputs object for the embedded View — recomputed when props/ctx change. */
  readonly outletInputs = computed(() => ({ props: this.props(), ctx: this.ctx() }));

  constructor() {
    // (Re)bind whenever the binder identity OR the bound context changes. A
    // node whose id changes while its type stays the same (e.g. swapping the
    // Text child inside a Tab) gets a fresh `ctx` with a new component model —
    // we must re-bind to it. Mirrors React's `useEffect(..., [ctx, binder])`.
    effect(() => {
      this.rebind(this.binder(), this.ctx());
    });
  }

  private rebind(binder: ComponentBinder<unknown>, ctx: ComponentContext): void {
    this.sub?.unsubscribe();
    this.binding?.dispose();
    this.binding = binder.bind(ctx);
    this.sub = this.binding.propsStream.subscribe((p) => this.props.set(p));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.binding?.dispose();
  }
}
