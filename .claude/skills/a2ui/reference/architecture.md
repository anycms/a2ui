# A2UI architecture & data flow

Reference for *how the pieces fit*. Load this when you're navigating an
unfamiliar part of the code, debugging reactivity, or deciding where new code
belongs.

## Layered architecture

Two hard layers, mirroring `renderer_guide.md §1`:

1. **Framework-agnostic data layer** (`@anycms/a2ui-core`). Everything that is
   true regardless of UI framework: parsing, state, pointers, schemas, the
   generic binder, catalogs, the message processor. Zero UI imports.
2. **Framework-specific view layer** (`@anycms/a2ui-react` + presets). Turns
   resolved state into React nodes. Only this layer imports React.

A **preset** is just a different set of Views sharing the same core binders and
the same React adapter. Swapping a look-and-feel = swapping the `registry` prop
on `<A2uiSurface>`. No binder or adapter code is duplicated across presets.

## Core module map (`packages/a2ui-core/src/`)

| Module | Exports you'll touch | Responsibility |
| --- | --- | --- |
| `reactive/` | `Signal`, `Computed`, `EventSource`, `batch`, `untracked`, `Listener`, `Subscription` | Self-built reactivity (no external dep). `Computed` auto-tracks reads; `EventSource` is a multicast stream with `.subscribe()/.emit()`. |
| `json-pointer/` | `resolvePointer`, `pointerFromTokens` | RFC 6901 pointer math + relative-pointer resolution against a base scope. |
| `datamodel/` | `DataModel` | Reactive JSON store: `get/replaceAll/set/subscribe/snapshot/dispose`. Keys addressed by JSON Pointer. |
| `components/` | `ComponentModel`, `SurfaceComponentsModel`, `SurfaceModel`, `SurfaceGroupModel`, `A2uiClientAction` | State models + lifecycle `EventSource`s. |
| `dynamic-value/` | `resolveDynamicValue`, `subscribeDynamicValue`, `DynamicValueContext`, `FunctionInvoker` | Resolves `literal \| {path} \| {call, args}`. |
| `context/` | `DataContext`, `ComponentContext` | Scoped window over the data model (a `basePath`); `ComponentContext` adds `componentModel`, `dispatchAction`, `set`, `nested`. |
| `schema/` | `parseA2uiMessage`, `serializeClientEvent`, `A2uiMessage`, `ClientEvent`, `A2uiValidationError` | Zod envelope schemas. Top-level strict; `componentSchema` is `passthrough()`. |
| `binder/` | `defineBinder`, `ComponentBinder`, `resolveChild`, `resolveChildList`, `resolveChecks`, `ChildNodeRef`, `CheckResult` | The generic binder layer. |
| `functions/` | `FunctionImplementation`, `FunctionRegistry`, `basicFunctions` | Catalog functions + the `FunctionInvoker` impl. |
| `catalog/` | `Catalog` | `{ id, components, functions, themeSchema, instructions }`. Composable. |
| `catalogs/basic/` | `basicCatalog`, `createBasicCatalog`, `basicCatalogId`, all 18 `*Binder` + `*Props` | The Basic Catalog. |
| `message-processor/` | `MessageProcessor`, `MessageProcessorOptions` | The controller. |

Everything is re-exported from [`packages/a2ui-core/src/index.ts`](./../../../packages/a2ui-core/src/index.ts).

## The reactivity model (the key insight)

The core ships its own reactivity, not an external lib. Three primitives:

- **`Signal<T>`** — a writable cell. Reading it *during a `Computed` evaluation*
  registers the signal as a dependency.
- **`Computed<T>`** — derived, lazily evaluated, memoized. Re-runs when a
  dependency changes and emits its new value to subscribers. Tracks dependencies
  by intercepting reads while it evaluates.
- **`EventSource<T>`** — a fire-and-forget multicast stream (`subscribe` →
  `Subscription` with `.unsubscribe()`; `emit` notifies all listeners). Not
  tracked; used for lifecycle events (`onCreated`, `onAction`, etc.).

`batch(fn)` groups writes so listeners repaint once at the end. `untracked(fn)`
reads without registering deps.

**Why this matters for binders:** `defineBinder` wraps the `resolve` function in
a `Computed`:

```ts
// packages/a2ui-core/src/binder/index.ts
bind(ctx) {
  const computed = new Computed<ResolvedProps>(() => resolve(ctx));
  return { propsStream: computed, dispose: () => computed.dispose() };
}
```

So inside `resolve`, every `ctx.resolveDynamicValue(p.x)` that hits a `{path}`
binding reads the `DataModel` through a tracked getter → the `Computed`
re-evaluates when that path changes → the React adapter's subscription fires →
the View gets fresh props. **If you read the raw `componentModel.properties`
instead of resolving, you break the dependency chain and the View goes stale.**

The adapter subscribes per mounted node and disposes on unmount
([adapter.tsx `createReactComponent`](./../../../packages/a2ui-react/src/adapter.tsx)),
so there are no leaks.

## The component tree is flat, not nested

The server sends components as a **flat array**; each component references its
children by **id string** (or a template). Nesting is reconstructed at render
time by `A2uiNode` looking up the child id in `SurfaceComponentsModel`.

Child reference shapes (`binder/resolveChildList`):

