# Custom catalogs, functions, and transports

Beyond the Basic Catalog: define your own catalog (new components and/or
functions), add a catalog function, or wire a non-SSE transport. All three reuse
the core primitives — no fork required.

## A. Define a custom catalog

A `Catalog` is `{ id (URI), components (binders), functions (registry),
themeSchema?, instructions? }`. It is **composable**: spread the Basic Catalog's
binders and add your own. From [`packages/a2ui-core/src/catalog/index.ts`](./../../../packages/a2ui-core/src/catalog/index.ts):

```ts
import { Catalog, basicComponentBinders, basicFunctions, FunctionRegistry } from '@anycms/a2ui-core';

// Your custom binder(s) — defineBinder, same shape as basic
const mapBinder: ComponentBinder<MapProps> = defineBinder({
  name: 'Map',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return { lat: ctx.resolveDynamicValue<number>(p.lat ?? 0),
             lng: ctx.resolveDynamicValue<number>(p.lng ?? 0) };
  },
});

export const acmeCatalogId = 'https://acme.com/a2ui/v1_0/catalogs/acme/catalog.json';
export const acmeCatalog = new Catalog({
  id: acmeCatalogId,
  components: [...basicComponentBinders, mapBinder],   // extend, don't replace
  functions: new FunctionRegistry(basicFunctions),
  instructions: 'Acme extension over the Basic Catalog.',
});
```

Then register it with the processor so it can resolve the catalog id the server
sends:

```ts
const processor = new MessageProcessor({ catalogs: [basicCatalog, acmeCatalog] });
```

`getClientCapabilities()` will now advertise both catalog ids. Put your catalog
module under `packages/a2ui-core/src/catalogs/<name>/index.ts` and re-export from
`src/index.ts` if it should be public. If the catalog's components need React
Views, add a registry entry in each preset package (the binder is reusable; the
View is per-preset — same split as Basic).

### Inline catalogs (spec feature)

The server may send an `inlineCatalogs` array in capabilities. Today the
processor matches catalogs **only by id** from its constructor list; inline
catalog parsing is not wired. If you need it, follow
[`a2ui/specification/v1_0/docs/a2ui_extension_specification.md`](./../../../a2ui/specification/v1_0/docs/a2ui_extension_specification.md)
and extend `MessageProcessor`.

## B. Add a catalog function

Functions are invoked via `{ call: 'name', args: {...} }` dynamic values, and
also via `Button.action.functionCall`. They are reactive: the registry wraps
`execute` in a `Computed`, and every dynamic `args` binding auto-tracks.

Implement `FunctionImplementation` and register it. Functions are plain
objects (there is no `defineFunction` helper) — mirror
[`packages/a2ui-core/src/functions/index.ts`](./../../../packages/a2ui-core/src/functions/index.ts):

```ts
import { FunctionImplementation } from '@anycms/a2ui-core';

export const uppercaseFn: FunctionImplementation = {
  name: 'uppercase',
  returnType: 'string',
  schema: {},           // note: {} for functions (binders use null)
  execute(args, ctx) {
    // args are ALREADY resolved (dynamic bindings evaluated by the registry)
    return String(args.value ?? '').toUpperCase();
  },
};
```

- `execute` receives **resolved** args (the registry calls `resolveArgs`). Do not
  re-resolve; just use them.
- Return a plain value. The registry makes it reactive.
- Register: either add to the `basicFunctions` array (if it belongs in the Basic
  Catalog's function set) or pass a custom `FunctionRegistry` to your catalog.
- For side effects that must round-trip to the server (e.g. `openUrl` today
  dispatches an action), look at how [`functions/index.ts`](./../../../packages/a2ui-core/src/functions/index.ts)
  implements `openUrl` — it uses `ctx` to dispatch rather than returning a value.

Existing functions: `required, regex, length, numeric, email, and, or, not,
formatString, formatNumber, formatCurrency, formatDate, pluralize, openUrl,
@index`. Read them before adding a similar one — `formatString`'s `${/path}`
interpolation is reusable.

## C. Wire a transport (SSE today; others follow)

The transport's job is narrow: **inbound** — parse raw server messages and feed
`processor.processMessages([parseA2uiMessage(raw)])`; **outbound** — serialize
client actions and POST them back. The reference is
[`packages/a2ui-transport-sse/src/index.ts`](./../../../packages/a2ui-transport-sse/src/index.ts),
a single class with no framework deps.

To add a new transport (WebSocket, A2A JSON-RPC over HTTP, etc.):

1. **Create a package** mirroring `a2ui-transport-sse` (same `tsup`/`vitest`/
   `tsconfig` configs; depends on `@anycms/a2ui-core` only).
2. **Inbound:** on each server frame, call
   `processor.processMessages([parseA2uiMessage(raw)])`. `parseA2uiMessage` runs
   the Zod envelope validation and throws `A2uiValidationError` on a bad frame —
   catch and log per the SSE transport's pattern.
3. **Outbound:** subscribe to the processor's action stream and forward:

   ```ts
   const sub = processor.model.onAction.subscribe((action) => {
     // action: A2uiClientAction { name, surfaceId, sourceComponentId, timestamp, context, ... }
     const event: ClientEvent = { version: 'v1.0', action };
     sendToServer(serializeClientEvent(event));
   });
   // unsubscribe on stop()
   ```

4. **Function responses/errors:** if you pass `onClientEvent` to the processor,
   it will hand you `functionResponse` / `error` envelopes from `callFunction`
   messages; forward those over the transport too.
5. **Capabilities handshake:** the server needs to know which catalogs the
   client supports. Call `processor.getClientCapabilities()` at negotiation time
   and send it (how depends on your wire protocol — see the A2A extension spec
   for the `a2uiClientCapabilities` metadata placement).

The transport never touches React or the data model directly beyond these two
hooks — that separation is what makes the core reusable across wire formats.

## D. Common gotchas

- **Unknown catalog id at `createSurface` time throws.** Always register every
  catalog the server may reference before processing messages.
- **Function names are catalog-scoped.** Two catalogs with a function of the
  same name — the processor searches catalogs in order and uses the first match
  (see `processCallFunction`). Avoid collisions.
- **`@index` is special** — it's the current template-iteration index, resolved
  via the scoped context. Don't shadow it.
- **Transport must dispose.** `stop()` should close the connection **and**
  unsubscribe the action forwarder, exactly like `SseA2uiTransport.stop()`.
