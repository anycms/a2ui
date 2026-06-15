import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { A2uiSurface, basicReactComponents } from '@anycms/a2ui-react';
import { shadcnReactComponents } from '@anycms/a2ui-react-shadcn';
import { mountDomSurface, type DomSurfaceHandle } from '@anycms/a2ui-dom';
import {
  MessageProcessor,
  basicCatalog,
  basicCatalogId,
  type A2uiClientAction,
  type A2uiMessage,
} from '@anycms/a2ui-core';
import { SseA2uiTransport } from '@anycms/a2ui-transport-sse';
import './styles.css';
import './index.css';

// --- Curated offline business examples ---
// Loaded directly from the official basic-catalog examples (each file is
// { name, description, messages: A2uiMessage[] }). Message envelopes are
// schema-identical to what MessageProcessor accepts, so they process verbatim.
// The 8 below are picked to span business domains and cover every basic-catalog
// component (form validation, templated lists, currency formatting, Slider,
// Tabs, AudioPlayer, Modal, dynamic lists).
interface Example {
  name: string;
  description: string;
  messages: A2uiMessage[];
}
const exampleModules = import.meta.glob<Example>(
  '../../../a2ui/specification/v1_0/catalogs/basic/examples/{04_weather-current,06_music-player,09_login-form,13_coffee-order,24_recipe-card,26_podcast-episode,34_child-list-template,36_modal}.json',
  { eager: true, query: '?json', import: 'default' },
);
const EXAMPLES: Example[] = Object.values(exampleModules);

// The step-through sample (kept for the pedagogical Advance control). Mirrors
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