- **Static list:** `children: ['a', 'b', 'c']` — all share the current data scope.
- **Single child:** `child: 'x'`.
- **Template list:** `children: { componentId: 'row', path: '/users' }` — iterate
  the array at `path`; each item gets a **nested scope** (`/users/0`,
  `/users/1`, …) so relative bindings inside the template resolve per-item.

A `ChildNodeRef` is `{ id, basePath }`; `buildChildNode(ref)` recurses into
`<A2uiNode>` with that base path.

## Dynamic values — the three binding forms

Anywhere a property can be data-driven (inside a binder's `resolve`), the raw
JSON value is one of:

| Form | Example | Resolves to |
| --- | --- | --- |
| **Literal** | `"hello"`, `42`, `{...plain config}` | itself |
| **Data binding** | `{ "path": "/user/name" }` | `DataModel.get(resolvedPointer)` — relative to the scope's `basePath` |
| **Function call** | `{ "call": "formatString", "args": { "value": "${/temp}°" } }` | the function's return, recomputed when any `args` binding changes |

`ctx.resolveDynamicValue<T>(raw)` returns the current snapshot. Inside a binder
`resolve`, this is all you need. Function args are themselves recursively
resolved (`dynamic-value/resolveArgs`).

Built-in catalog functions (`functions/index.ts`): validation — `required`,
`regex`, `length`, `numeric`, `email`, `and`, `or`, `not`; formatting —
`formatString`, `formatNumber`, `formatCurrency`, `formatDate`, `pluralize`;
side-effect — `openUrl`; template — `@index` (current iteration index).

## Message processing (`MessageProcessor`)

`processMessages(msgs)` wraps a `batch()` around one pass of `processOne` per
message. The message kinds and their model effects:

| Envelope key | Effect |
| --- | --- |
| `createSurface` | Looks up catalog by id (throws if unknown), builds `SurfaceModel` (throws on duplicate surfaceId), seeds `dataModel`, applies initial components. |
| `updateComponents` | Add / in-place-update / **rebuild-on-type-change** components by id. No-op if surface doesn't exist yet (progressive rendering). |
| `updateDataModel` | `path '/'` → `replaceAll`; else `set(path, value)`; omitted `value` → **delete** the key. |
| `deleteSurface` | Disposes the surface's data model, clears components, removes. |
| `callFunction` | Runs a catalog function; if `wantResponse`, emits `functionResponse` (or `error`) via `onClientEvent`. |
| `actionResponse` | If the originating action carried a `responsePath`, writes `value` back to that surface's `dataModel` via the `actionId`→`{surfaceId,responsePath}` map captured at dispatch; always fires `onActionResponse`. |

**Action → response loop:** a View calls `ctx.dispatchAction({ name, wantResponse: true, actionId, responsePath })`. `MessageProcessor` subscribes to `model.onAction` and records `actionId → { surfaceId, responsePath }` for actions carrying both. Transport ships the action to the server (POST); the server's `actionResponse { actionId, value | error }` returns through `processMessages`. The processor matches `actionId` and, given a `responsePath` + `value`, does `surface.dataModel.set(responsePath, value)` — reactively re-rendering anything bound there. Errors and response-less actions go to the optional `onActionResponse` callback. (`callFunction` has no `responsePath`; its `functionResponse` is outbound only, never written back.)

Outbound: `getClientCapabilities()` advertises `supportedCatalogIds`;
`getClientDataModel()` snapshots surfaces flagged `sendDataModel`.

## Where rendering happens (`@anycms/a2ui-react`)

- **`<A2uiSurface surface catalog registry>`** — entry. Subscribes to the
  surface's `onCreated`/`onDeleted` to re-render the **tree** on structural
  changes (adds/removes). Property/data changes are handled **inside** each
  bound node — the surface does not re-render for those. Renders `<A2uiNode id="root" basePath="">`.
- **`A2uiNode { id, basePath }`** — looks up the component, finds its React
  component in the registry, builds a fresh `ComponentContext`, renders
  `<Comp ctx={ctx} />`. Recursion enters through `buildChildNode`.
- **`createReactComponent(binder, View)`** — the bridge. On mount: `binder.bind(ctx)`,
  subscribe to `propsStream`; on unmount: unsubscribe + `dispose`. While
  `props == null` it renders nothing (first resolve hasn't fired).
- **`View(props, ctx, buildChild)`** — pure presentation. Reads `props`,
  optionally calls `buildChild(ref)` for children, handles DOM events by calling
  `ctx.set` (two-way) or `ctx.dispatchAction`.

## Invariants to preserve

- **Binder owns reactivity; View owns pixels.** Never read the data model
  directly in a View to derive display values — put it in the binder so it's
  tracked. A View *may* read `ctx.componentModel.properties` only for raw config
  it needs at event time (e.g. `boundPath(ctx, 'value')` for write-back).
- **Never recreate an existing surface id.**
- **Dispose what you subscribe.** The adapter handles node subscriptions; if you
  add a manual `EventSource.subscribe` in a View/preset, unsubscribe in the same
  effect's cleanup.
- **Flat map discipline.** Don't invent nested component JSON. Always reference
  children by id.
- **`passthrough` component schema.** Unknown component props are allowed by the
  envelope validator; it's the binder's job to pick, default, and type them.
