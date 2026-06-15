import {
  defineBinder,
  resolveChild,
  resolveChildList,
  resolveChecks,
  type ChildNodeRef,
  type CheckResult,
  type ComponentBinder,
} from '../../binder';
import { Catalog } from '../../catalog';
import { basicFunctions, FunctionRegistry } from '../../functions';

export const basicCatalogId =
  'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json';

function asVariant(v: unknown, allowed: readonly string[], def: string): string {
  return typeof v === 'string' && allowed.includes(v) ? v : def;
}
function asBool(v: unknown, def: boolean): boolean {
  return typeof v === 'boolean' ? v : def;
}

// ---------------------------------------------------------------------------
// Text & media
// ---------------------------------------------------------------------------
export interface TextProps {
  text: string;
  variant: string;
}
export const textBinder: ComponentBinder<TextProps> = defineBinder({
  name: 'Text',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return {
      text: ctx.resolveDynamicValue<string>(p.text ?? ''),
      variant: asVariant(p.variant, ['h1', 'h2', 'h3', 'h4', 'h5', 'caption', 'body'], 'body'),
    };
  },
});

export interface ImageProps {
  url: string;
  description?: string;
  fit?: string;
  variant?: string;
}
export const imageBinder: ComponentBinder<ImageProps> = defineBinder({
  name: 'Image',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return {
      url: ctx.resolveDynamicValue<string>(p.url ?? ''),
      description:
        p.description != null ? ctx.resolveDynamicValue<string>(p.description) : undefined,
      fit: asVariant(p.fit, ['contain', 'cover', 'fill', 'none', 'scaleDown'], 'fill'),
      variant: asVariant(
        p.variant,
        ['icon', 'avatar', 'smallFeature', 'mediumFeature', 'largeFeature', 'header'],
        'mediumFeature',
      ),
    };
  },
});

export interface IconProps {
  name: string;
}
export const iconBinder: ComponentBinder<IconProps> = defineBinder({
  name: 'Icon',
  schema: null,
  resolve(ctx) {
    return { name: ctx.resolveDynamicValue<string>(ctx.componentModel.properties.name ?? '') };
  },
});

export interface MediaProps {
  url: string;
}
const mediaBind = (name: string): ComponentBinder<MediaProps> =>
  defineBinder({
    name,
    schema: null,
    resolve(ctx) {
      return { url: ctx.resolveDynamicValue<string>(ctx.componentModel.properties.url ?? '') };
    },
  });
export const videoBinder: ComponentBinder<MediaProps> = mediaBind('Video');
export const audioPlayerBinder: ComponentBinder<MediaProps> = mediaBind('AudioPlayer');

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export interface ContainerProps {
  children: ChildNodeRef[];
  justify?: string;
  align?: string;
}
const justifyEnum = ['start', 'center', 'end', 'spaceBetween', 'spaceAround', 'spaceEvenly', 'stretch'];
const alignEnum = ['start', 'center', 'end', 'stretch'];

export const rowBinder: ComponentBinder<ContainerProps> = defineBinder({
  name: 'Row',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return {
      children: resolveChildList(p.children, ctx),
      justify: asVariant(p.justify, justifyEnum, 'start'),
      align: asVariant(p.align, alignEnum, 'start'),
    };
  },
});

export const columnBinder: ComponentBinder<ContainerProps> = defineBinder({
  name: 'Column',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return {
      children: resolveChildList(p.children, ctx),
      justify: asVariant(p.justify, justifyEnum, 'start'),
      align: asVariant(p.align, alignEnum, 'start'),
    };
  },
});

export interface ListProps {
  children: ChildNodeRef[];
  direction: string;
}
export const listBinder: ComponentBinder<ListProps> = defineBinder({
  name: 'List',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return {
      children: resolveChildList(p.children, ctx),
      direction: asVariant(p.direction, ['vertical', 'horizontal'], 'vertical'),
    };
  },
});

export interface CardProps {
  child: ChildNodeRef | null;
}
export const cardBinder: ComponentBinder<CardProps> = defineBinder({
  name: 'Card',
  schema: null,
  resolve(ctx) {
    return { child: resolveChild(ctx.componentModel.properties.child, ctx) };
  },
});

export interface TabsProps {
  tabs: { title: string; child: ChildNodeRef | null }[];
}
export const tabsBinder: ComponentBinder<TabsProps> = defineBinder({
  name: 'Tabs',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    const raw = Array.isArray(p.tabs) ? (p.tabs as { title?: unknown; child?: unknown }[]) : [];
    return {
      // Canonical v1.0 shape: `tabs: [{ title, child }]` (catalog.json Tabs def).
      tabs: raw.map((tab) => ({
        title: ctx.resolveDynamicValue<string>(tab.title),
        child: resolveChild(tab.child, ctx),
      })),
    };
  },
});

export interface DividerProps {
  axis: string;
}
export const dividerBinder: ComponentBinder<DividerProps> = defineBinder({
  name: 'Divider',
  schema: null,
  resolve(ctx) {
    return {
      axis: asVariant(ctx.componentModel.properties.axis, ['horizontal', 'vertical'], 'horizontal'),
    };
  },
});

