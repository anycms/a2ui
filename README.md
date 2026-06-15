# A2UI

TypeScript implementation of **[A2UI](https://github.com/a2ui-project/a2ui) v1.0** — a server-driven UI protocol where the server streams component descriptions and data, and a thin client renders them. This repo ships a framework-agnostic core, a React renderer with swappable presets, an SSE transport, and a live demo gallery. The v1.0 protocol specification is vendored under [`a2ui/specification/`](./a2ui/specification).

> Spec status: **v1.0 candidate** (stabilizing; breaking changes accepted only under a high bar).

## Packages

This is a [pnpm](https://pnpm.io) workspace. All publishable packages live under the `@anycms` scope on npm.

| Package | What it is | Published |
| --- | --- | --- |
| [`@anycms/a2ui-core`](./packages/a2ui-core) | Framework-agnostic data layer: self-built zero-dependency reactivity (`Signal` / `EventSource` / `Computed` / `batch`), JSON-Pointer data model, message processing, and Zod-based protocol validation. | ✅ |
| [`@anycms/a2ui-react`](./packages/a2ui-react) | React adapter: `createReactComponent`, `<A2uiSurface>`, and the 18 basic-catalog **vanilla** views. | ✅ |
| [`@anycms/a2ui-react-shadcn`](./packages/a2ui-react-shadcn) | **shadcn/ui preset** — same 18 components re-skinned with Radix UI + Tailwind (cva + tailwind-merge + lucide). | ✅ |
| [`@anycms/a2ui-transport-sse`](./packages/a2ui-transport-sse) | SSE transport adapter wiring a backend to a `MessageProcessor` (client → server → client action loop). | ✅ |
| [`@anycms/a2ui-gallery`](./packages/a2ui-gallery) | Vite three-pane demo app: offline step-through of official examples + live SSE, with a Vanilla/shadcn toggle. | ❌ `private` |

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

## Repository layout

```
anycms-a2ui/
├─ packages/
│  ├─ a2ui-core/             # framework-agnostic core (reactivity + data + messages)
│  ├─ a2ui-react/            # React adapter + vanilla preset
│  ├─ a2ui-react-shadcn/     # shadcn/ui preset
│  ├─ a2ui-transport-sse/    # SSE transport
│  └─ a2ui-gallery/          # demo app (private)
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
