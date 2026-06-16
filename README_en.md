# A2UI

> **Languages:** [简体中文](./README.md) | **English**

TypeScript implementation of **[A2UI](https://github.com/a2ui-project/a2ui) v1.0** — a server-driven UI protocol where the server streams component descriptions and data, and a thin client renders them. This repo ships a framework-agnostic core, React, Vue 3, and Angular renderers with swappable presets, a framework-agnostic vanilla-DOM renderer, an SSE transport, and live demo galleries. The v1.0 protocol specification is vendored under [`a2ui/specification/`](./a2ui/specification).

> Spec status: **v1.0 candidate** (stabilizing; breaking changes accepted only under a high bar).

## Packages

This is a [pnpm](https://pnpm.io) workspace. All publishable packages live under the `@anycms` scope on npm.

| Package | What it is | Published |
| --- | --- | --- |
| [`@anycms/a2ui-core`](./packages/a2ui-core) | Framework-agnostic data layer: self-built zero-dependency reactivity (`Signal` / `EventSource` / `Computed` / `batch`), JSON-Pointer data model, message processing, and Zod-based protocol validation. | ✅ |
| [`@anycms/a2ui-dom`](./packages/a2ui-dom) | **Framework-agnostic vanilla-DOM renderer** — the same 18 components rendered with native DOM elements and zero UI-framework dependency (`mountDomSurface`). | ✅ |
| [`@anycms/a2ui-react`](./packages/a2ui-react) | React adapter: `createReactComponent`, `<A2uiSurface>`, and the 18 basic-catalog **vanilla** views. | ✅ |
| [`@anycms/a2ui-react-shadcn`](./packages/a2ui-react-shadcn) | **shadcn/ui preset** — same 18 components re-skinned with Radix UI + Tailwind (cva + tailwind-merge + lucide). | ✅ |
| [`@anycms/a2ui-vue`](./packages/a2ui-vue) | **Vue 3 renderer** — `createVueComponent`, `<A2uiSurface>`, and the 18 basic-catalog vanilla views as Vue components. | ✅ |
| [`@anycms/a2ui-angular`](./packages/a2ui-angular) | **Angular 21 renderer** — `<a2ui-surface>`, `A2uiBoundComponent` (binder → signal bridge), and the 18 basic-catalog vanilla views as standalone, **zoneless, signal-driven** components. | ✅ |
| [`@anycms/a2ui-transport-sse`](./packages/a2ui-transport-sse) | SSE transport adapter wiring a backend to a `MessageProcessor` (client → server → client action loop). | ✅ |
| [`@anycms/a2ui-gallery`](./packages/a2ui-gallery) | Vite three-pane demo app: offline step-through of official examples + live SSE, with a Vanilla/shadcn/DOM toggle. | ❌ `private` |
| [`@anycms/a2ui-vue-gallery`](./packages/a2ui-vue-gallery) | Vite **Vue 3** demo app: same offline examples + live SSE, with a Vue/DOM renderer toggle. | ❌ `private` |
| [`@anycms/a2ui-angular-gallery`](./packages/a2ui-angular-gallery) | **Angular CLI** demo app (zoneless): same offline examples + live SSE, with an Angular/DOM renderer toggle. | ❌ `private` |

## Quick start

```bash
pnpm add @anycms/a2ui-core @anycms/a2ui-react react react-dom
```

```tsx
import { MessageProcessor, basicCatalog } from '@anycms/a2ui-core';
import { A2uiSurface } from '@anycms/a2ui-react';

// 1. create a processor (register the catalogs your server emits)
const processor = new MessageProcessor({ catalogs: [basicCatalog] });

// 2. feed it server -> client A2UI messages
processor.processMessages(serverMessages);

// 3. render the surface the server created
export function App() {
  const surface = processor.model.get('primary')!; // surfaceId from your server
  return <A2uiSurface surface={surface} />;
}
```

`<A2uiSurface>` accepts:
- `surface: SurfaceModel` *(required)* — obtained from `processor.model.get(surfaceId)`
- `catalog?: Catalog` — defaults to `basicCatalog`
- `registry?: ReactComponentRegistry` — defaults to `basicReactComponents`

Property and data changes flow through the reactive data model, so bound nodes re-render automatically — no manual subscriptions.

### Renderer presets

A "preset" is a set of View components plus a `ReactComponentRegistry`. The binders and adapter are reused verbatim; only the Views differ. Swapping a look-and-feel is a single prop:

```tsx
import { A2uiSurface } from '@anycms/a2ui-react';
import { shadcnReactComponents } from '@anycms/a2ui-react-shadcn';
import '@anycms/a2ui-react-shadcn/styles.css';

<A2uiSurface surface={surface} registry={shadcnReactComponents} />
```

New presets (MUI, Chakra, …) follow the same shape — copy `a2ui-react-shadcn` as a template.

### Framework-agnostic DOM renderer

For hosts that don't run a UI framework (Web Components, SSR fragments, embedded widgets), `@anycms/a2ui-dom` renders the same message stream with native DOM elements and **zero framework dependency**. It reuses the core binders and reactive runtime unchanged; only the adapter and 18 Views are reimplemented.

```ts
import { MessageProcessor, basicCatalog } from '@anycms/a2ui-core';
import { mountDomSurface } from '@anycms/a2ui-dom';

const processor = new MessageProcessor({ catalogs: [basicCatalog] });
processor.processMessages(serverMessages);

const surface = processor.model.get('primary')!;
const handle = mountDomSurface(surface, document.getElementById('host')!);
// later: handle.dispose();
```

Each bound node subscribes to its own reactive props stream; inputs preserve focus across re-renders and interactive components preserve local UI state (selected tab, open modal).

### Vue 3 renderer

For Vue 3 hosts, `@anycms/a2ui-vue` renders the same message stream with native Vue components (`createVueComponent`, `<A2uiSurface>`). It reuses the core binders and reactive runtime unchanged; only the adapter and 18 Views are reimplemented.

```vue
<script setup lang="ts">
import { MessageProcessor, basicCatalog } from '@anycms/a2ui-core';
import { A2uiSurface } from '@anycms/a2ui-vue';

const processor = new MessageProcessor({ catalogs: [basicCatalog] });
processor.processMessages(serverMessages);
const surface = processor.model.get('primary')!;
</script>

<template>
  <A2uiSurface :surface="surface" />
</template>
```

Each bound node self-subscribes to structural events, so a component type-change rebuilds its binding and a late-arriving child mounts — without a top-level force-rerender. Inputs preserve focus (Vue's runtime guards the `value` property) and `Tabs`/`Modal` keep local UI state.

### Angular renderer

For Angular hosts, `@anycms/a2ui-angular` renders the same message stream with native standalone components, fully **zoneless + signal-driven** (the Angular 21 default). `A2uiBoundComponent` bridges the core binder's `propsStream` into a signal; each bound node self-subscribes to structural events, so a type-change rebuilds its binding and a late-arriving child mounts.

```ts
import { Component } from '@angular/core';
import { MessageProcessor, basicCatalog } from '@anycms/a2ui-core';
import { A2uiSurfaceComponent } from '@anycms/a2ui-angular';

const processor = new MessageProcessor({ catalogs: [basicCatalog] });
processor.processMessages(serverMessages);
const surface = processor.model.get('primary')!;

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [A2uiSurfaceComponent],
  template: `<a2ui-surface [surface]="surface" />`,
})
export class DemoComponent {
  surface = surface;
}
```

`@anycms/a2ui-core`, `@angular/core` (`^21`), and `rxjs` are peer dependencies; zoneless is the default, so `zone.js` is not required.

### SSE transport

```ts
import { MessageProcessor, basicCatalog } from '@anycms/a2ui-core';
import { SseA2uiTransport } from '@anycms/a2ui-transport-sse';

const processor = new MessageProcessor({ catalogs: [basicCatalog] });
const transport = new SseA2uiTransport({
  baseUrl: 'http://127.0.0.1:3000',
  prompt: 'weather in beijing',
  processor,
});
```

The transport parses inbound A2UI messages into the processor and serializes outbound client actions. Pair it with any backend that speaks the v1.0 protocol (see the `anycms-agent` Rust `27_a2ui_interceptor_renderer` example for a reference server).

## Develop

```bash
pnpm install
pnpm dev        # gallery on http://localhost:5173
pnpm typecheck  # tsc --noEmit across all packages
pnpm test       # vitest across all packages
pnpm build      # build all publishable packages
```

Requires Node ≥ 20 and pnpm 10.

### Releasing

Versioning is orchestrated by [release-it](https://github.com/release-it/release-it);
the changelog is generated by [git-cliff](https://git-cliff.org) ([`cliff.toml`](./cliff.toml)).
The seven publishable packages are versioned **in lockstep** (one shared version);
`@anycms/a2ui-gallery`, `@anycms/a2ui-vue-gallery`, and `@anycms/a2ui-angular-gallery` are private and excluded. On release, release-it bumps the
versions (`@release-it/bumper` writes all seven `package.json` files), regenerates
[`CHANGELOG.md`](./CHANGELOG.md) via `git cliff`, then commits, tags (`v<version>`),
and pushes.

```bash
pnpm release       # interactive — recommends a bump from commit history, then bumps / changelog / commits / tags / pushes
pnpm release:dry   # preview the release without changing anything
```

Publishing to npm is a **separate, explicit step** (run after the tagged commit
is pushed, once you've confirmed the build):

```bash
pnpm publish:npm   # build all publishable packages, then pnpm -r publish
```

`just` users: `just release`, `just release-dry`, `just publish`.

## Repository layout

```
anycms-a2ui/
├─ packages/
│  ├─ a2ui-core/             # framework-agnostic core (reactivity + data + messages)
│  ├─ a2ui-dom/              # framework-agnostic vanilla-DOM renderer
│  ├─ a2ui-react/            # React adapter + vanilla preset
│  ├─ a2ui-react-shadcn/     # shadcn/ui preset
│  ├─ a2ui-vue/              # Vue 3 renderer (vanilla preset)
│  ├─ a2ui-angular/         # Angular 21 renderer (zoneless + signals)
│  ├─ a2ui-transport-sse/    # SSE transport
│  ├─ a2ui-gallery/          # React demo app (private)
│  ├─ a2ui-vue-gallery/      # Vue demo app (private)
│  └─ a2ui-angular-gallery/  # Angular demo app (private)
└─ a2ui/specification/v1_0/  # vendored A2UI v1.0 spec (json / docs / catalogs / test / eval)
```

## Specification

The protocol is defined under [`a2ui/specification/v1_0/`](./a2ui/specification/v1_0). The basic component catalog is identified by:

```
https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json
```

Spec docs:
- [Protocol](./a2ui/specification/v1_0/docs/a2ui_protocol.md)
- [Renderer guide](./a2ui/specification/v1_0/docs/renderer_guide.md)
- [Custom functions](./a2ui/specification/v1_0/docs/a2ui_custom_functions.md)
- [Extension specification](./a2ui/specification/v1_0/docs/a2ui_extension_specification.md)
- [Evolution guide](./a2ui/specification/v1_0/docs/evolution_guide.md)

## License

[MIT](./LICENSE) © Liangdi
