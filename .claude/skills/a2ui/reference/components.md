# Adding or modifying a Basic Catalog component

The most common task. The binder (in core) is the contract; both view packages
(vanilla + shadcn) implement it. **Always check the catalog JSON first:**
[`a2ui/specification/v1_0/catalogs/basic/catalog.json`](./../../../a2ui/specification/v1_0/catalogs/basic/catalog.json)
defines the authoritative props, enums, and child shapes.

## A. Add a new component (e.g. `Spinner`)

### 1. Write the binder in core

Edit [`packages/a2ui-core/src/catalogs/basic/index.ts`](./../../../packages/a2ui-core/src/catalogs/basic/index.ts).
Follow the existing pattern exactly — `defineBinder` + a `*Props` interface +
the local `asVariant`/`asBool` helpers for defaulted enums.

```ts
export interface SpinnerProps {
  size: string;          // resolved enum
  label?: string;        // dynamic value, optional
}
export const spinnerBinder: ComponentBinder<SpinnerProps> = defineBinder({
  name: 'Spinner',
  schema: null,          // Zod schema is optional; envelope is passthrough anyway
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return {
      size: asVariant(p.size, ['small', 'medium', 'large'], 'medium'),
      label: p.label != null ? ctx.resolveDynamicValue<string>(p.label) : undefined,
    };
  },
});
```

