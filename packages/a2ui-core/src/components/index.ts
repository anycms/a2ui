import { EventSource } from '../reactive';
import { DataModel } from '../datamodel';

/**
 * Matches the `action` message in specification/v1_0/json/client_to_server.json.
 */
export interface A2uiClientAction {
  name: string;
  surfaceId: string;
  sourceComponentId: string;
  /** ISO 8601 timestamp of when the interaction occurred. */
  timestamp: string;
  context: Record<string, unknown>;
  wantResponse?: boolean;
  actionId?: string;
}

export type ComponentProperties = Record<string, unknown>;
export type SurfaceProperties = Record<string, unknown>;

/**
 * The raw JSON configuration of a single component, held in a flat map. Its
 * `properties` setter fires `onUpdated` so framework renderers can re-render
 * just this node (renderer_guide.md §ComponentModel).
 */
export class ComponentModel {
  readonly id: string;
  readonly type: string; // component name, e.g. 'Button'
  readonly onUpdated = new EventSource<ComponentModel>();

  private _properties: ComponentProperties;

  constructor(id: string, type: string, properties: ComponentProperties) {
    this.id = id;
    this.type = type;
    this._properties = properties;
  }

  get properties(): ComponentProperties {
    return this._properties;
  }

  set properties(next: ComponentProperties) {
    this._properties = next;
    this.onUpdated.emit(this);
  }
}

/**
 * Flat adjacency-list store of components for one surface (renderer_guide.md
 * §SurfaceComponentsModel). The MessageProcessor decides add vs update vs
 * rebuild-on-type-change; this class only stores and emits lifecycle events.
 */
export class SurfaceComponentsModel {
  private readonly components = new Map<string, ComponentModel>();
  readonly onCreated = new EventSource<ComponentModel>();
  readonly onDeleted = new EventSource<string>();

  get(id: string): ComponentModel | undefined {
    return this.components.get(id);
  }

  has(id: string): boolean {
    return this.components.has(id);
  }

  *values(): IterableIterator<ComponentModel> {
    yield* this.components.values();
  }

  add(component: ComponentModel): void {
    this.components.set(component.id, component);
    this.onCreated.emit(component);
  }

  remove(id: string): void {
    if (this.components.delete(id)) {
      this.onDeleted.emit(id);
    }
  }

  clear(): void {
    const ids = [...this.components.keys()];
    this.components.clear();
    for (const id of ids) this.onDeleted.emit(id);
  }
}

/**
 * The full state of a single UI surface (renderer_guide.md §SurfaceModel):
 * its id, catalogId, data model, flat component map, surface properties, and
 * an action channel.
 */
export class SurfaceModel {
  readonly id: string;
  readonly catalogId: string;
  readonly dataModel = new DataModel();
  readonly componentsModel = new SurfaceComponentsModel();
  readonly surfaceProperties: SurfaceProperties;
  readonly sendDataModel: boolean;
  readonly onAction = new EventSource<A2uiClientAction>();

  constructor(opts: {
    id: string;
    catalogId: string;
    surfaceProperties?: SurfaceProperties;
    dataModel?: unknown;
    sendDataModel?: boolean;
  }) {
    this.id = opts.id;
    this.catalogId = opts.catalogId;
    this.surfaceProperties = opts.surfaceProperties ?? {};
    this.sendDataModel = opts.sendDataModel ?? false;
    if (opts.dataModel !== undefined) {
      this.dataModel.replaceAll(opts.dataModel);
    }
  }

  /** Dispatch a user action from `sourceComponentId`. */
  dispatchAction(
    payload: { name: string; context?: Record<string, unknown>; wantResponse?: boolean; actionId?: string },
    sourceComponentId: string,
  ): void {
    const action: A2uiClientAction = {
      name: payload.name,
      surfaceId: this.id,
      sourceComponentId,
      timestamp: new Date().toISOString(),
      context: payload.context ?? {},
    };
    if (payload.wantResponse !== undefined) action.wantResponse = payload.wantResponse;
    if (payload.actionId !== undefined) action.actionId = payload.actionId;
    this.onAction.emit(action);
  }
}

/**
 * Root container for active surfaces (renderer_guide.md §SurfaceGroupModel).
 * Surface IDs must be globally unique per client session: re-creating an
 * existing surface throws.
 */
export class SurfaceGroupModel {
  private readonly surfaces = new Map<string, SurfaceModel>();
  readonly onSurfaceCreated = new EventSource<SurfaceModel>();
  readonly onSurfaceDeleted = new EventSource<string>();
  readonly onAction = new EventSource<A2uiClientAction>();

  get(id: string): SurfaceModel | undefined {
    return this.surfaces.get(id);
  }

  *values(): IterableIterator<SurfaceModel> {
    yield* this.surfaces.values();
  }

  get size(): number {
    return this.surfaces.size;
  }

  addSurface(surface: SurfaceModel): void {
    if (this.surfaces.has(surface.id)) {
      throw new Error(`Surface already exists: ${surface.id}`);
    }
    this.surfaces.set(surface.id, surface);
    // forward this surface's actions to the group stream
    surface.onAction.subscribe((action) => this.onAction.emit(action));
    this.onSurfaceCreated.emit(surface);
  }

  deleteSurface(id: string): void {
    const surface = this.surfaces.get(id);
    if (!surface) return;
    surface.dataModel.dispose();
    surface.componentsModel.clear();
    this.surfaces.delete(id);
    this.onSurfaceDeleted.emit(id);
  }
}
