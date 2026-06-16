# Theming & multi-tenant skins

How to re-skin an A2UI surface — brand colors, fonts, radii, even a component's
look-and-feel — without touching binders or the spec. Three paths, lightest to
deepest.

## Read this first: the token mechanism

**The shadcn preset does not hardcode colors.** Its Views emit only
token-neutral Tailwind utilities — `bg-primary`, `text-muted-foreground`,
`border-border`, `bg-card` — never hex values, never `hsl(var(--*))`. See for
yourself:

- [`button.tsx`](./../../../packages/a2ui-react-shadcn/src/ui/button.tsx) — `bg-primary text-primary-foreground`
- [`card.tsx`](./../../../packages/a2ui-react-shadcn/src/ui/card.tsx) — `bg-card text-card-foreground`
- [`variants.ts`](./../../../packages/a2ui-react-shadcn/src/variants.ts) — `text-muted-foreground`

What those utilities *resolve to* is decided entirely by **the host's CSS**, not
by the preset. The preset ships **no Tailwind config** (`tailwindcss` isn't even
a dependency — only `tailwind-merge` is). So:

> **Re-skinning = the host provides the tokens; the preset follows
> automatically.** You almost never need to change preset source.

This corrects a common misconception: there is no "`--primary` vs
`--color-primary` conflict baked into the preset." Both naming conventions are
host-side choices. The preset is neutral — which is why the **`ui/*` primitives
need no changes** when you migrate a host from Tailwind v3 to v4.

### Tailwind v3 vs v4 (where the token names actually differ)

| | Tailwind v3 | Tailwind v4 |
| --- | --- | --- |
| Token names | `--primary`, `--background`, … (shadcn classic) | `--color-primary`, `--color-background`, … (native namespace) |
| Value format | HSL channels, wrapped `hsl(var(--primary))` in config | any (hex/oklch/hsl) via `@theme` |
| Where defined | `tailwind.config.js` `theme.extend.colors` + `:root` | `@theme { … }` in CSS |

The gallery is a Tailwind **v4** host. See
[`packages/a2ui-gallery/src/index.css`](./../../../packages/a2ui-gallery/src/index.css)
for the canonical v4 bridge: it keeps the shadcn HSL values under `:root`, then
maps them into v4's namespace with `@theme inline { --color-primary:
hsl(var(--primary)); … }`.

## Path 1 — Override CSS tokens (lightest; no code)

Because the preset emits neutral utilities, changing brand colors is just
defining the tokens in your own CSS:

```css
/* your app, Tailwind v4 */
@theme {
  --color-primary: oklch(0.55 0.2 250);      /* brand blue */
  --color-primary-foreground: #fff;
  /* …other tokens… */
}
```

Scope tokens to a wrapper to theme one surface among many (multi-tenant):

```tsx
<div className="tenant-acme">
  <A2uiSurface surface={s} registry={shadcnReactComponents} />
</div>
```
```css
.tenant-acme { --color-primary: #ff5722; /* … */ }
```

> Don't import the preset's `styles.css` if you go this route — you're providing
> the tokens yourself.

## Path 2 — `<A2uiSurface>` className/style passthrough

`<A2uiSurface>` forwards `className` and `style` to its root `.a2ui-surface`
node, so it can be the token container itself — no extra wrapper div. This is
the recommended shape for per-tenant theming driven by backend data:

```tsx
<A2uiSurface
  surface={s}
  registry={shadcnReactComponents}
  className={`tenant-${tenant.id}`}
  style={{ '--color-primary': tenant.brandColor } as React.CSSProperties}
/>
```

## Path 3 — `mergeRegistries` (component-level brand overrides)

When a brand needs a *different component* (not just colors) — a custom Card, a
branded Button — replace individual Views while keeping the rest of a preset.
`@anycms/a2ui-react` exports a helper for exactly this:

```ts
import { mergeRegistries } from '@anycms/a2ui-react';
import { shadcnReactComponents } from '@anycms/a2ui-react-shadcn';

const acmeCard = /* a ComponentType<{ ctx }> built from cardBinder */;

const branded = mergeRegistries(shadcnReactComponents, new Map([
  ['Card', acmeCard],
]));
// <A2uiSurface surface={s} registry={branded} />
```

**Signature:**
```ts
function mergeRegistries(
  base: ReactComponentRegistry,
  ...overrides: ReactComponentRegistry[]
): ReactComponentRegistry
```

Later overrides win by component `type`; inputs are not mutated. This replaces
the `new Map(base) + .set()` boilerplate every consumer used to hand-roll.

## The optional default theme (`styles.css`)

`@anycms/a2ui-react-shadcn/styles.css` ships an **opt-in** zinc default theme
written for Tailwind v4. Use it only if you want the canned shadcn look with
zero config:

```ts
// app entry — AFTER your Tailwind import
import '@anycms/a2ui-react-shadcn/styles.css';
```
```tsx
{/* light */}
<div className="a2ui-shadcn-default-theme">
  <A2uiSurface surface={s} registry={shadcnReactComponents} />
</div>

{/* dark — add .a2ui-dark alongside */}
<div className="a2ui-shadcn-default-theme a2ui-dark">
  <A2uiSurface surface={s} registry={shadcnReactComponents} />
</div>
```

The token values live under `.a2ui-shadcn-default-theme` (not bare `:root`), so:

- **Add the class** → get the zinc default.
- **Omit the class** (or don't import the file) → no default colors leak in;
  drive everything from your own tokens (Paths 1–3).

`@theme inline` inside the file maps `--primary` → `--color-primary` etc., so
importing it makes the preset's utilities resolve under v4 with no extra config.

## `themeSchema` is not a theming feature

`Catalog.themeSchema` is currently an `unknown` placeholder with no render-time
consumer. Do **not** reach for it for CSS-token theming. It's reserved for a
future "data-driven theme JSON from the server" feature — a separate design.

## Across frameworks (React / Vue / Angular)

The theming surface is consistent across adapters, but `class`/`style` reaches
the root node by different mechanisms:

| Adapter | `class` / `style` on the surface | Mechanism |
| --- | --- | --- |
| React | explicit `className` / `style` props | forwarded to the root `.a2ui-surface` `div` (React has no attr fallthrough) |
| Vue | automatic | single-root component + default `inheritAttrs` → falls through to the `div` |
| Angular | automatic | `class` / `style` land on the `<a2ui-surface>` host element; CSS vars inherit into the tree |

So in Vue/Angular you theme the same way — wrap or tag the surface — without any
extra API; React alone needs the explicit props because a function component
isn't itself a DOM node.

`mergeRegistries` is generic in `@anycms/a2ui-core` and re-exported by **all
three** adapters (`@anycms/a2ui-react`, `@anycms/a2ui-vue`, `@anycms/a2ui-angular`),
each inferring its own registry value type — so **Path 3** works identically in
any framework.

## See also

- [`presets.md`](./presets.md) — build a whole new look-and-feel (MUI, brand kit).
- [`architecture.md`](./architecture.md) — binders, the props stream, reactivity.
- Gallery v4 token bridge: [`packages/a2ui-gallery/src/index.css`](./../../../packages/a2ui-gallery/src/index.css).