Rules for `resolve`:
- Read **every data-driven** field through `ctx.resolveDynamicValue<T>(p.x)`.
  Literal/static config (`p.size` when it's an enum string) can be read raw.
- Default enums with `asVariant(value, allowed, default)` and booleans with
  `asBool(value, default)`.
- Resolve children with `resolveChild` / `resolveChildList` / `resolveChecks`
  from `../../binder` — never reconstruct child shapes by hand.
- Return a **plain object** (new reference each run — that's what React diffs).

Then register it in the catalog's binder list (same file, near the bottom):

```ts
export const basicComponentBinders: ComponentBinder<unknown>[] = [
  // ...existing...
  sliderBinder,
  spinnerBinder,   // ← add
];
```

If the component must exist in the spec's `catalog.json`, add its definition
there too (coordinate with the spec owner; the catalog is vendored).

### 2. Add the vanilla View

Edit [`packages/a2ui-react/src/components.tsx`](./../../../packages/a2ui-react/src/components.tsx).
Add the `import type { SpinnerProps }`, then a functional component:

```tsx
const SPINNER_SIZE: Record<string, number> = { small: 16, medium: 24, large: 40 };
export function SpinnerView({ props }: ComponentViewProps<SpinnerProps>): ReactNode {
  return (
    <span
      className="a2ui-leaf a2ui-spinner"
      style={{ ...LEAF, width: SPINNER_SIZE[props.size], height: SPINNER_SIZE[props.size] }}
      aria-label={props.label}
    />
  );
}
```

View rules:
- Signature is always `({ props, ctx, buildChild }: ComponentViewProps<P>)`.
  Destructure only what you use.
- Leaf components (no children) get `className="a2ui-leaf"` and the shared
  `LEAF` margin (the "leaf-margin strategy" — leaves carry the 8px margin so
  containers stay flush). Read the header comment in `components.tsx`.
- Return `ReactNode`; render children via `buildChild(ref)` (see §C).

### 3. Register in the vanilla registry

Edit [`packages/a2ui-react/src/registry.ts`](./../../../packages/a2ui-react/src/registry.ts):
add the binder import, the View import, and a `Map` entry:

```ts
['Spinner', createReactComponent(spinnerBinder, SpinnerView)],
```

### 4. Add the shadcn View + register

- Create [`packages/a2ui-react-shadcn/src/components/spinner.tsx`](./../../../packages/a2ui-react-shadcn/src/components)
  exporting `SpinnerView({ props }: ComponentViewProps<SpinnerProps>)`. Use the
  package's `ui/` primitives + Tailwind classes + a `variants.ts` prop→class map
  (mirror e.g. [`components/button.tsx`](./../../../packages/a2ui-react-shadcn/src/components/button.tsx)).
- Register in [`packages/a2ui-react-shadcn/src/registry.ts`](./../../../packages/a2ui-react-shadcn/src/registry.ts):
  `['Spinner', createReactComponent(spinnerBinder, SpinnerView)]`. Import the
  binder from `@anycms/a2ui-core` and `createReactComponent` from
  `@anycms/a2ui-react` — exactly as the other entries do.

### 5. Test

Add a binder unit test in
[`packages/a2ui-core/src/catalogs/basic/index.test.ts`](./../../../packages/a2ui-core/src/catalogs/basic/index.test.ts)
(assert `basicCatalog.getComponent('Spinner')` resolves props and defaults
correctly). Add a rendering test to both packages' `integration.test.tsx` if the
component is interactive or has children. Run `pnpm typecheck && pnpm test`.

## B. Modify an existing component

- **Change how a prop resolves / add a derived prop** → edit the binder's
  `resolve` + the `*Props` interface in core. Then update both Views if the new
  prop is rendered. The binder change alone updates the contract for both
  presets — no registry edits needed.
- **Visual-only change** → edit only the View(s). No core change.
- **New static enum value** (e.g. add `'ghost'` to Button `variant`) → add it to
  the binder's `asVariant` allowed list **and** to both Views' variant maps
  (`BUTTON_VARIANT` in shadcn `variants.ts`; the inline map in vanilla
  `components.tsx`).

## C. Containers, children, and two-way binding — by example

**Container with children** (Row/Column/List/Card/Tabs/Modal all follow this):

```tsx
export function ColumnView({ props, buildChild }: ComponentViewProps<ContainerProps>): ReactNode {
  return (
    <div className="a2ui-column" style={{ display: 'flex', flexDirection: 'column', alignItems: ALIGN[props.align ?? 'start'] }}>
      {props.children.map((ref) => <Fragment key={ref.id + ref.basePath}>{buildChild(ref)}</Fragment>)}
    </div>
  );
}
```

`props.children` is `ChildNodeRef[]` from `resolveChildList`. The `key` must
disambiguate template iterations — use `ref.id + ref.basePath`.

**Two-way binding** (TextField/CheckBox/Slider/ChoicePicker/DateTimeInput). The
input's `value` is usually a `{path}` binding; on change, write back through the
same scope:

```tsx
// helper, already in components.tsx (vanilla) and shadcn bind.ts
function boundPath(ctx: ComponentContext, key = 'value'): string | null {
  const v = ctx.componentModel.properties[key];
  return v && typeof v === 'object' && 'path' in v && typeof (v as any).path === 'string'
    ? (v as any).path : null;
}

export function TextFieldView({ props, ctx }: ComponentViewProps<TextFieldProps>): ReactNode {
  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const p = boundPath(ctx);
    if (p) ctx.set(p, e.currentTarget.value);   // write back through the scope
  };
  return <input value={props.value} onChange={onChange} />;
}
```

`ctx.set(relativePath, value)` resolves the pointer against the current
`basePath`, so template-scoped inputs write to the right item.

**Actions** (Button, and anything with an `action` prop). An action is either a
client `event` (name + context, round-tripped to the server) or a `functionCall`
(run locally). The vanilla renderer inlines this; shadcn factors it into
[`bind.ts`](./../../../packages/a2ui-react-shadcn/src/bind.ts) as
`dispatchButtonAction`. Reuse that helper in presets:

```tsx
import { dispatchButtonAction, type ButtonAction } from '../bind';
<Button disabled={props.disabled}
  onClick={() => dispatchButtonAction(ctx, props.action as ButtonAction)}>
  {props.child ? buildChild(props.child) : null}
</Button>
```

Under the hood: `event` → `ctx.dispatchAction({ name, context })` →
`surface.onAction` → (transport) → server. `functionCall` →
`ctx.resolveDynamicValue(callObj)` (runs it; the result, if bound elsewhere,
propagates reactively).

**Checks / validation state** (Button, TextField, CheckBox, …). A `checks`
array of `{ condition, message }` is evaluated by `resolveChecks` in the binder;
`Button` derives `disabled` from "any check invalid". Surface failing messages
in the View (e.g. under a TextField). The condition is a `DynamicBoolean` —
commonly a function call like `{ call: 'required', args: { value: { path: '/x' } } }`.

## D. Verifying your change

```bash
pnpm typecheck     # must be clean (verbatimModuleSyntax: watch import type)
pnpm test          # vitest across packages
pnpm dev           # eyeball it in the gallery; add your component to an example if useful
```

If `typecheck` fails on a type-only import, you forgot `import type`. If a View
goes stale after a data change, you read raw `properties` instead of
`resolveDynamicValue` in the binder.
