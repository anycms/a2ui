import { defineComponent, h, ref, type PropType, type VNode, type VNodeChild } from 'vue';
import type { ComponentContext, ChildNodeRef } from '@anycms/a2ui-core';
import type { ComponentViewProps } from './adapter';
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

// --- shared style helpers (Leaf-Margin strategy: leaves carry 8px margin) ---
// Mirrors packages/a2ui-react/src/components.tsx exactly.
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

/** Shared error-message style for failed check hints (vanilla renderer). */
const ERROR_MESSAGE_STYLE: Record<string, string> = {
  color: '#dc2626',
  fontSize: '0.8em',
  marginTop: '2px',
};

/** First failing check message, or null when checks are absent/valid. */
function firstErrorMessage(checks: { valid: boolean; message: string }[] | undefined): string | null {
  return checks?.find((c) => !c.valid && c.message)?.message ?? null;
}

/** Extract a bound {path} from a component property (for two-way binding). */
function boundPath(ctx: ComponentContext, key = 'value'): string | null {
  const v = ctx.componentModel.properties[key];
  if (v && typeof v === 'object' && 'path' in v) {
    const p = (v as { path?: unknown }).path;
    if (typeof p === 'string') return p;
  }
  return null;
}

/** Button action payload — mirrors the React reference ButtonView handler. */
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

// --- Text & media ---

export const TextView = ({ props }: ComponentViewProps<TextProps>): VNodeChild => {
  const isHeading = props.variant.startsWith('h');
  return h('div', {
    class: 'a2ui-leaf',
    style: {
      ...LEAF,
      fontSize: `${TEXT_SIZE[props.variant] ?? 1}em`,
      fontWeight: isHeading ? '600' : '400',
      fontStyle: props.variant === 'caption' ? 'italic' : 'normal',
      opacity: props.variant === 'caption' ? '0.7' : '1',
      color: 'inherit',
    },
  }, [props.text]);
};

export const ImageView = ({ props }: ComponentViewProps<ImageProps>): VNodeChild =>
  h('img', {
    class: 'a2ui-leaf',
    src: props.url,
    alt: props.description ?? '',
    style: { ...LEAF, objectFit: IMAGE_FIT[props.fit ?? 'fill'], ...imageVariantStyle(props.variant ?? 'mediumFeature') },
  });

export const IconView = ({ props }: ComponentViewProps<IconProps>): VNodeChild =>
  h('span', { class: 'a2ui-leaf', title: props.name, style: { ...LEAF, display: 'inline-block', color: 'inherit' } }, ['◆']);

export const VideoView = ({ props }: ComponentViewProps<MediaProps>): VNodeChild =>
  h('video', { class: 'a2ui-leaf', src: props.url, controls: true, style: { ...LEAF, width: '100%' } });

export const AudioPlayerView = ({ props }: ComponentViewProps<MediaProps>): VNodeChild =>
  h('audio', { class: 'a2ui-leaf', src: props.url, controls: true, style: { ...LEAF, width: '100%' } });

// --- layout ---

export const RowView = ({ props, buildChild }: ComponentViewProps<ContainerProps>): VNodeChild =>
  h('div', {
    class: 'a2ui-row',
    style: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: JUSTIFY[props.justify ?? 'start'],
      alignItems: ALIGN[props.align ?? 'start'],
    },
  }, props.children.map((c) => buildChild(c)));

export const ColumnView = ({ props, buildChild }: ComponentViewProps<ContainerProps>): VNodeChild =>
  h('div', {
    class: 'a2ui-column',
    style: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: JUSTIFY[props.justify ?? 'start'],
      alignItems: ALIGN[props.align ?? 'start'],
    },
  }, props.children.map((c) => buildChild(c)));

export const ListView = ({ props, buildChild }: ComponentViewProps<ListProps>): VNodeChild => {
  const horizontal = props.direction === 'horizontal';
  return h('div', {
    class: 'a2ui-list',
    style: {
      display: 'flex',
      flexDirection: horizontal ? 'row' : 'column',
      overflowX: horizontal ? 'auto' : 'hidden',
      overflowY: horizontal ? 'hidden' : 'auto',
    },
  }, props.children.map((c) => buildChild(c)));
};

