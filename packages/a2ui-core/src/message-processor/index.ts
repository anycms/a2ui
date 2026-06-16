import { batch } from '../reactive';
import type { Subscription } from '../reactive';
import { Catalog } from '../catalog';
import {
  SurfaceGroupModel,
  SurfaceModel,
  ComponentModel,
} from '../components';
import { DataModel } from '../datamodel';
import { DataContext } from '../context';
import type {
  A2uiMessage,
  ActionResponseMessage,
  CallFunctionMessage,
  ClientEvent,
  CreateSurfaceMessage,
  DeleteSurfaceMessage,
  UpdateComponentsMessage,
  UpdateDataModelMessage,
} from '../schema';

export interface SurfaceLifecycleListener {
  onSurfaceCreated?: (surface: SurfaceModel) => void;
  onSurfaceDeleted?: (id: string) => void;
}

export interface A2uiClientCapabilities {
  v1_0: {
    supportedCatalogIds: string[];
    inlineCatalogs?: unknown[];
  };
}

export interface A2uiClientDataModel {
  version: 'v1.0';
  surfaces: Record<string, unknown>;
}

export interface MessageProcessorOptions {
  readonly catalogs: Catalog[];
  /** Outbound channel for client->server events (functionResponse / error). */
  readonly onClientEvent?: (event: ClientEvent) => void;
  /**
   * Called for every actionResponse after the responsePath write-back (if any)
   * has been applied. Surfaces errors and responsePath-less responses to the
   * application layer.
   */
  readonly onActionResponse?: (r: {
    actionId: string;
    value?: unknown;
    error?: { code: string; message: string };
  }) => void;
}

/**
 * The controller that accepts a stream of validated A2UI messages, parses them
 * into model mutations, and aggregates client state for synchronization
 * (renderer_guide.md §MessageProcessor). All messages in a `processMessages`
 * call are applied inside a single `batch()`, so the renderer repaints once.
 */
export class MessageProcessor {
  readonly model = new SurfaceGroupModel();
  private readonly catalogs: Catalog[];
  private readonly onClientEvent?: (event: ClientEvent) => void;
  private readonly onActionResponse?: MessageProcessorOptions['onActionResponse'];

  /**
   * actionId → the surface + JSON pointer to write an actionResponse value to.
   * Populated by subscribing to `model.onAction` for actions carrying both
   * `responsePath` and `actionId`; drained as responses arrive.
   */
  private readonly pendingActionResponses = new Map<
    string,
    { surfaceId: string; responsePath: string }
  >();
  private actionSub?: Subscription;

  constructor(opts: MessageProcessorOptions) {
    this.catalogs = opts.catalogs;
    this.onClientEvent = opts.onClientEvent;
    this.onActionResponse = opts.onActionResponse;
    this.actionSub = this.model.onAction.subscribe((action) => {
      if (action.responsePath !== undefined && action.actionId !== undefined) {
        this.pendingActionResponses.set(action.actionId, {
          surfaceId: action.surfaceId,
          responsePath: action.responsePath,
        });
      }
    });
  }

  processMessages(messages: readonly A2uiMessage[]): void {
    batch(() => {
      for (const msg of messages) this.processOne(msg);
    });
  }

  /** Release the model.onAction subscription. */
  dispose(): void {
    this.actionSub?.unsubscribe();
    this.actionSub = undefined;
  }

  private processOne(msg: A2uiMessage): void {
    if ('createSurface' in msg) {
      this.processCreateSurface(msg.createSurface);
    } else if ('updateComponents' in msg) {
      this.processUpdateComponents(msg.updateComponents);
    } else if ('updateDataModel' in msg) {
      this.processUpdateDataModel(msg.updateDataModel);
    } else if ('deleteSurface' in msg) {
      this.model.deleteSurface((msg as DeleteSurfaceMessage).deleteSurface.surfaceId);
    } else if ('callFunction' in msg) {
      this.processCallFunction(msg as CallFunctionMessage);
    } else if ('actionResponse' in msg) {
      this.processActionResponse(msg as ActionResponseMessage);
    }
  }

  private processActionResponse(msg: ActionResponseMessage): void {
    const pending = this.pendingActionResponses.get(msg.actionId);
    if (pending) {
      this.pendingActionResponses.delete(msg.actionId);
      if (msg.actionResponse.value !== undefined) {
        const surface = this.model.get(pending.surfaceId);
        surface?.dataModel.set(pending.responsePath, msg.actionResponse.value);
      }
    }
    this.onActionResponse?.({ actionId: msg.actionId, ...msg.actionResponse });
  }

