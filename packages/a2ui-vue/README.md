# @anycms/a2ui-vue

A **Vue 3 renderer** for [A2UI](https://github.com/anycms/a2ui) v1.0. It renders the same server-driven A2UI message stream as the React renderer, but with native Vue 3 components.

It is a peer of `@anycms/a2ui-react` and `@anycms/a2ui-dom`. The A2UI binders, reactive runtime, and message processor are reused unchanged from `@anycms/a2ui-core`; only the adapter (`createVueComponent` / `<A2uiSurface>` / `A2uiNode`) and the 18 component Views are reimplemented for Vue.

## Why

Drop-in A2UI rendering for Vue 3 apps — no React runtime, no manual DOM. Each bound node subscribes to its own reactive props stream from core, so data-model changes update the UI granularly, inputs preserve focus across re-renders, and `Tabs`/`Modal` preserve local UI state.

## Install

```bash
pnpm add @anycms/a2ui-vue @anycms/a2ui-core
```

`vue` is a peer dependency (`^3.4.0`).

## Usage

```vue
<script setup lang="ts">
import { A2uiSurface } from '@anycms/a2ui-vue';
// `surface` is a SurfaceModel produced by MessageProcessor.processMessages(...)
</script>

<template>
  <A2uiSurface :surface="surface" />
</template>
```

`<A2uiSurface :surface :catalog? :registry?>` renders the `root` component of a surface and provides the surface/catalog/registry to the tree. Each bound node self-subscribes to structural events (`onCreated`/`onDeleted`), so a component type-change rebuilds its binding and a late-arriving child mounts — without a top-level force-rerender.

The default registry (`basicVueComponents`) renders all 18 Basic Catalog components. Pass a custom registry to override individual components:

```ts
import { createVueComponent, basicVueComponents } from '@anycms/a2ui-vue';
import { textBinder } from '@anycms/a2ui-core';

const registry = new Map(basicVueComponents);
registry.set('Text', createVueComponent(textBinder, myTextView));
```

A View is a plain render function `(vp: ComponentViewProps<P>) => VNodeChild` (stateless) — or it may delegate to an internal `defineComponent` for local UI state, as `Tabs` and `Modal` do:

```ts
import { h, type VNodeChild } from 'vue';
import { createVueComponent, type ComponentViewProps } from '@anycms/a2ui-vue';
import { textBinder, type TextProps } from '@anycms/a2ui-core';

const TextView = ({ props }: ComponentViewProps<TextProps>): VNodeChild =>
  h('p', { class: 'a2ui-leaf' }, [props.text]);

export const registry = new Map([['Text', createVueComponent(textBinder, TextView)]]);
```

## How it maps to the React adapter

| React | Vue |
| --- | --- |
| `createReactComponent(binder, View)` | `createVueComponent(binder, View)` |
| `<A2uiSurface>` force-rerenders the tree on structural change | `<A2uiSurface>` provides context; each `A2uiNode` self-subscribes |
| `useState` in `Tabs`/`Modal` | local `ref` in an internal `defineComponent` |
| `useState` in the bound component for the props stream | `shallowRef` updated from `propsStream.subscribe` |

## Styling

Mirrors the React vanilla preset: inline styles with the leaf-margin strategy (leaves carry 8px; containers flush) and semantic class hooks (`a2ui-surface`, `a2ui-row`, `a2ui-column`, `a2ui-list`, `a2ui-leaf`, `a2ui-modal`). No CSS framework required.

## License

MIT © Liangdi