export const CardView = ({ props, buildChild }: ComponentViewProps<CardProps>): VNodeChild =>
  h('div', {
    class: 'a2ui-leaf',
    style: { ...LEAF, border: '1px solid #ccc', borderRadius: '8px', padding: '12px' },
  }, props.child ? [buildChild(props.child)] : []);

export const DividerView = ({ props }: ComponentViewProps<DividerProps>): VNodeChild => {
  const vertical = props.axis === 'vertical';
  return h('hr', {
    class: 'a2ui-leaf',
    style: vertical
      ? { ...LEAF, width: '1px', alignSelf: 'stretch', border: 'none', borderLeft: '1px solid #ccc' }
      : { ...LEAF, width: '100%', border: 'none', borderTop: '1px solid #ccc' },
  });
};

// --- stateful: Tabs & Modal (local UI state via an internal component) ---

const TabsInner = defineComponent({
  name: 'A2uiTabsInner',
  props: {
    tabs: { type: Array as PropType<TabsProps['tabs']>, required: true },
    buildChild: { type: Function as PropType<(ref: ChildNodeRef) => VNode>, required: true },
  },
  setup(p) {
    // Local UI state (selected tab) lives here and survives prop updates — the
    // Vue analogue of React's `useState`.
    const idx = ref(0);
    return () => {
      const tabs = p.tabs;
      const safeIdx = tabs.length ? Math.min(Math.max(idx.value, 0), tabs.length - 1) : 0;
      return h('div', { class: 'a2ui-leaf', style: LEAF }, [
        h('div', { style: { display: 'flex', borderBottom: '1px solid #ccc' } },
          tabs.map((tab, i) => h('button', {
            key: i,
            onClick: () => { idx.value = i; },
            style: {
              fontWeight: i === safeIdx ? '700' : '400',
              padding: '6px 12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
            },
          }, [tab.title])),
        ),
        h('div', { style: { padding: '8px' } }, [
          tabs[safeIdx]?.child ? p.buildChild(tabs[safeIdx].child!) : null,
        ]),
      ]);
    };
  },
});

export const TabsView = ({ props, buildChild }: ComponentViewProps<TabsProps>): VNodeChild =>
  h(TabsInner, { tabs: props.tabs, buildChild });

const ModalInner = defineComponent({
  name: 'A2uiModalInner',
  props: {
    trigger: { type: Object as PropType<ChildNodeRef | null>, default: null },
    content: { type: Object as PropType<ChildNodeRef | null>, default: null },
    buildChild: { type: Function as PropType<(ref: ChildNodeRef) => VNode>, required: true },
  },
  setup(p) {
    const show = ref(false);
    return () => [
      h('span', { onClick: () => { show.value = true; } }, [p.trigger ? p.buildChild(p.trigger) : null]),
      show.value
        ? h('div', {
            class: 'a2ui-modal',
            onClick: () => { show.value = false; },
            style: {
              position: 'fixed',
              inset: '0',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: '1000',
            },
          }, [
            h('div', {
              onClick: (e: Event) => e.stopPropagation(),
              style: { background: '#fff', padding: '16px', borderRadius: '8px' },
            }, [p.content ? p.buildChild(p.content) : null]),
          ])
        : null,
    ];
  },
});

export const ModalView = ({ props, buildChild }: ComponentViewProps<ModalProps>): VNodeChild =>
  h(ModalInner, { trigger: props.trigger, content: props.content, buildChild });

// --- interactive / inputs ---

export const ButtonView = ({ props, ctx, buildChild }: ComponentViewProps<ButtonProps>): VNodeChild => {
  const onClick = (): void => {
    dispatchButtonAction(ctx, props.action as ButtonAction);
  };
  return h('button', {
    class: 'a2ui-leaf',
    onClick,
    disabled: props.disabled,
    style: {
      ...LEAF,
      ...buttonVariantStyle(props.variant),
      padding: '6px 14px',
      borderRadius: '6px',
      cursor: props.disabled ? 'not-allowed' : 'pointer',
    },
  }, props.child ? [buildChild(props.child)] : []);
};

export const CheckBoxView = ({ props, ctx }: ComponentViewProps<CheckBoxProps>): VNodeChild => {
  const onChange = (e: Event): void => {
    const path = boundPath(ctx);
    if (path) ctx.set(path, (e.currentTarget as HTMLInputElement).checked);
  };
  const error = firstErrorMessage(props.checks);
  return [
    h('label', { class: 'a2ui-leaf', style: { ...LEAF, display: 'flex', alignItems: 'center', gap: '6px' } }, [
      h('input', { type: 'checkbox', checked: props.value, onChange }),
      h('span', {}, [props.label ?? '']),
    ]),
    error ? h('div', { class: 'a2ui-check-error', style: ERROR_MESSAGE_STYLE }, [error]) : null,
  ];
};

