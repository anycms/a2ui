import { Component, computed, input, signal } from '@angular/core';
import type { ComponentContext } from '@anycms/a2ui-core';
import type {
  ButtonProps,
  CardProps,
  CheckBoxProps,
  ChoicePickerProps,
  ContainerProps,
  DateTimeInputProps,
  DividerProps,
  IconProps,
  ImageProps,
  ListProps,
  MediaProps,
  ModalProps,
  SliderProps,
  TabsProps,
  TextProps,
  TextFieldProps,
} from '@anycms/a2ui-core';
import { A2uiNodeComponent } from './adapter/a2ui-node.component';

// --- shared style helpers (Leaf-Margin strategy: leaves carry 8px margin) ---
// Mirrors packages/a2ui-vue/src/components.ts and packages/a2ui-react/src/components.tsx.
const LEAF = { margin: '8px' } as const;
const JUSTIFY: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  spaceBetween: 'space-between',
  spaceAround: 'space-around',
  spaceEvenly: 'space-evenly',
  stretch: 'stretch',
};
const ALIGN: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};
const TEXT_SIZE: Record<string, number> = {
  h1: 2.5, h2: 2, h3: 1.75, h4: 1.5, h5: 1.25, caption: 0.8, body: 1,
};
const IMAGE_FIT: Record<string, string> = {
  contain: 'contain', cover: 'cover', fill: 'fill', none: 'none', scaleDown: 'scale-down',
};
const TEXTFIELD_TYPE: Record<string, string> = {
  shortText: 'text', longText: 'text', number: 'number', obscured: 'password',
};

/** Extract a bound {path} from a component property (for two-way binding). */
function boundPath(ctx: ComponentContext, key = 'value'): string | null {
  const v = ctx.componentModel.properties[key];
  if (v && typeof v === 'object' && 'path' in v) {
    const p = (v as { path?: unknown }).path;
    if (typeof p === 'string') return p;
  }
  return null;
}

/** First failing check message, or null when checks are absent/valid. */
function firstErrorMessage(checks: { valid: boolean; message: string }[] | undefined): string | null {
  return checks?.find((c) => !c.valid && c.message)?.message ?? null;
}

/** Button action payload — mirrors the React/Vue reference ButtonView handler. */
export type ButtonAction =
  | { event?: { name: string; context?: Record<string, unknown> } }
  | { functionCall?: { call: string; args?: Record<string, unknown> } }
  | undefined;

/** Dispatch a button action: `event` → resolve context + dispatchAction; `functionCall` → resolveDynamicValue. */
function dispatchButtonAction(ctx: ComponentContext, action: ButtonAction): void {
  if (action && 'event' in action && action.event) {
    const context: Record<string, unknown> = {};
    if (action.event.context) {
      for (const [k, v] of Object.entries(action.event.context)) context[k] = ctx.resolveDynamicValue(v);
    }
    ctx.dispatchAction({ name: action.event.name, context });
  } else if (action && 'functionCall' in action && action.functionCall) {
    ctx.resolveDynamicValue(action.functionCall);
  }
}

function buttonVariantStyle(variant: string): Record<string, string> {
  if (variant === 'primary') return { background: '#2563eb', color: '#fff', border: 'none' };
  if (variant === 'borderless') return { background: 'transparent', border: 'none', color: '#2563eb' };
  return { background: '#f0f0f0', border: '1px solid #ccc' };
}

function imageVariantStyle(variant: string): Record<string, string> {
  switch (variant) {
    case 'icon': return { width: '24px', height: '24px' };
    case 'avatar': return { width: '40px', height: '40px', borderRadius: '50%' };
    case 'smallFeature': return { width: '100px', height: '100px' };
    case 'largeFeature': return { width: '100%', maxHeight: '400px' };
    case 'header': return { width: '100%', height: '200px' };
    case 'mediumFeature':
    default: return { maxWidth: '300px' };
  }
}

// --- Text & media ----------------------------------------------------------

@Component({
  selector: 'a2ui-text',
  template: `<div class="a2ui-leaf" [style]="style()">{{ props()?.text }}</div>`,
})
export class TextViewComponent {
  readonly props = input<TextProps>();
  readonly ctx = input<ComponentContext>();
  readonly style = computed(() => {
    const v = this.props()?.variant ?? 'body';
    const isHeading = v.startsWith('h');
    return {
      ...LEAF,
      fontSize: `${TEXT_SIZE[v] ?? 1}em`,
      fontWeight: isHeading ? '600' : '400',
      fontStyle: v === 'caption' ? 'italic' : 'normal',
      opacity: v === 'caption' ? '0.7' : '1',
      color: 'inherit',
    };
  });
}