  private findCatalog(catalogId: string): Catalog | undefined {
    return this.catalogs.find((c) => c.id === catalogId);
  }

  private processCreateSurface(body: CreateSurfaceMessage['createSurface']): void {
    const catalog = this.findCatalog(body.catalogId);
    if (!catalog) {
      throw new Error(`Unknown catalogId: ${body.catalogId}`);
    }
    const surface = new SurfaceModel({
      id: body.surfaceId,
      catalogId: body.catalogId,
      surfaceProperties: body.surfaceProperties,
      dataModel: body.dataModel,
      sendDataModel: body.sendDataModel,
    });
    this.model.addSurface(surface); // throws on duplicate surfaceId
    if (body.components) this.applyComponents(surface, body.components);
  }

  private processUpdateComponents(body: UpdateComponentsMessage['updateComponents']): void {
    const surface = this.model.get(body.surfaceId);
    if (!surface) return; // progressive rendering: surface may not exist yet
    this.applyComponents(surface, body.components);
  }

  private applyComponents(surface: SurfaceModel, components: readonly unknown[]): void {
    for (const raw of components) {
      const r = raw as { id?: string; component?: string };
      const id = r.id;
      const type = r.component;
      if (!id || !type) continue;
      const props: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
      const existing = surface.componentsModel.get(id);
      if (existing) {
        if (existing.type === type) {
          existing.properties = props; // update in place (fires onUpdated)
        } else {
          // type changed -> rebuild so renderers reset internal state
          surface.componentsModel.remove(id);
          surface.componentsModel.add(new ComponentModel(id, type, props));
        }
      } else {
        surface.componentsModel.add(new ComponentModel(id, type, props));
      }
    }
  }

  private processUpdateDataModel(body: UpdateDataModelMessage['updateDataModel']): void {
    const surface = this.model.get(body.surfaceId);
    if (!surface) return;
    const path = body.path ?? '/';
    if (path === '/' || path === '') {
      surface.dataModel.replaceAll(body.value === undefined ? {} : body.value);
    } else {
      surface.dataModel.set(path, body.value); // undefined value => delete key
    }
  }

  private processCallFunction(msg: CallFunctionMessage): void {
    const call = msg.callFunction.call;
    const args = msg.callFunction.args ?? {};
    for (const cat of this.catalogs) {
      const impl = cat.functions.get(call);
      if (impl) {
        const ctx = new DataContext(new DataModel(), '', cat.functions);
        try {
          const result = impl.execute(args, ctx);
          if (msg.wantResponse && this.onClientEvent) {
            this.onClientEvent({
              version: 'v1.0',
              functionResponse: {
                functionCallId: msg.functionCallId,
                call,
                value: result,
              },
            });
          }
        } catch (e) {
          if (this.onClientEvent) {
            this.onClientEvent({
              version: 'v1.0',
              error: {
                code: 'FUNCTION_ERROR',
                message: (e as Error).message,
                functionCallId: msg.functionCallId,
              },
            });
          }
        }
        return;
      }
    }
    if (this.onClientEvent) {
      this.onClientEvent({
        version: 'v1.0',
        error: {
          code: 'INVALID_FUNCTION_CALL',
          message: `Unknown function: ${call}`,
          functionCallId: msg.functionCallId,
        },
      });
    }
  }

  addLifecycleListener(l: SurfaceLifecycleListener): () => void {
    const subs: Array<() => void> = [];
    if (l.onSurfaceCreated) {
      subs.push(this.model.onSurfaceCreated.subscribe(l.onSurfaceCreated).unsubscribe);
    }
    if (l.onSurfaceDeleted) {
      subs.push(this.model.onSurfaceDeleted.subscribe(l.onSurfaceDeleted).unsubscribe);
    }
    return () => subs.forEach((u) => u());
  }

  getClientCapabilities(): A2uiClientCapabilities {
    return {
      v1_0: {
        supportedCatalogIds: this.catalogs.map((c) => c.id),
      },
    };
  }

  getClientDataModel(): A2uiClientDataModel | undefined {
    const surfaces: Record<string, unknown> = {};
    for (const surface of this.model.values()) {
      if (surface.sendDataModel) {
        surfaces[surface.id] = surface.dataModel.snapshot();
      }
    }
    return Object.keys(surfaces).length > 0 ? { version: 'v1.0', surfaces } : undefined;
  }
}
