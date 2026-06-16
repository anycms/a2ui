# @anycms/a2ui-gallery

The **React dev gallery** for [A2UI](https://github.com/anycms/a2ui) v1.0 — an interactive sandbox that renders the same A2UI message stream through three renderers side by side: the React **vanilla** preset, the **shadcn/ui** preset, and the framework-agnostic **DOM** renderer.

Private (not published). It doubles as the reference wiring for `@anycms/a2ui-core` + `@anycms/a2ui-react` (+ shadcn + DOM) + `@anycms/a2ui-transport-sse`, and as a visual regression target for the 18 Basic Catalog components.

## What it shows

- **Renderer toggle** — Vanilla / shadcn / DOM. The same `SurfaceModel` drives all three; switching is a prop/registry swap (the DOM renderer mounts into a host element outside React via `mountDomSurface`).
- **Offline examples** — eight curated business examples loaded straight from the vendored spec (`a2ui/specification/v1_0/catalogs/basic/examples/`): weather, music player, login form, coffee order, recipe card, podcast, child-list template, and a modal. Each is processed verbatim in one shot.
- **Step-through sample** — a trimmed weather surface you advance message-by-message, exercising `formatString` interpolation and a data binding.
- **Live SSE** — connect to the anycms-agent example 27 backend; the `a2ui` track streams into the processor and dispatched actions POST back.
- **Live panes** — the rendered surface, a JSON snapshot of the reactive data model, and an action log.

## Run

From the repo root:

```bash
pnpm install          # first time only
pnpm dev              # Vite on http://localhost:5173
```

Or scoped: `pnpm --filter @anycms/a2ui-gallery dev`.

To exercise **live SSE**, start the example 27 backend on `127.0.0.1:3000`, then in the gallery leave the backend URL **empty** (uses the dev proxy) and hit **Connect**. The proxy lives in [`vite.config.ts`](./vite.config.ts): it forwards `/agent-ui` (both the SSE stream and the action POST) to `127.0.0.1:3000` same-origin, with SSE streaming passed through unbuffered.

## How it's wired

The whole app is [`src/main.tsx`](./src/main.tsx) — one `MessageProcessor({ catalogs: [basicCatalog] })`, a renderer-mode switch, and three input sources (examples, step-through, SSE) all calling `processor.processMessages(...)`. Structural changes are observed via `processor.model.onSurfaceCreated` / `onSurfaceDeleted`; the data-model pane re-snapshots on every root write via `surface.dataModel.subscribe('/', …)`. `@tailwindcss/vite` is enabled so the shadcn preset's utility classes resolve.

## See also

- Sibling galleries: [`a2ui-vue-gallery`](../a2ui-vue-gallery) (Vue/DOM), [`a2ui-angular-gallery`](../a2ui-angular-gallery) (Angular/DOM).
- Renderers: [`@anycms/a2ui-react`](../a2ui-react), [`@anycms/a2ui-react-shadcn`](../a2ui-react-shadcn), [`@anycms/a2ui-dom`](../a2ui-dom).

## License

MIT © Liangdi
