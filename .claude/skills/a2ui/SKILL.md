---
name: a2ui
description: >
  Develop in the anycms-a2ui monorepo — a TypeScript implementation of the A2UI v1.0
  server-driven-UI protocol (server streams component JSON + data; a thin client renders it).
  Use when adding/modifying a Basic Catalog component, writing a binder or React View, creating
  a new renderer preset (look-and-feel), building a custom catalog or function, wiring the SSE
  transport, touching the gallery demo, or when unsure of the data-flow / reactivity model and
  spec conventions. Covers the layered architecture (core → react → presets → transport), the
  zero-dependency reactivity engine, build/test/typecheck commands, and the exact file-by-file
  checklist for each common task.
---

# A2UI development guide

This is the working guide for the `anycms-a2ui` monorepo. Read this when you
touch A2UI code. Deep detail lives in [`reference/`](./reference) — load the
file you need, don't read them all.

## What this project is

A **client-side** renderer for the [A2UI v1.0](./../../../a2ui/specification/v1_0)
server-driven-UI protocol. A backend streams JSON messages that describe
*surfaces* (UI regions) as a **flat map of components** plus a reactive **data
model**; the client binds and renders them. The protocol spec is vendored and
authoritative — when a question is "what should this do?", the answer is in
`a2ui/specification/v1_0/`.

This repo ships **nine pnpm workspace packages** (scope `@anycms`):

| Package | Layer | Role |
| --- | --- | --- |
| `packages/a2ui-core` | Data (framework-agnostic) | Reactivity (`Signal`/`Computed`/`EventSource`/`batch`), JSON-Pointer, `DataModel`, component models, dynamic-value resolution, Zod schema, **binders**, **catalogs**, `MessageProcessor`. |
| `packages/a2ui-react` | View (React adapter) | `createReactComponent`, `<A2uiSurface>`, `A2uiNode`, and the 18 **vanilla** Views + `basicReactComponents` registry. |
| `packages/a2ui-react-shadcn` | View (preset) | Same 18 components re-skinned with Radix + Tailwind (`shadcnReactComponents`). |
| `packages/a2ui-vue` | View (Vue 3 adapter) | `createVueComponent`, `<A2uiSurface>`, `A2uiNode`, and the 18 vanilla Views as Vue render-function components + `basicVueComponents` registry. Mirrors the React adapter shape; plain `.ts` (no SFCs/vue-tsc needed for the lib). Stateful Views (`Tabs`/`Modal`) use an internal `defineComponent`. |
| `packages/a2ui-angular` | View (Angular 21 adapter) | `<a2ui-surface>`, `<a2ui-node>`, `A2uiBoundComponent` (binder→signal bridge), and the 18 vanilla Views as standalone, **zoneless, signal-driven** components + `basicAngularComponents` registry (`Map<type,{binder,view}>`). Built with **ng-packagr** (`tsconfig.lib.json` is self-contained, `moduleResolution: node`, `OnPush` omitted because Angular 21's chunked `ChangeDetectionStrategy` type breaks ng-packagr's partial evaluator under zoneless). |
| `packages/a2ui-transport-sse` | Transport | `SseA2uiTransport` — SSE in, action POST out. |
| `packages/a2ui-gallery` | Demo (private) | Vite app: offline example step-through + live SSE + Vanilla/shadcn/DOM toggle. |
| `packages/a2ui-vue-gallery` | Demo (private) | Vue 3 Vite app: offline examples + live SSE + Vue/DOM toggle. |
| `packages/a2ui-angular-gallery` | Demo (private) | Angular CLI app (zoneless): offline examples + live SSE + Angular/DOM toggle. `tsconfig.app.json` is **self-contained** (the library-oriented base's `declaration:true` poisons the app builder's type-check program). |

## Mental model (read this first)

```
server JSON  →  parseA2uiMessage (Zod)  →  MessageProcessor.processMessages(batch)
                                                      │ mutates
                                                      ▼
            SurfaceGroupModel ─► SurfaceModel ─► SurfaceComponentsModel (flat Map<id,ComponentModel>)
                                            └──── DataModel (reactive JSON, JSON-Pointer addressed)
                                                      │ <A2uiSurface> renders root, re-renders on add/remove
                                                      ▼
            A2uiNode(id) → registry.get(type) → createReactComponent(binder, View)
                                                      │ binder.bind(ctx).propsStream (a Computed)
                                                      ▼
            View receives resolved, typed props → paints; user input → ctx.set / ctx.dispatchAction
```

**The binder is the single source of truth.** A binder's `resolve()` function
turns raw component JSON into strongly-typed `ResolvedProps`, and it runs inside
a `Computed` — so every `ctx.resolveDynamicValue(...)` call inside it
**auto-registers a data-model dependency**. When the bound data changes, the
props stream emits a fresh object (new reference) and React re-renders. Views
are dumb presenters over those props.

The 18 Basic Catalog components: `Text, Image, Icon, Video, AudioPlayer, Row,
Column, List, Card, Tabs, Divider, Modal, Button, CheckBox, TextField,
DateTimeInput, ChoicePicker, Slider`.

## Decision tree — "I want to…"

- **Add or modify a Basic Catalog component** (new prop, new component, fix a
  binding) → [`reference/components.md`](./reference/components.md). This is the
  single most common task; it touches core (binder) + **all three** view packages
  (React, Vue, Angular) + their registries.
