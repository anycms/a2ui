# @anycms/a2ui-transport-sse

An **SSE transport adapter** for [A2UI](https://github.com/anycms/a2ui) v1.0. It wires a server-sent-events stream into a `MessageProcessor`, completing the **client → server → client** loop: server JSON is parsed and applied to the live model, and the user actions that surface from that model are POSTed straight back.

It targets the **anycms-agent example 27 backend** — a `GET /agent-ui` SSE stream paired with a `POST /agent-ui/{sid}/action` endpoint — but the wiring is generic enough for any backend that emits an `a2ui` event track.

## Why

A2UI is server-driven, so a renderer needs two things the model can't provide: a feed of messages *in* and a channel for client actions *out*. This package is that plumbing — one class that owns the `EventSource`, validates and forwards the `a2ui` track through `parseA2uiMessage`, captures the `sessionId` from the `meta` track, and auto-subscribes to `processor.model.onAction` so every dispatched action is forwarded without any glue code in the app.

It depends only on `@anycms/a2ui-core` and the browser's `EventSource` / `fetch`.

## Install

```bash
pnpm add @anycms/a2ui-transport-sse @anycms/a2ui-core
```

## Usage

```ts
import { MessageProcessor, basicCatalog } from '@anycms/a2ui-core';
import { SseA2uiTransport } from '@anycms/a2ui-transport-sse';

const processor = new MessageProcessor({ catalogs: [basicCatalog] });

const transport = new SseA2uiTransport({
  baseUrl: 'http://127.0.0.1:3000', // backend serving /agent-ui
  prompt: 'show me a login form',   // optional — passed as ?prompt=
  processor,
  onMeta: (data) => console.log('session:', data.sessionId),
  onContent: (data) => console.log('content track:', data),
  onConstraint: (data) => console.log('constraint track:', data),
  onError: (e) => console.error('sse error:', e),
});

transport.start();   // open the stream; actions now auto-forward
// …
transport.stop();    // close the stream + unsubscribe the action forwarder
```

### What it does on each track

| SSE event | Handling |
| --- | --- |
| `meta` | Captures `sessionId` (required before an action can be dispatched); forwards to `onMeta`. |
| `a2ui` | `parseA2uiMessage(raw)` → `processor.processMessages([msg])`. Invalid messages are logged and dropped. |
| `content` / `constraint` | Forwarded verbatim to `onContent` / `onConstraint` (non-rendering tracks specific to example 27). |
| `error` | Forwarded to `onError`. |

### The action loop

`start()` subscribes to `processor.model.onAction`. Each action is POSTed to `/agent-ui/{sessionId}/action` as a serialized `ClientAction`. You can also dispatch manually:

```ts
await transport.dispatchAction({ name: 'submit', context: { … } });
// throws if start() hasn't received a sessionId yet
```

### Same-origin dev proxy

Pointing `baseUrl` at a different origin triggers CORS. In dev, leave `baseUrl` empty and proxy `/agent-ui` to the backend same-origin — see how the galleries do it (`vite.config.ts` `server.proxy`, or Angular's `proxy.conf.json`).

## See also

- [`@anycms/a2ui-core`](../a2ui-core) — `MessageProcessor`, `parseA2uiMessage`, `serializeClientEvent`.
- The galleries ([`a2ui-gallery`](../a2ui-gallery), [`a2ui-vue-gallery`](../a2ui-vue-gallery), [`a2ui-angular-gallery`](../a2ui-angular-gallery)) — full working wiring.

## License

MIT © Liangdi
