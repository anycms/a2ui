# @anycms/a2ui-core

The **framework-agnostic core** of [A2UI](https://github.com/anycms/a2ui) v1.0. It implements everything below the view layer: a zero-dependency **reactive runtime**, JSON-Pointer-addressed **data model**, component & surface **state models**, a Zod **schema** + message parser, the **binder** abstraction that turns raw component JSON into typed props, the **basic catalog** (18 components + functions), and the **MessageProcessor** that applies a server stream to the live model.

Every renderer package — `@anycms/a2ui-react`, `@anycms/a2ui-vue`, `@anycms/a2ui-angular`, `@anycms/a2ui-dom` — depends on this package unchanged. Framework code only bridges the binder's reactive props stream to its own rendering primitive; the data flow and reactivity live here.

It has a single runtime dependency ([`zod`](https://zod.dev), for schema validation) and ships ESM + CJS + types via `tsup`.

## Why

A server-driven-UI client needs (a) a place to hold the streamed state, (b) reactivity so a data write repaints only what depends on it, and (c) a strict schema boundary so malformed server JSON can never reach the renderers. Core provides all three, framework-neutral, so the same reactive model drives React, Vue, Angular, or plain DOM — and so the protocol's truth (the [vendored spec](../../a2ui/specification/v1_0)) maps onto one set of models.

## Modules

| Module | Exports |
| --- | --- |
| `reactive` | `Signal`, `Computed`, `EventSource`, `batch`, `untracked`, `runTracking` — a self-contained reactivity engine (Signals behave like `BehaviorSubject`s; `Computed` subscribes eagerly and dedupes notifies within a batch). |
| `json-pointer` | RFC 6901 helpers with A2UI extensions: relative-pointer resolution, auto-vivifying `set`, and prefix/related tests for the DataModel's bubble & cascade notification. |
| `datamodel` | `DataModel` — reactive JSON tree addressed by JSON Pointer; `get` / `set` / `subscribe(path, cb)` / `snapshot()`. |
| `components` | `ComponentModel`, `SurfaceComponentsModel` (the flat `Map<id,ComponentModel>`), `SurfaceModel` (root + components + dataModel + `onAction`), `SurfaceGroupModel` (the session's surfaces + `onSurfaceCreated`/`onSurfaceDeleted`/`onAction`). |
| `dynamic-value` | `resolveDynamicValue(v, ctx)` — turns a literal, a data binding `{ path }`, or a function call `{ call, args }` into a resolved value. |
| `context` | `DataContext` and `ComponentContext` (implements `DynamicValueContext`) — the per-node handle a binder's `resolve()` reads through; `ctx.resolveDynamicValue<T>(v)` auto-registers data dependencies. |
| `schema` | Zod schemas for every message + `parseA2uiMessage(input)` / `serializeClientEvent(event)` and the inferred `A2uiMessage` / `ClientEvent` types. |
| `binder` | `defineBinder({ name, schema, resolve })` — the single source of truth. `resolve()` runs inside a `Computed`, so reads via `ctx.resolveDynamicValue` become reactive deps; the binder returns a `propsStream` (a `Computed<ResolvedProps>`). Plus `resolveChild` / `resolveChildList` / `resolveChecks`. |
| `functions` | `FunctionRegistry` and the `basicFunctions` set (`formatString`, `formatNumber`, `formatCurrency`, `formatDate`, `pluralize`, `required`, `regex`, `length`, `numeric`, `email`, `and`/`or`/`not`, `openUrl`, `indexSystem`). |
| `catalog` | `Catalog` — bundles binders + a function registry under an id (`basicCatalog`, `basicCatalogId`). |
| `registry` | `mergeRegistries(base, ...overrides)` — combine component registries; later args win by key (generic; re-exported by the view packages). |
| `message-processor` | `MessageProcessor` — applies a batch of `A2uiMessage`s to the live `SurfaceGroupModel` inside one `batch()` (one repaint). Emits `onClientEvent` / `onActionResponse` hooks. |

## Install

```bash
pnpm add @anycms/a2ui-core
```

No framework peer deps. `zod` comes along as a regular dependency.

## Usage

### Reactive primitives

```ts
import { Signal, Computed, EventSource, batch } from '@anycms/a2ui-core';

const count = new Signal(0);
const doubled = new Computed(() => count.value * 2); // subscribes eagerly
doubled.subscribe((v) => console.log('doubled:', v)); // logs 0 immediately (replay)
count.value = 5; // logs 10

batch(() => {
  count.value = 7;
  count.value = 8; // listeners notified once, with the final value
});
```

### Process a server stream into a live model

```ts
import {
  MessageProcessor,
  basicCatalog,
  basicCatalogId,
  parseA2uiMessage,
  type A2uiMessage,
} from '@anycms/a2ui-core';

const processor = new MessageProcessor({ catalogs: [basicCatalog] });

const messages: A2uiMessage[] = [
  { version: 'v1.0', createSurface: { surfaceId: 'demo', catalogId: basicCatalogId, sendDataModel: true } },
  {
    version: 'v1.0',
    updateComponents: {
      surfaceId: 'demo',
      components: [{ id: 'root', component: 'Text', text: { path: '/greeting' } }],
    },
  },
  { version: 'v1.0', updateDataModel: { surfaceId: 'demo', value: { greeting: 'hello' } } },
];
processor.processMessages(messages); // applied atomically in one batch

const surface = processor.model.values().next().value!;
surface.dataModel.subscribe('/greeting', (v) => console.log('greeting:', v)); // 'hello'
```

`parseA2uiMessage` is the validation boundary — feed it raw server JSON before `processMessages` (the SSE transport does this for you). Unknown/shape-invalid input throws an `A2uiValidationError`.

### Define a binder (the reactive contract for one component)

```ts
import { defineBinder, type ComponentContext } from '@anycms/a2ui-core';

interface TextProps {
  text: string;
}

export const myTextBinder = defineBinder<TextProps>({
  name: 'Text',
  schema: { type: 'object', properties: { text: {} } },
  resolve: (ctx: ComponentContext) => ({
    // resolveDynamicValue registers a data-model dependency automatically;
    // when the bound data changes this Computed re-runs → new props object.
    text: ctx.resolveDynamicValue<string>(ctx.componentModel.properties.text),
  }),
});
```

A view package pairs this binder with a framework View (`createReactComponent(binder, View)`, etc.) — see the React/Vue/Angular READMEs.

### React to client actions

Components surface user intent via `ctx.dispatchAction(...)`, which flows up to the surface and then the group model:

```ts
processor.model.onAction.subscribe((action) => {
  // forward to the server (the SSE transport does this automatically)
});
```

## See also

- Protocol truth: [`a2ui/specification/v1_0/`](../../a2ui/specification/v1_0) (`a2ui_protocol.md`, `renderer_guide.md`, `basic_catalog_implementation_guide.md`).
- View packages: [`@anycms/a2ui-react`](../a2ui-react), [`@anycms/a2ui-vue`](../a2ui-vue), [`@anycms/a2ui-angular`](../a2ui-angular), [`@anycms/a2ui-dom`](../a2ui-dom).
- Transport: [`@anycms/a2ui-transport-sse`](../a2ui-transport-sse).

## License

MIT © Liangdi