- **Understand the data flow, reactivity, or where something lives** →
  [`reference/architecture.md`](./reference/architecture.md).
- **Create a new look-and-feel** (MUI, Chakra, a brand kit…) →
  [`reference/presets.md`](./reference/presets.md). Copy the shadcn package.
- **Make a custom catalog, add a custom function, or wire a non-SSE transport**
  → [`reference/catalogs.md`](./reference/catalogs.md).
- **Find the protocol truth** → read `a2ui/specification/v1_0/docs/`
  (`a2ui_protocol.md`, `renderer_guide.md`, `a2ui_custom_functions.md`,
  `basic_catalog_implementation_guide.md`, `a2ui_extension_specification.md`)
  and the JSON schemas in `a2ui/specification/v1_0/json/` and
  `.../catalogs/basic/catalog.json`.

## Commands (run from repo root)

```bash
pnpm install          # first time only (Node ≥ 20, pnpm 10)
pnpm typecheck        # tsc --noEmit across all packages   ← run after every change
pnpm test             # vitest run across all packages
pnpm build            # tsup for libs, ng-packagr for a2ui-angular, vite/ng for galleries
pnpm dev              # React gallery on http://localhost:5173
pnpm clean            # rm dist + .tsbuildinfo
```

Single package: `pnpm --filter @anycms/a2ui-core test`, etc. Tests are
colocated as `*.test.ts` / `*.test.tsx` next to source.

**Angular package specifics** (`packages/a2ui-angular`):
- Build/typecheck is `ng-packagr -c tsconfig.lib.json` (AOT; this is the
  authoritative typecheck — templates are checked here, not by plain `tsc`).
  `tsconfig.lib.json` must stay self-contained with `moduleResolution: "node"`
  (bundler breaks ng-packagr's resolution of `@anycms/a2ui-core`) and **no**
  `OnPush` (Angular 21's chunked `ChangeDetectionStrategy` type fails ng-packagr's
  partial evaluator; zoneless CD makes `OnPush` unnecessary anyway).
- Tests (`pnpm --filter @anycms/a2ui-angular test`) run vitest + `TestBed` (JIT,
  zoneless) **against the built `dist`** (a `pretest` hook builds first). Don't
  import component source in tests — vitest's esbuild JIT transform doesn't
  register signal `input()` fields, so always import from `@anycms/a2ui-angular`.
- The gallery (`packages/a2ui-angular-gallery`) `typecheck`/`build` is
  `ng build`; its `tsconfig.app.json` is self-contained because the repo base's
  `declaration: true` poisons the application builder's type-check program.

## Non-negotiable conventions

These bite if ignored — verify each applies to your change:

1. **`verbatimModuleSyntax: true` + `isolatedModules`** (see
   [tsconfig.base.json](./../../../tsconfig.base.json)). Type-only imports
   **must** be `import type { … }`. Mixed value+type is fine; a type used only
   in a type position must be on the `type` list.
2. **Reactivity lives in the binder.** Inside `defineBinder.resolve`, read
   dynamic data **only** via `ctx.resolveDynamicValue<T>(p.foo)`. Reading
   `ctx.componentModel.properties.foo` is fine for *static* config, but it will
   **not** react to data changes. See [architecture.md](./reference/architecture.md).
3. **`dist/` is gitignored** — never edit it; it's a tsup build artifact.
4. **Surface IDs are globally unique per session** — re-creating one throws.
   Components are keyed by `id` in a **flat** map; children are referenced by
   id string (`children: ['a','b']`) or template (`{componentId, path}`), never
   nested inline.
5. **All messages in one `processMessages()` call apply in one `batch()`** →
   one repaint. Don't call `processMessages` per-message if you can batch.
6. **A component whose `type` changes is rebuilt** (removed + re-added) so the
   renderer resets internal state — rely on this, don't try to preserve state.
7. **Match the surrounding code's style.** Binders return plain objects with
   defaulted enums via the local `asVariant`/`asBool` helpers; Views are
   functional components taking `ComponentViewProps<P>`. Comments are dense and
   reference spec sections — keep that voice.
8. **Spec is authoritative.** If the binder and the JSON catalog disagree, the
   catalog (`a2ui/specification/v1_0/catalogs/basic/catalog.json`) wins; fix the
   binder.

## Scope of edits per task (cheat sheet)

| Task | Files touched |
| --- | --- |
| Add Basic Catalog component | core `catalogs/basic/index.ts` (+ export); react `components.tsx` + `registry.ts`; shadcn `components/<x>.tsx` + `registry.ts`; angular `components.ts` (a `@Component` View with `props`/`ctx` signal inputs) + `registry.ts`; test in each |
| Tweak an existing component's binding | core binder only (+ its test) |
| New prop on existing component | binder + all three Views (React/Vue/Angular) + props interfaces |
| New preset | new package cloning `a2ui-react-shadcn` (see presets.md) |
| New framework adapter | new package mirroring `a2ui-vue`/`a2ui-angular`: a binder→framework bridge, a recursive node unit, a `<surface>` entry, the 18 Views, a registry `Map`, and a parallel gallery |
| Custom catalog/function | new module + `new Catalog({...})` (see catalogs.md) |
| New transport | new package mirroring `a2ui-transport-sse` |

When done with any code change: run `pnpm typecheck` then `pnpm test`. Both
must pass before considering the task complete.
