# @anycms/a2ui-angular-gallery

The **Angular dev gallery** for [A2UI](https://github.com/anycms/a2ui) v1.0 — an interactive sandbox that renders the same A2UI message stream through the **Angular** renderer and the framework-agnostic **DOM** renderer side by side. It is fully **zoneless** and **signal-driven**.

Private (not published). It is the Angular counterpart to [`a2ui-gallery`](../a2ui-gallery) and [`a2ui-vue-gallery`](../a2ui-vue-gallery), and doubles as the reference wiring for `@anycms/a2ui-core` + `@anycms/a2ui-angular` (+ DOM) + `@anycms/a2ui-transport-sse`.

## What it shows

- **Renderer toggle** — Angular / DOM. The same `SurfaceModel` drives both; the DOM renderer is hosted by [`DomHostComponent`](./src/app/dom-host.component.ts), which mounts via `mountDomSurface` and remounts whenever the `surface` signal input changes.
- **Offline examples** — curated business examples (see [`src/app/examples.ts`](./src/app/examples.ts)), processed verbatim in one shot.
- **Step-through sample** — a trimmed weather surface you advance message-by-message, exercising `formatString` interpolation and a data binding.
- **Live SSE** — connect to the anycms-agent example 27 backend; the `a2ui` track streams into the processor and dispatched actions POST back.
- **Live panes** — the rendered surface, a JSON snapshot of the reactive data model, and an action log.

## Run

From the repo root:

```bash
pnpm install          # first time only
pnpm --filter @anycms/a2ui-angular-gallery dev   # ng serve on http://localhost:4200
```

To exercise **live SSE**, start the example 27 backend on `127.0.0.1:3000`, then in the gallery leave the backend URL **empty** (uses the dev proxy) and hit **Connect**. The proxy lives in [`proxy.conf.json`](./proxy.conf.json): it forwards `/agent-ui` (both the SSE stream and the action POST) to `127.0.0.1:3000` same-origin.

## How it's wired

- [`src/app/app.config.ts`](./src/app/app.config.ts) enables `provideZonelessChangeDetection()` (Angular v21 default, set explicitly). No `zone.js`.
- [`src/app/app.component.ts`](./src/app/app.component.ts) holds one `MessageProcessor({ catalogs: [basicCatalog] })` and a `mode` signal. Structural changes bump a `structTick` signal; the data-model pane is driven by a separate `dataTick` signal updated through an `effect` that re-subscribes to `surface.dataModel.subscribe('/', …)` whenever the surface changes (the bump is wrapped in `untracked` to avoid an effect → set → re-run loop, because core's `subscribe` replays synchronously).

Typecheck/build is `ng build`; [`tsconfig.app.json`](./tsconfig.app.json) is self-contained (the repo base's `declaration: true` would otherwise poison the application builder's type-check program).

## See also

- Sibling galleries: [`a2ui-gallery`](../a2ui-gallery) (React: Vanilla/shadcn/DOM), [`a2ui-vue-gallery`](../a2ui-vue-gallery) (Vue/DOM).
- Renderers: [`@anycms/a2ui-angular`](../a2ui-angular), [`@anycms/a2ui-dom`](../a2ui-dom).

## License

MIT © Liangdi
