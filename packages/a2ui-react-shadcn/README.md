# @anycms/a2ui-react-shadcn

A **shadcn/ui + Tailwind CSS** renderer preset for [A2UI](https://github.com/anycms/a2ui) v1.0. It provides a drop-in `ReactComponentRegistry` that renders the same A2UI message stream as the default vanilla renderer, but with shadcn/ui components built on [Radix UI](https://www.radix-ui.com/) + [Tailwind CSS](https://tailwindcss.com/).

It is a **pure presentation swap** — the A2UI binders, reactive runtime, and React adapter are reused unchanged from `@anycms/a2ui-core` / `@anycms/a2ui-react`. Only the 18 component Views change.

## Install

```bash
npm install @anycms/a2ui-react-shadcn @anycms/a2ui-react @anycms/a2ui-core
```

Peer deps: `react`, `react-dom`. The Radix / cva / tailwind-merge / lucide deps come along as regular dependencies.

## Usage

```tsx
import { A2uiSurface } from '@anycms/a2ui-react';
import { shadcnReactComponents } from '@anycms/a2ui-react-shadcn';
import '@anycms/a2ui-react-shadcn/styles.css'; // shadcn CSS variables (after your Tailwind import)

<A2uiSurface surface={surface} registry={shadcnReactComponents} />;
```

### Tailwind setup

This package emits Tailwind utility classes (`bg-primary`, `text-muted-foreground`, `rounded-md`, …). Your host app must have Tailwind configured and the shadcn CSS variables in scope. Either:

- copy the tokens from [`styles.css`](./styles.css) into your own `globals.css`, or
- import the shipped sheet directly: `import '@anycms/a2ui-react-shadcn/styles.css';`

and make sure Tailwind scans the built package so those classes are generated:

```css
/* Tailwind v4 */
@source '../node_modules/@anycms/a2ui-react-shadcn/dist';
```

```js
// Tailwind v3 — tailwind.config.js content
content: [
  './src/**/*.{ts,tsx}',
  './node_modules/@anycms/a2ui-react-shadcn/dist/**/*.{js,cjs}',
],
```

## A2UI prop → shadcn variant mapping

| A2UI component | A2UI field | shadcn rendering |
|---|---|---|
| Button | `variant`: primary / borderless / default | `default` / `ghost` / `outline` |
| Text | `variant`: h1…h5 / caption / body | heading + muted typography |
| TextField | `variant`: shortText / longText / number / obscured | `Input` / `Textarea`, password/number types |
| ChoicePicker | `variant` + `displayStyle` | `RadioGroup` / `Checkbox` group / `ToggleGroup` (chips) |
| Tabs / Modal / Slider / Divider / CheckBox | — | Radix `Tabs` / `Dialog` / `Slider` / `Separator` / `Checkbox` |

Full mapping lives in [`src/variants.ts`](./src/variants.ts).

## License

MIT © Liangdi
