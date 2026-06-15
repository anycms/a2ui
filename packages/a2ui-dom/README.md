# @anycms/a2ui-dom

A **framework-agnostic vanilla-DOM renderer** for [A2UI](https://github.com/anycms/a2ui) v1.0. It renders the same server-driven A2UI message stream as the React renderer, but with native DOM elements and **zero UI-framework dependency** — no React, Angular, or Vue.

It is a peer of `@anycms/a2ui-react`. The A2UI binders, reactive runtime, and message processor are reused unchanged from `@anycms/a2ui-core`; only the ~135-line adapter/surface and the 18 component Views are reimplemented, targeting `HTMLElement`.

## Why

Drop-in rendering for hosts that don't want a framework runtime: Web Components, SSR fragments, embedded widgets, or anywhere React's bundle weight is unwanted.

## Install

```bash
pnpm add @anycms/a2ui-dom @anycms/a2ui-core
```

## Usage

```ts
import { mountDomSurface } from '@anycms/a2ui-dom';
// `surface` is a SurfaceModel produced by MessageProcessor.processMessages(...)
const handle = mountDomSurface(surface, document.getElementById('host')!);
// later
handle.dispose();
```

`mountDomSurface(surface, hostEl, opts?)` mounts the `root` component into `hostEl` and returns `{ element, dispose() }`. Each bound node subscribes to its own reactive props stream; inputs preserve focus across re-renders and Tabs/Modal preserve local UI state.

The default registry (`basicDomComponents`) renders all 18 Basic Catalog components. Pass a custom registry to override individual components:

```ts
import { mountDomSurface, createDomComponent, basicDomComponents } from '@anycms/a2ui-dom';
import { textBinder } from '@anycms/a2ui-core';

const registry = new Map(basicDomComponents);
registry.set('Text', createDomComponent(textBinder, myTextView));
mountDomSurface(surface, host, { registry });
```

## Styling

Mirrors the React vanilla preset: inline styles with the leaf-margin strategy (leaves carry 8px; containers flush) and semantic class hooks (`a2ui-surface`, `a2ui-row`, `a2ui-column`, `a2ui-list`, `a2ui-leaf`, `a2ui-modal`). No CSS framework required.

## License

MIT © Liangdi