@Component({
  selector: 'a2ui-image',
  template: `<img class="a2ui-leaf" [src]="props()?.url" [alt]="props()?.description ?? ''" [style]="style()" />`,
})
export class ImageViewComponent {
  readonly props = input<ImageProps>();
  readonly ctx = input<ComponentContext>();
  readonly style = computed(() => {
    const p = this.props();
    return { ...LEAF, objectFit: IMAGE_FIT[p?.fit ?? 'fill'], ...imageVariantStyle(p?.variant ?? 'mediumFeature') };
  });
}

@Component({
  selector: 'a2ui-icon',
  template: `<span class="a2ui-leaf" [title]="props()?.name" [style]="{ margin: '8px', display: 'inline-block', color: 'inherit' }">◆</span>`,
})
export class IconViewComponent {
  readonly props = input<IconProps>();
  readonly ctx = input<ComponentContext>();
}

@Component({
  selector: 'a2ui-video',
  template: `<video class="a2ui-leaf" controls [src]="props()?.url" [style]="{ margin: '8px', width: '100%' }"></video>`,
})
export class VideoViewComponent {
  readonly props = input<MediaProps>();
  readonly ctx = input<ComponentContext>();
}

@Component({
  selector: 'a2ui-audio',
  template: `<audio class="a2ui-leaf" controls [src]="props()?.url" [style]="{ margin: '8px', width: '100%' }"></audio>`,
})
export class AudioPlayerViewComponent {
  readonly props = input<MediaProps>();
  readonly ctx = input<ComponentContext>();
}

// --- layout ----------------------------------------------------------------

@Component({
  selector: 'a2ui-row',
  template: `
    <div class="a2ui-row" [style]="style()">
      @for (c of props()?.children ?? []; track c.id + c.basePath) {
        <a2ui-node [id]="c.id" [basePath]="c.basePath" />
      }
    </div>
  `,
  imports: [A2uiNodeComponent],
})
export class RowViewComponent {
  readonly props = input<ContainerProps>();
  readonly ctx = input<ComponentContext>();
  readonly style = computed(() => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: JUSTIFY[this.props()?.justify ?? 'start'],
    alignItems: ALIGN[this.props()?.align ?? 'start'],
  }));
}

@Component({
  selector: 'a2ui-column',
  template: `
    <div class="a2ui-column" [style]="style()">
      @for (c of props()?.children ?? []; track c.id + c.basePath) {
        <a2ui-node [id]="c.id" [basePath]="c.basePath" />
      }
    </div>
  `,
  imports: [A2uiNodeComponent],
})
export class ColumnViewComponent {
  readonly props = input<ContainerProps>();
  readonly ctx = input<ComponentContext>();
  readonly style = computed(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: JUSTIFY[this.props()?.justify ?? 'start'],
    alignItems: ALIGN[this.props()?.align ?? 'start'],
  }));
}

@Component({
  selector: 'a2ui-list',
  template: `
    <div class="a2ui-list" [style]="style()">
      @for (c of props()?.children ?? []; track c.id + c.basePath) {
        <a2ui-node [id]="c.id" [basePath]="c.basePath" />
      }
    </div>
  `,
  imports: [A2uiNodeComponent],
})
export class ListViewComponent {
  readonly props = input<ListProps>();
  readonly ctx = input<ComponentContext>();
  readonly style = computed(() => {
    const horizontal = this.props()?.direction === 'horizontal';
    return {
      display: 'flex',
      flexDirection: horizontal ? 'row' : 'column',
      overflowX: horizontal ? 'auto' : 'hidden',
      overflowY: horizontal ? 'hidden' : 'auto',
    };
  });
}

@Component({
  selector: 'a2ui-card',
  template: `
    <div class="a2ui-leaf" [style]="{ margin: '8px', border: '1px solid #ccc', borderRadius: '8px', padding: '12px' }">
      @if (props()?.child; as child) {
        <a2ui-node [id]="child.id" [basePath]="child.basePath" />
      }
    </div>
  `,
  imports: [A2uiNodeComponent],
})
export class CardViewComponent {
  readonly props = input<CardProps>();
  readonly ctx = input<ComponentContext>();
}

@Component({
  selector: 'a2ui-divider',
  template: `<hr class="a2ui-leaf" [style]="style()" />`,
})
export class DividerViewComponent {
  readonly props = input<DividerProps>();
  readonly ctx = input<ComponentContext>();
  readonly style = computed(() => {
    const vertical = this.props()?.axis === 'vertical';
    return vertical
      ? { ...LEAF, width: '1px', alignSelf: 'stretch', border: 'none', borderLeft: '1px solid #ccc' }
      : { ...LEAF, width: '100%', border: 'none', borderTop: '1px solid #ccc' };
  });
}

// --- stateful: Tabs & Modal (local UI state via signals) -------------------

