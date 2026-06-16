# @anycms/a2ui-react

A **React renderer** for [A2UI](https://github.com/anycms/a2ui) v1.0. It renders the server-driven A2UI message stream with native React components, and ships the default **vanilla** preset — 18 Basic Catalog Views plus the `basicReactComponents` registry.

It is a peer of `@anycms/a2ui-vue`, `@anycms/a2ui-angular`, and `@anycms/a2ui-dom`. The A2UI binders, reactive runtime, and message processor are reused unchanged from `@anycms/a2ui-core`; only the adapter (`createReactComponent` / `<A2uiSurface>` / `A2uiNode`) and the 18 component Views are React-specific. Look-and-feel presets (e.g. [`@anycms/a2ui-react-shadcn`](../a2ui-react-shadcn)) build on top of this package by swapping Views.

## Why

Drop-in A2UI rendering for React apps. Each bound node subscribes to its own reactive props stream from core inside a `useEffect`, so a data-model write repaints only that node — no top-level force-rerender for property/data changes. `<A2uiSurface>` only re-renders the tree on structural change (a component added or removed); inputs preserve focus across re-renders and `Tabs`/`Modal` preserve local UI state (held in `useState`).

## Install

```bash
pnpm add @anycms/a2ui-react @anycms/a2ui-core
```

`react` and `react-dom` (`^18 || ^19`) are peer dependencies.

## Usage

```tsx
import { A2uiSurface } from '@anycms/a2ui-react';
// `surface` is a SurfaceModel produced by MessageProcessor.processMessages(...)
import { surface } from './session';

export function Demo() {
  return <A2uiSurface surface={surface} />;
}
```

`<A2uiSurface surface catalog? registry? className? style?>` renders the `root` component of a surface and provides the surface/catalog/registry to the tree via context. Structural changes (component add/remove) re-render the tree; property and data-model changes are handled reactively inside each bound node. `className` / `style` land on the root `.a2ui-surface` node — handy as a token container for theming (`style={{ '--color-primary': '#x' } as CSSProperties}`).

The default registry (`basicReactComponents`) renders all 18 Basic Catalog components. Pass a custom registry to override individual components, or compose with `mergeRegistries`:

```tsx
import {
  A2uiSurface,
  createReactComponent,
  basicReactComponents,
  mergeRegistries,
  type ComponentViewProps,
} from '@anycms/a2ui-react';
import { textBinder, type TextProps } from '@anycms/a2ui-core';

function MyTextView({ props }: ComponentViewProps<TextProps>) {
  return <p className="a2ui-leaf">{props.text}</p>;
}

const registry = mergeRegistries(basicReactComponents, new Map([
  ['Text', createReactComponent(textBinder, MyTextView)],
]));

<A2uiSurface surface={surface} registry={registry} />;
```

A View is a plain function component receiving `{ props, ctx, buildChild }`. Use `buildChild(ref)` to render a child by id — it recurses through `<A2uiNode>`, which looks the component up in the surface's flat map and binds it under the right `basePath`.

## How it maps to the other adapters

| Concept | React | Vue | Angular |
| --- | --- | --- | --- |
| Pair binder + View | `createReactComponent(binder, View)` | `createVueComponent(binder, View)` | `createAngularComponent(binder, View)` |
| Surface entry | `<A2uiSurface>` | `<A2uiSurface>` | `<a2ui-surface>` |
| Provide surface/catalog/registry | React context | `provide()` | `A2UI_SURFACE` `InjectionToken` |
| Hold the props stream | `useState` in the bound component | `shallowRef` from `propsStream.subscribe` | a `signal` updated from `propsStream.subscribe` |
| Local UI state (`Tabs`/`Modal`) | `useState` | local `ref` in `defineComponent` | a component `signal` |

## Styling

The vanilla preset uses inline styles with the leaf-margin strategy (leaves carry 8px; containers flush) and semantic class hooks (`a2ui-surface`, `a2ui-row`, `a2ui-column`, `a2ui-list`, `a2ui-leaf`, `a2ui-modal`). No CSS framework required. Re-skin without touching this package by overriding Views or theming the host (see [`a2ui-react-shadcn`](../a2ui-react-shadcn)).

## License

MIT © Liangdi
