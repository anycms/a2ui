import {
  parseA2uiMessage,
  serializeClientEvent,
  type A2uiClientAction,
  type ClientAction,
  type MessageProcessor,
} from '@anycms/a2ui-core';

export interface SseTransportOptions {
  /** Base URL of the backend, e.g. http://127.0.0.1:3000 */
  baseUrl: string;
  /** Initial prompt (passed as ?prompt=). Defaults to the backend's default demo. */
  prompt?: string;
  /** The processor that consumes parsed A2UI messages. */
  processor: MessageProcessor;
  /** Optional hooks for the non-rendering SSE tracks emitted by example 27. */
  onContent?: (data: unknown) => void;
  onConstraint?: (data: unknown) => void;
  onMeta?: (data: unknown) => void;
  onError?: (e: Event) => void;
}

/**
 * SSE transport adapter for the anycms-agent example 27 backend
 * (`/agent-ui` GET stream + `/agent-ui/{sid}/action` POST).
 *
 * Consumes the `a2ui` rendering track (validated + forwarded to the processor),
 * captures `sessionId` from `meta`, and forwards user actions back to the server
 * — completing the client → server → client loop.
 */
export class SseA2uiTransport {
  readonly baseUrl: string;
  readonly prompt: string;
  private es: EventSource | null = null;
  private actionSub: { unsubscribe: () => void } | null = null;
  private sessionId: string | null = null;

  constructor(private readonly opts: SseTransportOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.prompt = opts.prompt ?? '';
  }

  /** Open the SSE stream and begin auto-forwarding actions. */
  start(): void {
    const url = `${this.baseUrl}/agent-ui${
      this.prompt ? '?prompt=' + encodeURIComponent(this.prompt) : ''
    }`;
    this.es = new EventSource(url);

    this.es.addEventListener('meta', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        this.sessionId = data.sessionId ?? null;
        this.opts.onMeta?.(data);
      } catch {
        /* ignore malformed meta */
      }
    });

    this.es.addEventListener('a2ui', (e) => {
      try {
        const raw = JSON.parse((e as MessageEvent).data);
        const msg = parseA2uiMessage(raw);
        this.opts.processor.processMessages([msg]);
      } catch (err) {
        console.error('[a2ui-sse] failed to apply a2ui message:', err);
      }
    });

    this.es.addEventListener('content', (e) => {
      try {
        this.opts.onContent?.(JSON.parse((e as MessageEvent).data));
      } catch {
        /* ignore */
      }
    });

    this.es.addEventListener('constraint', (e) => {
      try {
        this.opts.onConstraint?.(JSON.parse((e as MessageEvent).data));
      } catch {
        /* ignore */
      }
    });

    this.es.onerror = (e) => this.opts.onError?.(e);

    // Auto-forward client actions to the server's action endpoint.
    this.actionSub = this.opts.processor.model.onAction.subscribe((action) => {
      void this.dispatchAction(action).catch((err) =>
        console.error('[a2ui-sse] action dispatch failed:', err),
      );
    });
  }

  /** POST a client action back to the server (client → server). */
  async dispatchAction(action: A2uiClientAction): Promise<void> {
    if (!this.sessionId) throw new Error('Session not ready: no sessionId received yet');
    const event: ClientAction = { version: 'v1.0', action };
    const res = await fetch(
      `${this.baseUrl}/agent-ui/${encodeURIComponent(this.sessionId)}/action`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serializeClientEvent(event),
      },
    );
    if (!res.ok) throw new Error(`action POST failed: ${res.status}`);
  }

  stop(): void {
    this.actionSub?.unsubscribe();
    this.actionSub = null;
    this.es?.close();
    this.es = null;
  }
}