@Component({
  selector: 'a2ui-tabs',
  template: `
    <div class="a2ui-leaf" [style]="{ margin: '8px' }">
      <div [style]="{ display: 'flex', borderBottom: '1px solid #ccc' }">
        @for (tab of props()?.tabs ?? []; track $index) {
          <button (click)="select($index)" [style]="{ fontWeight: $index === safeIdx() ? '700' : '400', padding: '6px 12px', border: 'none', background: 'none', cursor: 'pointer' }">{{ tab.title }}</button>
        }
      </div>
      <div [style]="{ padding: '8px' }">
        @if (props()?.tabs[safeIdx()]?.child; as c) {
          <a2ui-node [id]="c.id" [basePath]="c.basePath" />
        }
      </div>
    </div>
  `,
  imports: [A2uiNodeComponent],
})
export class TabsViewComponent {
  readonly props = input<TabsProps>();
  readonly ctx = input<ComponentContext>();
  // Local UI state (selected tab) survives prop updates — the Angular analogue
  // of React's useState / Vue's local ref.
  readonly selected = signal(0);
  readonly safeIdx = computed(() => {
    const tabs = this.props()?.tabs ?? [];
    return tabs.length ? Math.min(Math.max(this.selected(), 0), tabs.length - 1) : 0;
  });
  select(i: number): void {
    this.selected.set(i);
  }
}

@Component({
  selector: 'a2ui-modal',
  template: `
    <span (click)="show.set(true)">
      @if (props()?.trigger; as t) {
        <a2ui-node [id]="t.id" [basePath]="t.basePath" />
      }
    </span>
    @if (show()) {
      <div class="a2ui-modal" (click)="show.set(false)" [style]="overlay()">
        <div (click)="$event.stopPropagation()" [style]="{ background: '#fff', padding: '16px', borderRadius: '8px' }">
          @if (props()?.content; as c) {
            <a2ui-node [id]="c.id" [basePath]="c.basePath" />
          }
        </div>
      </div>
    }
  `,
  imports: [A2uiNodeComponent],
})
export class ModalViewComponent {
  readonly props = input<ModalProps>();
  readonly ctx = input<ComponentContext>();
  readonly show = signal(false);
  readonly overlay = {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1000',
  };
}

// --- interactive / inputs --------------------------------------------------

@Component({
  selector: 'a2ui-button',
  template: `
    <button class="a2ui-leaf" [disabled]="props()?.disabled" (click)="onClick()" [style]="style()">
      @if (props()?.child; as child) {
        <a2ui-node [id]="child.id" [basePath]="child.basePath" />
      }
    </button>
  `,
  imports: [A2uiNodeComponent],
})
export class ButtonViewComponent {
  readonly props = input<ButtonProps>();
  readonly ctx = input<ComponentContext>();
  readonly style = computed(() => {
    const p = this.props();
    return {
      ...LEAF,
      ...buttonVariantStyle(p?.variant ?? 'default'),
      padding: '6px 14px',
      borderRadius: '6px',
      cursor: p?.disabled ? 'not-allowed' : 'pointer',
    };
  });
  onClick(): void {
    const p = this.props();
    const ctx = this.ctx();
    if (p && ctx) dispatchButtonAction(ctx, p.action as ButtonAction);
  }
}

@Component({
  selector: 'a2ui-checkbox',
  template: `
    <label class="a2ui-leaf" [style]="{ margin: '8px', display: 'flex', alignItems: 'center', gap: '6px' }">
      <input type="checkbox" [checked]="props()?.value" (change)="onChange($event)" />
      <span>{{ props()?.label ?? '' }}</span>
    </label>
    @if (firstError(); as err) {
      <div class="a2ui-check-error" [style.color]="'#dc2626'" [style.fontSize]="'0.8em'" [style.marginTop]="'2px'">{{ err }}</div>
    }
  `,
})
export class CheckBoxViewComponent {
  readonly props = input<CheckBoxProps>();
  readonly ctx = input<ComponentContext>();
  readonly firstError = computed(() => firstErrorMessage(this.props()?.checks));
  onChange(e: Event): void {
    const ctx = this.ctx();
    if (!ctx) return;
    const path = boundPath(ctx);
    if (path) ctx.set(path, (e.currentTarget as HTMLInputElement).checked);
  }
}