export const TextFieldView = ({ props, ctx }: ComponentViewProps<TextFieldProps>): VNodeChild => {
  const onInput = (e: Event): void => {
    const path = boundPath(ctx);
    if (path) ctx.set(path, (e.currentTarget as HTMLInputElement | HTMLTextAreaElement).value);
  };
  const common = { value: props.value, onInput, placeholder: props.label ?? '' };
  const error = firstErrorMessage(props.checks);
  if (props.variant === 'longText') {
    return [
      h('textarea', { class: 'a2ui-leaf', ...common, style: { ...LEAF, width: '100%', minHeight: '80px' } }),
      error ? h('div', { class: 'a2ui-check-error', style: ERROR_MESSAGE_STYLE }, [error]) : null,
    ];
  }
  return [
    h('input', { class: 'a2ui-leaf', type: TEXTFIELD_TYPE[props.variant] ?? 'text', ...common, style: { ...LEAF } }),
    error ? h('div', { class: 'a2ui-check-error', style: ERROR_MESSAGE_STYLE }, [error]) : null,
  ];
};

export const DateTimeInputView = ({ props, ctx }: ComponentViewProps<DateTimeInputProps>): VNodeChild => {
  const type = props.enableDate && props.enableTime ? 'datetime-local' : props.enableDate ? 'date' : 'time';
  const onChange = (e: Event): void => {
    const path = boundPath(ctx);
    if (path) ctx.set(path, (e.currentTarget as HTMLInputElement).value);
  };
  const error = firstErrorMessage(props.checks);
  return [
    h('input', { class: 'a2ui-leaf', type, value: props.value, onChange, style: LEAF }),
    error ? h('div', { class: 'a2ui-check-error', style: ERROR_MESSAGE_STYLE }, [error]) : null,
  ];
};

export const ChoicePickerView = ({ props, ctx }: ComponentViewProps<ChoicePickerProps>): VNodeChild => {
  const exclusive = props.variant === 'mutuallyExclusive';
  const toggle = (value: string, checked: boolean): void => {
    const path = boundPath(ctx);
    if (!path) return;
    if (exclusive) {
      ctx.set(path, value);
    } else {
      const cur = Array.isArray(props.value) ? props.value : [];
      ctx.set(path, checked ? [...cur, value] : cur.filter((v) => v !== value));
    }
  };
  const error = firstErrorMessage(props.checks);
  return [
    h('div', {
      class: 'a2ui-leaf',
      style: { ...LEAF, display: 'flex', flexWrap: 'wrap', gap: props.displayStyle === 'chips' ? '6px' : '2px' },
    }, props.options.map((o) => {
      const selected = exclusive ? props.value[0] === o.value : props.value.includes(o.value);
      return h('label', { key: o.value, style: { display: 'flex', alignItems: 'center', gap: '4px' } }, [
        h('input', {
          type: exclusive ? 'radio' : 'checkbox',
          checked: selected,
          onChange: (e: Event) => toggle(o.value, (e.currentTarget as HTMLInputElement).checked),
        }),
        h('span', {}, [o.label]),
      ]);
    })),
    error ? h('div', { class: 'a2ui-check-error', style: ERROR_MESSAGE_STYLE }, [error]) : null,
  ];
};

export const SliderView = ({ props, ctx }: ComponentViewProps<SliderProps>): VNodeChild => {
  const onInput = (e: Event): void => {
    const path = boundPath(ctx);
    if (path) ctx.set(path, (e.currentTarget as HTMLInputElement).valueAsNumber);
  };
  const error = firstErrorMessage(props.checks);
  return [
    h('label', { class: 'a2ui-leaf', style: { ...LEAF, display: 'flex', alignItems: 'center', gap: '8px' } }, [
      h('input', { type: 'range', min: String(props.min), max: String(props.max), value: props.value, onInput }),
      h('span', {}, [String(props.value)]),
    ]),
    error ? h('div', { class: 'a2ui-check-error', style: ERROR_MESSAGE_STYLE }, [error]) : null,
  ];
};
