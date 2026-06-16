<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { A2uiSurface, basicVueComponents } from '@anycms/a2ui-vue';
import { mountDomSurface, type DomSurfaceHandle } from '@anycms/a2ui-dom';
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

// --- Curated offline business examples ---
// Loaded directly from the official basic-catalog examples (each file is
// { name, description, messages: A2uiMessage[] }). Message envelopes are
// schema-identical to what MessageProcessor accepts, so they process verbatim.
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

// --- app state ---
const processor = new MessageProcessor({ catalogs: [basicCatalog] });
// Bumped on any surface create/delete (or data-model change) so derived
// computeds re-evaluate. Mirrors the React gallery's force-rerender.
const tick = ref(0);
const rerender = (): void => {
  tick.value++;
};

const step = ref(0);
const mode = ref<'vue' | 'dom'>('vue');
const selectedExample = ref<number | null>(null);
const actions = ref<A2uiClientAction[]>([]);
// Host element for the framework-agnostic DOM renderer (mounts outside Vue).
const domHostRef = ref<HTMLDivElement | null>(null);
// empty => relative "/agent-ui", served same-origin via the Vite dev proxy
// (see vite.config.ts) to avoid CORS against the example 27 backend.
const sseUrl = ref('');
const prompt = ref('');
const status = ref('idle');
const transportRef = shallowRef<SseA2uiTransport | null>(null);

const surfaces = computed<SurfaceModel[]>(() => {
  void tick.value;
  return [...processor.model.values()];
});
const surface = computed<SurfaceModel | undefined>(() => surfaces.value[surfaces.value.length - 1]);

// Keep the data-model pane live: re-snapshot whenever any root data write fires.
const dataModel = computed<Record<string, unknown> | null>(() => {
  void tick.value;
  return surface.value ? (surface.value.dataModel.snapshot() as Record<string, unknown>) : null;
});

const subs: Subscription[] = [];
onMounted(() => {
  subs.push(processor.model.onSurfaceCreated.subscribe(rerender));
  subs.push(processor.model.onSurfaceDeleted.subscribe(rerender));
  subs.push(processor.model.onAction.subscribe((a) => actions.value.push(a)));
});
onUnmounted(() => {
  subs.forEach((s) => s.unsubscribe());
  transportRef.value?.stop();
});

// Re-subscribe to the live surface's data model for the pane.
watch(
  surface,
  (s, _old, onCleanup) => {
    if (!s) return;
    const sub = s.dataModel.subscribe('/', rerender);
    onCleanup(() => sub.unsubscribe());
  },
  { immediate: true },
);

// Mount the framework-agnostic DOM renderer into the host div when selected.
// flush:'post' runs after Vue has patched the v-if'd div into the DOM, so the
// ref is populated. The same SurfaceModel drives it as the Vue renderer.
watch(
  [mode, surface],
  (_v, _o, onCleanup) => {
    if (mode.value !== 'dom' || !surface.value || !domHostRef.value) return;
    const handle: DomSurfaceHandle = mountDomSurface(surface.value, domHostRef.value);
    onCleanup(() => handle.dispose());
  },
  { flush: 'post' },
);

function reset(): void {
  transportRef.value?.stop();
  transportRef.value = null;
  for (const s of [...processor.model.values()]) processor.model.deleteSurface(s.id);
  step.value = 0;
  actions.value = [];
  status.value = 'idle';
}

function advance(): void {
  if (step.value >= WEATHER.length) return;
  processor.processMessages([WEATHER[step.value]]);
  step.value++;
}

// Load a full curated example in one shot: wipe any prior surfaces, then
// process the whole message array. Each example ships its own surfaceId.
function loadExample(i: number): void {
  reset();
  const ex = EXAMPLES[i];
  if (ex) {
    processor.processMessages(ex.messages);
    selectedExample.value = i;
  } else {
    selectedExample.value = null;
  }
}

function onSelectExample(e: Event): void {
  const v = (e.target as HTMLSelectElement).value;
  loadExample(v === '' ? -1 : Number(v));
}

function connect(): void {
  reset();
  status.value = 'connecting…';
  const t = new SseA2uiTransport({
    baseUrl: sseUrl.value,
    prompt: prompt.value,
    processor,
    onMeta: () => (status.value = 'connected'),
    onError: () => (status.value = 'error (see console)'),
  });
  t.start();
  transportRef.value = t;
}

function disconnect(): void {
  transportRef.value?.stop();
  transportRef.value = null;
  status.value = 'idle';
}
</script>

<template>
  <div class="app">
    <header>
      <h1>A2UI Vue Gallery</h1>
      <div class="controls">
        <fieldset>
          <legend>Renderer</legend>
          <button :style="mode === 'vue' ? { fontWeight: 700 } : undefined" @click="mode = 'vue'">Vue</button>
          {{ ' ' }}
          <button :style="mode === 'dom' ? { fontWeight: 700 } : undefined" @click="mode = 'dom'">DOM (no Vue)</button>
        </fieldset>
        <fieldset>
          <legend>Offline examples</legend>
          <select :value="selectedExample ?? ''" @change="onSelectExample">
            <option value="">— pick an example —</option>
            <option v-for="(ex, i) in EXAMPLES" :key="i" :value="i">{{ ex.name }}</option>
          </select>
          <div v-if="selectedExample != null && EXAMPLES[selectedExample]" class="ex-desc">
            {{ EXAMPLES[selectedExample].description }}
          </div>
        </fieldset>
        <fieldset>
          <legend>Offline sample (step through)</legend>
          <button :disabled="step >= WEATHER.length" @click="advance">Advance ({{ step }}/{{ WEATHER.length }})</button>
          {{ ' ' }}
          <button @click="reset">Reset</button>
        </fieldset>
        <fieldset>
          <legend>Online (example 27 backend)</legend>
          <input v-model="sseUrl" placeholder="backend URL (empty = dev proxy)" />
          <input v-model="prompt" placeholder="prompt (optional)" />
          <button @click="connect">Connect</button>
          {{ ' ' }}
          <button @click="disconnect">Disconnect</button>
          <span class="status"> [{{ status }}]</span>
        </fieldset>
      </div>
    </header>

    <main class="grid">
      <section>
        <h2>Surface</h2>
        <div class="surface-pane">
          <A2uiSurface
            v-if="surface && mode === 'vue'"
            :surface="surface"
            :registry="basicVueComponents"
          />
          <div v-else-if="surface && mode === 'dom'" ref="domHostRef"></div>
          <p v-else class="muted">(no surface — Advance or Connect)</p>
        </div>
      </section>
      <section>
        <h2>Data Model</h2>
        <pre class="json">{{ dataModel == null ? '(empty)' : JSON.stringify(dataModel, null, 2) }}</pre>
      </section>
      <section>
        <h2>Action Log</h2>
        <p v-if="actions.length === 0" class="muted">(no actions)</p>
        <ul v-else class="actions">
          <li v-for="(a, i) in actions" :key="i">
            <b>{{ a.name }}</b> <code>{{ JSON.stringify(a.context) }}</code>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>