@Component({
  selector: 'a2ui-text-field',
  template: `
    @if (props()?.variant === 'longText') {
      <textarea class="a2ui-leaf" [value]="props()?.value" [placeholder]="props()?.label ?? ''"
        (input)="onInput($event)" [style]="{ margin: '8px', width: '100%', minHeight: '80px' }"></textarea>
    } @else {
      <input class="a2ui-leaf" [type]="type()" [value]="props()?.value" [placeholder]="props()?.label ?? ''"
        (input)="onInput($event)" [style]="{ margin: '8px' }" />
    }
    @if (firstError(); as err) {
      <div class="a2ui-check-error" [style.color]="'#dc2626'" [style.fontSize]="'0.8em'" [style.marginTop]="'2px'">{{ err }}</div>
    }
  `,
})
export class TextFieldViewComponent {
  readonly props = input<TextFieldProps>();
  readonly ctx = input<ComponentContext>();
  readonly type = computed(() => TEXTFIELD_TYPE[this.props()?.variant ?? 'shortText'] ?? 'text');
  readonly firstError = computed(() => firstErrorMessage(this.props()?.checks));
  onInput(e: Event): void {
    const ctx = this.ctx();
    if (!ctx) return;
    const path = boundPath(ctx);
    if (path) ctx.set(path, (e.currentTarget as HTMLInputElement | HTMLTextAreaElement).value);
  }
}

@Component({
  selector: 'a2ui-date-time',
  template: `
    <input class="a2ui-leaf" [type]="type()" [value]="props()?.value" (change)="onChange($event)" [style]="{ margin: '8px' }" />
    @if (firstError(); as err) {
      <div class="a2ui-check-error" [style.color]="'#dc2626'" [style.fontSize]="'0.8em'" [style.marginTop]="'2px'">{{ err }}</div>
    }
  `,
})
export class DateTimeInputViewComponent {
  readonly props = input<DateTimeInputProps>();
  readonly ctx = input<ComponentContext>();
  readonly type = computed(() => {
    const p = this.props();
    if (!p) return 'text';
    return p.enableDate && p.enableTime ? 'datetime-local' : p.enableDate ? 'date' : 'time';
  });
  readonly firstError = computed(() => firstErrorMessage(this.props()?.checks));
  onChange(e: Event): void {
    const ctx = this.ctx();
    if (!ctx) return;
    const path = boundPath(ctx);
    if (path) ctx.set(path, (e.currentTarget as HTMLInputElement).value);
  }
}

@Component({
  selector: 'a2ui-choice',
  template: `
    <div class="a2ui-leaf" [style]="style()">
      @for (o of props()?.options ?? []; track o.value) {
        <label [style]="{ display: 'flex', alignItems: 'center', gap: '4px' }">
          <input [type]="exclusive() ? 'radio' : 'checkbox'" [checked]="isSelected(o.value)"
            (change)="toggle(o.value, $event)" />
          <span>{{ o.label }}</span>
        </label>
      }
    </div>
    @if (firstError(); as err) {
      <div class="a2ui-check-error" [style.color]="'#dc2626'" [style.fontSize]="'0.8em'" [style.marginTop]="'2px'">{{ err }}</div>
    }
  `,
})
export class ChoicePickerViewComponent {
  readonly props = input<ChoicePickerProps>();
  readonly ctx = input<ComponentContext>();
  readonly exclusive = computed(() => this.props()?.variant === 'mutuallyExclusive');
  readonly firstError = computed(() => firstErrorMessage(this.props()?.checks));
  readonly style = computed(() => ({
    margin: '8px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: this.props()?.displayStyle === 'chips' ? '6px' : '2px',
  }));
  isSelected(value: string): boolean {
    const p = this.props();
    if (!p) return false;
    return this.exclusive() ? p.value[0] === value : p.value.includes(value);
  }
  toggle(value: string, e: Event): void {
    const ctx = this.ctx();
    const p = this.props();
    if (!ctx || !p) return;
    const path = boundPath(ctx);
    if (!path) return;
    const checked = (e.currentTarget as HTMLInputElement).checked;
    if (this.exclusive()) {
      ctx.set(path, value);
    } else {
      const cur = Array.isArray(p.value) ? p.value : [];
      ctx.set(path, checked ? [...cur, value] : cur.filter((v) => v !== value));
    }
  }
}

@Component({
  selector: 'a2ui-slider',
  template: `
    <label class="a2ui-leaf" [style]="{ margin: '8px', display: 'flex', alignItems: 'center', gap: '8px' }">
      <input type="range" [min]="props()?.min" [max]="props()?.max" [value]="props()?.value" (input)="onInput($event)" />
      <span>{{ props()?.value }}</span>
    </label>
    @if (firstError(); as err) {
      <div class="a2ui-check-error" [style.color]="'#dc2626'" [style.fontSize]="'0.8em'" [style.marginTop]="'2px'">{{ err }}</div>
    }
  `,
})
export class SliderViewComponent {
  readonly props = input<SliderProps>();
  readonly ctx = input<ComponentContext>();
  readonly firstError = computed(() => firstErrorMessage(this.props()?.checks));
  onInput(e: Event): void {
    const ctx = this.ctx();
    if (!ctx) return;
    const path = boundPath(ctx);
    if (path) ctx.set(path, (e.currentTarget as HTMLInputElement).valueAsNumber);
  }
}