function App() {
  const processorRef = useRef<MessageProcessor | null>(null);
  if (processorRef.current === null) processorRef.current = new MessageProcessor({ catalogs: [basicCatalog] });
  const processor = processorRef.current;

  const [, setTick] = useState(0);
  const rerender = () => setTick((t) => t + 1);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'vanilla' | 'shadcn' | 'dom'>('vanilla');
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  // Host element for the framework-agnostic DOM renderer (mounts outside React).
  const domHostRef = useRef<HTMLDivElement | null>(null);
  const [actions, setActions] = useState<A2uiClientAction[]>([]);
  // empty => relative "/agent-ui", served same-origin via the Vite dev proxy
  // (see vite.config.ts) to avoid CORS against the example 27 backend.
  const [sseUrl, setSseUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle');
  const transportRef = useRef<SseA2uiTransport | null>(null);

  useEffect(() => {
    const subs = [
      processor.model.onSurfaceCreated.subscribe(rerender),
      processor.model.onSurfaceDeleted.subscribe(rerender),
      processor.model.onAction.subscribe((a) => setActions((prev) => [...prev, a])),
    ];
    return () => subs.forEach((s) => s.unsubscribe());
  }, [processor]);

  const surfaces = [...processor.model.values()];
  const surface = surfaces[surfaces.length - 1];

  // keep the data-model pane live (root subscription re-fires on any set)
  useEffect(() => {
    if (!surface) return;
    const sub = surface.dataModel.subscribe('/', rerender);
    return () => sub.unsubscribe();
  }, [surface]);

  // Mount the framework-agnostic DOM renderer into a host element when selected.
  // The same SurfaceModel drives it as the React renderers; it reacts to messages
  // via its own subscriptions, so we only (re)mount on surface or mode change.
  useEffect(() => {
    if (mode !== 'dom' || !surface || !domHostRef.current) return;
    const handle: DomSurfaceHandle = mountDomSurface(surface, domHostRef.current);
    return () => handle.dispose();
  }, [mode, surface]);

  const reset = () => {
    transportRef.current?.stop();
    transportRef.current = null;
    for (const s of [...processor.model.values()]) processor.model.deleteSurface(s.id);
    setStep(0);
    setActions([]);
    setStatus('idle');
  };

  const advance = () => {
    if (step >= WEATHER.length) return;
    processor.processMessages([WEATHER[step]]);
    setStep(step + 1);
  };

  // Load a full curated example in one shot: wipe any prior surfaces, then
  // process the whole message array. Each example ships its own surfaceId.
  const loadExample = (i: number) => {
    reset();
    const ex = EXAMPLES[i];
    if (ex) {
      processor.processMessages(ex.messages);
      setSelectedExample(i);
    } else {
      setSelectedExample(null);
    }
  };

  const connect = () => {
    reset();
    setStatus('connecting…');
    const t = new SseA2uiTransport({
      baseUrl: sseUrl,
      prompt,
      processor,
      onMeta: () => setStatus('connected'),
      onError: () => setStatus('error (see console)'),
    });
    t.start();
    transportRef.current = t;
  };

  const dataModel = surface ? surface.dataModel.snapshot() : null;

  return (
    <div className="app">
      <header>
        <h1>A2UI Gallery</h1>
        <div className="controls">
          <fieldset>
            <legend>Renderer</legend>
            <button
              onClick={() => setMode('vanilla')}
              style={mode === 'vanilla' ? { fontWeight: 700 } : undefined}
            >Vanilla</button>{' '}
            <button
              onClick={() => setMode('shadcn')}
              style={mode === 'shadcn' ? { fontWeight: 700 } : undefined}
            >shadcn/ui</button>{' '}
            <button
              onClick={() => setMode('dom')}
              style={mode === 'dom' ? { fontWeight: 700 } : undefined}
            >DOM (no React)</button>
          </fieldset>
          <fieldset>
            <legend>Offline examples</legend>
            <select
              value={selectedExample ?? ''}
              onChange={(e) => loadExample(e.target.value === '' ? -1 : Number(e.target.value))}
            >
              <option value="">— pick an example —</option>
              {EXAMPLES.map((ex, i) => (
                <option key={i} value={i}>{ex.name}</option>
              ))}
            </select>
            {selectedExample != null && EXAMPLES[selectedExample] && (
              <div className="ex-desc">{EXAMPLES[selectedExample].description}</div>
            )}
          </fieldset>
          <fieldset>
            <legend>Offline sample (step through)</legend>
            <button onClick={advance} disabled={step >= WEATHER.length}>Advance ({step}/{WEATHER.length})</button>{' '}
            <button onClick={reset}>Reset</button>
          </fieldset>
          <fieldset>
            <legend>Online (example 27 backend)</legend>
            <input value={sseUrl} onChange={(e) => setSseUrl(e.target.value)} placeholder="backend URL (empty = dev proxy)" />
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="prompt (optional)" />
            <button onClick={connect}>Connect</button>{' '}
            <button onClick={() => { transportRef.current?.stop(); transportRef.current = null; setStatus('idle'); }}>Disconnect</button>
            <span className="status"> [{status}]</span>
          </fieldset>
        </div>
      </header>

      <main className="grid">
        <section>
          <h2>Surface</h2>
          <div className={mode === 'shadcn' ? 'surface-pane a2ui-dark' : 'surface-pane'}>
            {surface ? (
              mode === 'dom' ? (
                // The DOM renderer mounts itself into this host via the effect above.
                <div ref={domHostRef} />
              ) : (
                <A2uiSurface
                  surface={surface}
                  registry={mode === 'shadcn' ? shadcnReactComponents : basicReactComponents}
                />
              )
            ) : (
              <p className="muted">(no surface — Advance or Connect)</p>
            )}
          </div>
        </section>
        <section>
          <h2>Data Model</h2>
          <pre className="json">{dataModel == null ? '(empty)' : JSON.stringify(dataModel, null, 2)}</pre>
        </section>
        <section>
          <h2>Action Log</h2>
          {actions.length === 0 ? (
            <p className="muted">(no actions)</p>
          ) : (
            <ul className="actions">
              {actions.map((a, i) => (
                <li key={i}>
                  <b>{a.name}</b> <code>{JSON.stringify(a.context)}</code>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
