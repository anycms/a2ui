# @anycms/a2ui-angular

An **Angular 21 renderer** for [A2UI](https://github.com/anycms/a2ui) v1.0. It renders the same server-driven A2UI message stream as the React and Vue renderers, but with native standalone Angular components — fully **zoneless** and **signal-driven**.

It is a peer of `@anycms/a2ui-react`, `@anycms/a2ui-vue`, and `@anycms/a2ui-dom`. The A2UI binders, reactive runtime, and message processor are reused unchanged from `@anycms/a2ui-core`; only the adapter (`A2uiBoundComponent` / `<a2ui-surface>` / `<a2ui-node>`) and the 18 component Views are reimplemented for Angular.

## Why

Drop-in A2UI rendering for Angular apps — no React or Vue runtime, no manual DOM. Each bound node subscribes to its own reactive props stream from core and writes it into a signal, so under zoneless change detection data-model updates repaint the UI granularly, inputs preserve focus across re-renders, and `Tabs`/`Modal` preserve local UI state (held in component signals).

## Install

```bash
pnpm add @anycms/a2ui-angular @anycms/a2ui-core
```

`@angular/core` (`^21`) and `rxjs` are peer dependencies. Zoneless change detection is the default — `zone.js` is **not** required.

## Usage

```ts
import { Component } from '@angular/core';
import { A2uiSurfaceComponent } from '@anycms/a2ui-angular';
// `surface` is a SurfaceModel produced by MessageProcessor.processMessages(...)

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [A2uiSurfaceComponent],
  template: `<a2ui-surface [surface]="surface" />`,
})
export class DemoComponent {
  surface = /* a SurfaceModel */;
}
```

`<a2ui-surface [surface] [catalog?] [registry?]>` renders the `root` component of a surface and provides the surface/catalog/registry to the tree. Each bound node self-subscribes to structural events (`onCreated`/`onDeleted`), so a component type-change rebuilds its binding and a late-arriving child mounts — without a top-level force-rerender.

The default registry (`basicAngularComponents`) renders all 18 Basic Catalog components. Pass a custom registry to override individual components:

```ts
import { createAngularComponent, basicAngularComponents } from '@anycms/a2ui-angular';
import { textBinder } from '@anycms/a2ui-core';

const registry = new Map(basicAngularComponents);
registry.set('Text', createAngularComponent(textBinder, MyTextView));
```

A View is a standalone `@Component` with `props` / `ctx` **signal inputs** (optional for a leaf, read with `props()?.…`). For local UI state (`Tabs`, `Modal`), hold a component `signal`:

```ts
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { TextProps } from '@anycms/a2ui-core';
import { createAngularComponent, type ComponentViewProps } from '@anycms/a2ui-angular';

@Component({
  selector: 'my-text',
  standalone: true,
  template: `<p class="a2ui-leaf">{{ props()?.text }}</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyTextViewComponent {
  readonly props = input<TextProps>();
  // ComponentViewProps<TextProps> documents the { props, ctx } shape.
}

export const registry = new Map([['Text', createAngularComponent(textBinder, MyTextViewComponent)]]);
```

## How it maps to the React / Vue adapters

| React / Vue | Angular |
| --- | --- |
| `createReactComponent` / `createVueComponent` | `createAngularComponent(binder, view)` (pairing); binding done in `A2uiBoundComponent` |
| `<A2uiSurface>` provides context | `<a2ui-surface>` provides via `A2UI_SURFACE` `InjectionToken` |
| `useState` / `shallowRef` for the props stream | a `signal` updated from `propsStream.subscribe` in `A2uiBoundComponent` |
| `useState` / local `ref` in `Tabs`/`Modal` | a component `signal` |
| reactivity via `propsStream` subscription | same, bridged to signals (zoneless CD) |

## Styling

Mirrors the React/Vue vanilla preset: inline styles with the leaf-margin strategy (leaves carry 8px; containers flush) and semantic class hooks (`a2ui-surface`, `a2ui-row`, `a2ui-column`, `a2ui-list`, `a2ui-leaf`, `a2ui-modal`). No CSS framework required.

## License

MIT © Liangdi