export interface ModalProps {
  trigger: ChildNodeRef | null;
  content: ChildNodeRef | null;
}
export const modalBinder: ComponentBinder<ModalProps> = defineBinder({
  name: 'Modal',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return {
      trigger: resolveChild(p.trigger, ctx),
      content: resolveChild(p.content, ctx),
    };
  },
});

// ---------------------------------------------------------------------------
// Interactive / inputs
// ---------------------------------------------------------------------------
function disabledFrom(checks: CheckResult[]): boolean {
  return checks.some((c) => !c.valid);
}

export interface ButtonProps {
  child: ChildNodeRef | null;
  variant: string;
  action?: unknown;
  checks: CheckResult[];
  disabled: boolean;
}
export const buttonBinder: ComponentBinder<ButtonProps> = defineBinder({
  name: 'Button',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    const checks = resolveChecks(p.checks, ctx);
    return {
      child: resolveChild(p.child, ctx),
      variant: asVariant(p.variant, ['primary', 'borderless', 'default'], 'default'),
      action: p.action,
      checks,
      disabled: disabledFrom(checks),
    };
  },
});

export interface CheckBoxProps {
  label?: string;
  value: boolean;
  checks: CheckResult[];
}
export const checkBoxBinder: ComponentBinder<CheckBoxProps> = defineBinder({
  name: 'CheckBox',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return {
      label: p.label != null ? ctx.resolveDynamicValue<string>(p.label) : undefined,
      value: Boolean(ctx.resolveDynamicValue(p.value)),
      checks: resolveChecks(p.checks, ctx),
    };
  },
});

export interface TextFieldProps {
  label?: string;
  value: string;
  variant: string;
  validationRegexp?: string;
  checks: CheckResult[];
}
export const textFieldBinder: ComponentBinder<TextFieldProps> = defineBinder({
  name: 'TextField',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return {
      label: p.label != null ? ctx.resolveDynamicValue<string>(p.label) : undefined,
      value: ctx.resolveDynamicValue<string>(p.value ?? ''),
      variant: asVariant(p.variant, ['shortText', 'longText', 'number', 'obscured'], 'shortText'),
      validationRegexp:
        typeof p.validationRegexp === 'string' ? p.validationRegexp : undefined,
      checks: resolveChecks(p.checks, ctx),
    };
  },
});

export interface DateTimeInputProps {
  value: string;
  enableDate: boolean;
  enableTime: boolean;
  checks: CheckResult[];
}
export const dateTimeInputBinder: ComponentBinder<DateTimeInputProps> = defineBinder({
  name: 'DateTimeInput',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return {
      value: ctx.resolveDynamicValue<string>(p.value ?? ''),
      enableDate: asBool(p.enableDate, true),
      enableTime: asBool(p.enableTime, false),
      checks: resolveChecks(p.checks, ctx),
    };
  },
});

export interface ChoicePickerProps {
  options: Array<{ label: string; value: string }>;
  value: string[];
  variant?: string;
  displayStyle?: string;
  filterable: boolean;
  checks: CheckResult[];
}
export const choicePickerBinder: ComponentBinder<ChoicePickerProps> = defineBinder({
  name: 'ChoicePicker',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    const rawValue = ctx.resolveDynamicValue<unknown>(p.value);
    return {
      options: Array.isArray(p.options)
        ? p.options.map((o) => ({
            label: ctx.resolveDynamicValue<string>((o as { label?: unknown }).label ?? ''),
            value: String((o as { value?: unknown }).value ?? ''),
          }))
        : [],
      value: Array.isArray(rawValue)
        ? rawValue.map((v) => String(v))
        : rawValue != null && rawValue !== ''
          ? [String(rawValue)]
          : [],
      variant: asVariant(p.variant, ['mutuallyExclusive', 'multipleSelection'], 'multipleSelection'),
      displayStyle: asVariant(p.displayStyle, ['checkbox', 'chips'], 'checkbox'),
      filterable: asBool(p.filterable, false),
      checks: resolveChecks(p.checks, ctx),
    };
  },
});

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  checks: CheckResult[];
}
export const sliderBinder: ComponentBinder<SliderProps> = defineBinder({
  name: 'Slider',
  schema: null,
  resolve(ctx) {
    const p = ctx.componentModel.properties;
    return {
      value: ctx.resolveDynamicValue<number>(p.value ?? 0),
      min: typeof p.min === 'number' ? p.min : 0,
      max: typeof p.max === 'number' ? p.max : 100,
      checks: resolveChecks(p.checks, ctx),
    };
  },
});

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
export const basicComponentBinders: ComponentBinder<unknown>[] = [
  textBinder,
  imageBinder,
  iconBinder,
  videoBinder,
  audioPlayerBinder,
  rowBinder,
  columnBinder,
  listBinder,
  cardBinder,
  tabsBinder,
  dividerBinder,
  modalBinder,
  buttonBinder,
  checkBoxBinder,
  textFieldBinder,
  dateTimeInputBinder,
  choicePickerBinder,
  sliderBinder,
];

export function createBasicCatalog(): Catalog {
  return new Catalog({
    id: basicCatalogId,
    components: basicComponentBinders,
    functions: new FunctionRegistry(basicFunctions),
    instructions: 'For layout, use the Row and Column components to organize other components.',
  });
}

export const basicCatalog = createBasicCatalog();
