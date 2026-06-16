# @anycms/a2ui-vue-gallery

The **Vue 3 dev gallery** for [A2UI](https://github.com/anycms/a2ui) v1.0 — an interactive sandbox that renders the same A2UI message stream through the **Vue** renderer and the framework-agnostic **DOM** renderer side by side.

Private (not published). It is the Vue counterpart to [`a2ui-gallery`](../a2ui-gallery) and doubles as the reference wiring for `@anycms/a2ui-core` + `@anycms/a2ui-vue` (+ DOM) + `@anycms/a2ui-transport-sse`.

## What it shows

- **Renderer toggle** — Vue / DOM. The same `SurfaceModel` drives both; the DOM renderer mounts into a host `<div>` outside Vue via `mountDomSurface` (wired with a `flush: 'post'` watcher so the ref is patched in first).
- **Offline examples** — eight curated business examples loaded straight from the vendored spec (`a2ui/specification/v1_0/catalogs/basic/examples/`), processed verbatim in one shot.
- **Step-through sample** — a trimmed weather surface you advance message-by-message, exercising `formatString` interpolation and a data binding.
- **Live SSE** — connect to the anycms-agent example 27 backend; the `a2ui` track streams into the processor and dispatched actions POST back.
- **Live panes** — the rendered surface, a JSON snapshot of the reactive data model, and an action log.

## Run

From the repo root:

```bash
pnpm install          # first time only
pnpm --filter @anycms/a2ui-vue-gallery dev   # Vite on http://localhost:5174
```

To exercise **live SSE**, start the example 27 backend on `127.0.0.1:3000`, then in the gallery leave the backend URL **empty** (uses the dev proxy) and hit **Connect**. The proxy lives in [`vite.config.ts`](./vite.config.ts): it forwards `/agent-ui` (both the SSE stream and the action POST) to `127.0.0.1:3000` same-origin, with SSE streaming passed through unbuffered.

## How it's wired

The whole app is [`src/App.vue`](./src/App.vue) (a single `<script setup>` SFC) — one `MessageProcessor({ catalogs: [basicCatalog] })`, a renderer-mode `ref`, and the three input sources (examples, step-through, SSE) all calling `processor.processMessages(...)`. Structural changes bump a `tick` ref that drives derived `computed`s (mirroring the React gallery's force-rerender); the data-model pane re-snapshots on every root write via `surface.dataModel.subscribe('/', rerender)`. `vue-tsc` typechecks the SFCs (`pnpm --filter @anycms/a2ui-vue-gallery typecheck`).

## See also

- Sibling galleries: [`a2ui-gallery`](../a2ui-gallery) (React: Vanilla/shadcn/DOM), [`a2ui-angular-gallery`](../a2ui-angular-gallery) (Angular/DOM).
- Renderers: [`@anycms/a2ui-vue`](../a2ui-vue), [`@anycms/a2ui-dom`](../a2ui-dom).

## License

MIT © Liangdi
