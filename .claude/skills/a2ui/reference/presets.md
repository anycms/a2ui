# Adding a renderer preset (a new look-and-feel)

A **preset** is a full set of View components plus a
`ReactComponentRegistry`, built on top of the **same** core binders and the
**same** React adapter. Only the presentation layer differs. The shadcn package
is the reference template — copy it.

Swapping a look is one prop:

```tsx
<A2uiSurface surface={s} registry={muiReactComponents} />
```

## When to make a preset vs. extend the Basic Catalog

- **New visual style** for the *existing* 18 components (MUI, Chakra, a brand
  kit, a dark theme) → **preset**. No core changes; you never touch a binder.
- **New component** or **new behavior** → that's a catalog/component change, not
  a preset. See [components.md](./components.md). (A preset must implement every
  component type the server can emit for its catalog.)

## Step-by-step: create `@anycms/a2ui-react-mui`

### 1. Copy the shadcn package skeleton

```bash
cp -r packages/a2ui-react-shadcn packages/a2ui-react-mui
```

Then rename throughout:
- `package.json`: `name` → `@anycms/a2ui-react-mui`, fix `description`,
  `repository.directory`, and swap dependencies (remove Radix/Tailwind; add
  `@mui/material` etc.).
- Globally rename the exported registry (`shadcnReactComponents` →
  `muiReactComponents`).

### 2. What to keep verbatim

- **The registry structure** (`registry.ts`) — same 18 `createReactComponent(binder, View)`
  entries, same binders imported from `@anycms/a2ui-core`, same
  `createReactComponent` from `@anycms/a2ui-react`. The binders/adapter are
  reused, not re-implemented.
- **`bind.ts`** — `boundPath` and `dispatchButtonAction` are framework-agnostic
  helpers; keep them (or share them once a common package exists).
- **`index.ts`** export shape — registry + `cn`-equivalent + your UI primitives.

### 3. What to rewrite

- **`src/components/*.tsx`** — all 18 Views. Each is `({ props, ctx, buildChild }: ComponentViewProps<P>)`
  rendering your library's primitives. Preserve the **props contract** exactly
  (e.g. `ButtonView` must read `props.variant ∈ {'primary','borderless','default'}`,
  `props.disabled`, `props.child`, `props.action`) — the binder defines it; the
  View only translates it to classes/styles. See
  [`components/button.tsx`](./../../../packages/a2ui-react-shadcn/src/components/button.tsx)
  for the canonical shape.
- **`variants.ts`** — A2UI prop → your-library class/variant maps (e.g.
  `BUTTON_VARIANT: { primary: 'contained', default: 'outlined', borderless: 'text' }`).
- **`ui/`** — replace with your library's primitives (or delete if you import
  directly from `@mui/material`).
- **`styles.css`** — your theme's CSS (Tailwind build, MUI baseline, etc.).

### 4. The contract a preset must honor

For each Basic Catalog component type `T`:
1. There is **exactly one** `Map` entry `[T, createReactComponent(TBinder, TView)]`.
2. `TView` consumes the binder's `ResolvedProps` and renders that component's
   visual.
3. Containers (`Row`, `Column`, `List`, `Card`, `Tabs`, `Modal`) render children
   via `buildChild(ref)` — **never** import the child component directly.
4. Interactive inputs (`TextField`, `CheckBox`, `Slider`, `ChoicePicker`,
   `DateTimeInput`) implement **two-way binding** via `boundPath(ctx)` +
   `ctx.set(path, value)` on change — see [components.md §C](./components.md).
5. `Button` (and any action-bearing component) dispatches via
   `dispatchButtonAction` / `ctx.dispatchAction`.
6. Check/validation messages are surfaced for components that carry `checks`.

If you skip a component type, the server emitting it renders
`<div className="a2ui-unknown">Unknown component: X</div>` (from
[`adapter.tsx` `A2uiNode`](./../../../packages/a2ui-react/src/adapter.tsx)).

### 5. Wire into the workspace

- Add the package dir; it's already covered by `pnpm-workspace.yaml` (`packages/*`).
- If you want the gallery to offer the toggle, add the registry import + a
  toggle option in [`packages/a2ui-gallery/src/main.tsx`](./../../../packages/a2ui-gallery/src/main.tsx)
  (it already flips Vanilla ↔ shadcn — mirror that).
- `pnpm install` (links the workspace dep), then `pnpm typecheck && pnpm test`.

## Styling philosophy note

The vanilla preset uses **inline styles** + the leaf-margin strategy (leaves
carry 8px; containers flush). shadcn uses **Tailwind classes** + Radix. Your
preset may use either — just be consistent within the package and keep the
`a2ui-leaf` / `a2ui-row` / `a2ui-column` / `a2ui-surface` class hooks where
reasonable, so gallery CSS and tests that key off them still apply.
