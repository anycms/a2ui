import {
  Component,
  computed,
  inject,
  input,
  signal,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { ComponentContext, type ComponentModel, type Subscription } from '@anycms/a2ui-core';
import { A2UI_SURFACE } from './tokens';
import { A2uiBoundComponent } from './a2ui-bound.component';

/**
 * Recursive rendering unit: looks up a component by id in the surface's flat
 * map and renders its Angular binding with a context scoped to `basePath`.
 * Mirrors `A2uiNode` in packages/a2ui-vue/src/adapter.ts and the React adapter.
 *
 * Each node self-subscribes to `onCreated`/`onDeleted` and re-evaluates only its
 * own slot, so a type-change rebuilds the binding and a late-arriving child
 * mounts — without touching siblings (no top-level force-rerender).
 */
@Component({
  selector: 'a2ui-node',
  template: `
    @if (entry(); as e) {
      <a2ui-bound [binder]="e.binder" [view]="e.view" [ctx]="ctx()" />
    } @else if (component(); as c) {
      <div class="a2ui-unknown">Unknown component: {{ c.type }}</div>
    }
  `,
  imports: [A2uiBoundComponent],
})
export class A2uiNodeComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();
  readonly basePath = input('');

  private readonly surface$ = inject(A2UI_SURFACE);
  /** Bumped on any add/remove/type-change so the slot re-evaluates. */
  private readonly tick = signal(0);
  private subs: Subscription[] = [];

  // Subscribe in ngOnInit, not the constructor: the component may be
  // instantiated before its parent's `surface` input is bound, and reading it
  // then would throw NG0950. By ngOnInit all inputs are guaranteed set.
  ngOnInit(): void {
    const sc = this.surface$();
    this.subs.push(
      sc.surface.componentsModel.onCreated.subscribe(() => this.tick.set(this.tick() + 1)),
      sc.surface.componentsModel.onDeleted.subscribe(() => this.tick.set(this.tick() + 1)),
    );
  }

  /** The current component model for this id (re-read on structural change). */
  readonly component = computed<ComponentModel | undefined>(() => {
    void this.tick();
    const sc = this.surface$();
    return sc.surface.componentsModel.get(this.id());
  });

  /** Registry entry for the component's type, if any. */
  readonly entry = computed(() => {
    void this.tick();
    const c = this.component();
    if (!c) return undefined;
    return this.surface$().registry.get(c.type);
  });

  /** A fresh `ComponentContext` scoped to this node's `basePath`. Rebuilt on
   *  structural change so a type-change rebuild sees the new component model. */
  readonly ctx = computed<ComponentContext | null>(() => {
    void this.tick();
    const c = this.component();
    if (!c) return null;
    const sc = this.surface$();
    return new ComponentContext({
      surface: sc.surface,
      componentModel: c,
      basePath: this.basePath(),
      invoker: sc.catalog.functions,
    });
  });

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
