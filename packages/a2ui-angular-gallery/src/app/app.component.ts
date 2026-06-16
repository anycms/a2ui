import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
  untracked,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { A2uiSurfaceComponent, basicAngularComponents } from '@anycms/a2ui-angular';
import {
  MessageProcessor,
  basicCatalog,
  basicCatalogId,
  type A2uiClientAction,
  type A2uiMessage,
  type Subscription,
  type SurfaceModel,
} from '@anycms/a2ui-core';
import { SseA2uiTransport } from '@anycms/a2ui-transport-sse';
import { EXAMPLES } from './examples';
import { DomHostComponent } from './dom-host.component';

// The step-through sample (the pedagogical Advance control). Mirrors
// specification/.../04_weather-current.json, trimmed; exercises formatString
// interpolation and a data binding.
const WEATHER: A2uiMessage[] = [
  { version: 'v1.0', createSurface: { surfaceId: 'weather', catalogId: basicCatalogId, sendDataModel: true } },
  {
    version: 'v1.0',
    updateComponents: {
      surfaceId: 'weather',
      components: [
        { id: 'root', component: 'Card', child: 'col' },
        { id: 'col', component: 'Column', children: ['hi', 'lo', 'loc'], align: 'center' },
        { id: 'hi', component: 'Text', text: { call: 'formatString', args: { value: '${/tempHigh}°' } }, variant: 'h1' },
        { id: 'lo', component: 'Text', text: { call: 'formatString', args: { value: '${/tempLow}°' } }, variant: 'h2' },
        { id: 'loc', component: 'Text', text: { path: '/location' }, variant: 'h3' },
      ],
    },
  },
  { version: 'v1.0', updateDataModel: { surfaceId: 'weather', value: { tempHigh: 72, tempLow: 58, location: 'Austin, TX' } } },
];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A2uiSurfaceComponent, DomHostComponent],
  template: `
    <div class="app">
      <header>
        <h1>A2UI Angular Gallery</h1>
        <div class="controls">
          <fieldset>
            <legend>Renderer</legend>
            <button [style.fontWeight]="mode() === 'angular' ? 700 : undefined" (click)="mode.set('angular')">Angular</button>
            {{ ' ' }}
            <button [style.fontWeight]="mode() === 'dom' ? 700 : undefined" (click)="mode.set('dom')">DOM (no Angular)</button>
          </fieldset>
          <fieldset>
            <legend>Offline examples</legend>
            <select [value]="selectedExample() ?? ''" (change)="onSelectExample($event)">
              <option value="">— pick an example —</option>
              @for (ex of EXAMPLES; track ex.name; let i = $index) {
                <option [value]="i">{{ ex.name }}</option>
              }
            </select>
            @if (selectedExample() != null && EXAMPLES[selectedExample()!]) {
              <div class="ex-desc">{{ EXAMPLES[selectedExample()!].description }}</div>
            }
          </fieldset>
          <fieldset>
            <legend>Offline sample (step through)</legend>
            <button [disabled]="step() >= WEATHER.length" (click)="advance()">Advance ({{ step() }}/{{ WEATHER.length }})</button>
            {{ ' ' }}
            <button (click)="reset()">Reset</button>
          </fieldset>
          <fieldset>
            <legend>Online (example 27 backend)</legend>
            <input [value]="sseUrl()" (input)="sseUrl.set($any($event.target).value)" placeholder="backend URL (empty = dev proxy)" />
            <input [value]="prompt()" (input)="prompt.set($any($event.target).value)" placeholder="prompt (optional)" />
            <button (click)="connect()">Connect</button>
            {{ ' ' }}
            <button (click)="disconnect()">Disconnect</button>
            <span class="status"> [{{ status() }}]</span>
          </fieldset>
        </div>
      </header>

      <main class="grid">
        <section>
          <h2>Surface</h2>
          <div class="surface-pane">
            @if (mode() === 'angular') {
              @for (s of surface() ? [surface()!] : []; track s.id) {
                <a2ui-surface [surface]="s" [registry]="basicAngularComponents" />
              } @empty {
                <p class="muted">(no surface — Advance or Connect)</p>
              }
            } @else {
              @if (surface(); as s) {
                <app-dom-host [surface]="s" />
              } @else {
                <p class="muted">(no surface — Advance or Connect)</p>
              }
            }
          </div>
        </section>
        <section>
          <h2>Data Model</h2>
          <pre class="json">{{ dataModelJson() }}</pre>
        </section>
        <section>
          <h2>Action Log</h2>
          @if (actions().length === 0) {
            <p class="muted">(no actions)</p>
          } @else {
            <ul class="actions">
              @for (a of actions(); track $index) {
                <li><b>{{ a.name }}</b> <code>{{ JSON.stringify(a.context) }}</code></li>
              }
            </ul>
          }
        </section>
      </main>
    </div>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  // Re-exported for template use (component fields are the only way to reach
  // plain values/constants in an Angular standalone template).
  readonly EXAMPLES = EXAMPLES;
  readonly WEATHER = WEATHER;
  readonly basicAngularComponents = basicAngularComponents;
  readonly JSON = JSON;

  private readonly processor = new MessageProcessor({ catalogs: [basicCatalog] });
  // structural (surface create/delete) vs data-model ticks are split so the
  // dataModel subscription effect keys on surface identity, not every write.
  private readonly structTick = signal(0);
  private readonly dataTick = signal(0);

  readonly step = signal(0);
  readonly mode = signal<'angular' | 'dom'>('angular');
  readonly selectedExample = signal<number | null>(null);
  readonly actions = signal<A2uiClientAction[]>([]);
  readonly sseUrl = signal('');
  readonly prompt = signal('');
  readonly status = signal('idle');

  private transport?: SseA2uiTransport;
  private subs: Subscription[] = [];

  private readonly surfaces = computed<SurfaceModel[]>(() => {
    this.structTick();
    return [...this.processor.model.values()];
  });
  readonly surface = computed<SurfaceModel | undefined>(() => {
    const s = this.surfaces();
    return s[s.length - 1];
  });
  readonly dataModelJson = computed<string>(() => {
    this.dataTick();
    const s = this.surface();
    return s ? JSON.stringify(s.dataModel.snapshot(), null, 2) : '(empty)';
  });

  constructor() {
    // Re-subscribe to the live surface's data model whenever the surface
    // changes (driven by structTick only), disposing the previous subscription.
    //
    // Core's `dataModel.subscribe('/')` REPLAYS the current value synchronously,
    // so the callback runs inside this effect. The bump must NOT read `dataTick`
    // (else Angular captures it as an effect dependency → set → re-run → infinite
    // loop). Use a plain counter + `untracked` so nothing the callback touches is
    // tracked by the effect.
    effect((onCleanup) => {
      const s = this.surface();
      if (!s) return;
      const sub = s.dataModel.subscribe('/', () => untracked(() => this.bumpData()));
      onCleanup(() => sub.unsubscribe());
    });
  }

  private dataSeq = 0;
  private bumpData(): void {
    this.dataTick.set(++this.dataSeq);
  }

  ngOnInit(): void {
    this.subs.push(
      this.processor.model.onSurfaceCreated.subscribe(() => this.structTick.set(this.structTick() + 1)),
      this.processor.model.onSurfaceDeleted.subscribe(() => this.structTick.set(this.structTick() + 1)),
      this.processor.model.onAction.subscribe((a) => this.actions.update((list) => [...list, a])),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.transport?.stop();
  }

  reset(): void {
    this.transport?.stop();
    this.transport = undefined;
    for (const s of [...this.processor.model.values()]) this.processor.model.deleteSurface(s.id);
    this.step.set(0);
    this.actions.set([]);
    this.status.set('idle');
  }

  advance(): void {
    if (this.step() >= WEATHER.length) return;
    this.processor.processMessages([WEATHER[this.step()]]);
    this.step.set(this.step() + 1);
  }

  onSelectExample(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.loadExample(v === '' ? -1 : Number(v));
  }

  private loadExample(i: number): void {
    this.reset();
    const ex = EXAMPLES[i];
    if (ex) {
      this.processor.processMessages(ex.messages);
      this.selectedExample.set(i);
    } else {
      this.selectedExample.set(null);
    }
  }

  connect(): void {
    this.reset();
    this.status.set('connecting…');
    const t = new SseA2uiTransport({
      baseUrl: this.sseUrl(),
      prompt: this.prompt(),
      processor: this.processor,
      onMeta: () => this.status.set('connected'),
      onError: () => this.status.set('error (see console)'),
    });
    t.start();
    this.transport = t;
  }

  disconnect(): void {
    this.transport?.stop();
    this.transport = undefined;
    this.status.set('idle');
  }
}
