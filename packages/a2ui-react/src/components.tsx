import { Fragment, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react';
import type { ComponentContext } from '@anycms/a2ui-core';
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
const LEAF: CSSProperties = { margin: 8 };
const JUSTIFY: Record<string, CSSProperties['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  spaceBetween: 'space-between',
  spaceAround: 'space-around',
  spaceEvenly: 'space-evenly',
  stretch: 'stretch',
};
const ALIGN: Record<string, CSSProperties['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
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

// --- Text & media ---
const TEXT_SIZE: Record<string, number> = {
  h1: 2.5, h2: 2, h3: 1.75, h4: 1.5, h5: 1.25, caption: 0.8, body: 1,
};
export function TextView({ props }: ComponentViewProps<TextProps>): ReactNode {
  const isHeading = props.variant.startsWith('h');
  return (
    <div
      className="a2ui-leaf"
      style={{
        ...LEAF,
        fontSize: `${TEXT_SIZE[props.variant] ?? 1}em`,
        fontWeight: isHeading ? 600 : 400,
        fontStyle: props.variant === 'caption' ? 'italic' : 'normal',
        opacity: props.variant === 'caption' ? 0.7 : 1,
        color: 'inherit',
      }}
    >
      {props.text}
    </div>
  );
}

const IMAGE_FIT: Record<string, CSSProperties['objectFit']> = {
  contain: 'contain', cover: 'cover', fill: 'fill', none: 'none', scaleDown: 'scale-down',
};
export function ImageView({ props }: ComponentViewProps<ImageProps>): ReactNode {
  const variantSize: Record<string, CSSProperties> = {
    icon: { width: 24, height: 24 },
    avatar: { width: 40, height: 40, borderRadius: '50%' },
    smallFeature: { width: 100, height: 100 },
    mediumFeature: { maxWidth: 300 },
    largeFeature: { width: '100%', maxHeight: 400 },
    header: { width: '100%', height: 200 },
  };
  return (
    <img
      className="a2ui-leaf"
      src={props.url}
      alt={props.description ?? ''}
      style={{ ...LEAF, objectFit: IMAGE_FIT[props.fit ?? 'fill'], ...variantSize[props.variant ?? 'mediumFeature'] }}
    />
  );
}

export function IconView({ props }: ComponentViewProps<IconProps>): ReactNode {
  return (
    <span className="a2ui-leaf" style={{ ...LEAF, display: 'inline-block', color: 'inherit' }} title={props.name}>
      ◆
    </span>
  );
}

export function VideoView({ props }: ComponentViewProps<MediaProps>): ReactNode {
  return <video className="a2ui-leaf" src={props.url} controls style={{ ...LEAF, width: '100%' }} />;
}

export function AudioPlayerView({ props }: ComponentViewProps<MediaProps>): ReactNode {
  return <audio className="a2ui-leaf" src={props.url} controls style={{ ...LEAF, width: '100%' }} />;
}

// --- layout ---
export function RowView({ props, buildChild }: ComponentViewProps<ContainerProps>): ReactNode {
  return (
    <div
      className="a2ui-row"
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: JUSTIFY[props.justify ?? 'start'],
        alignItems: ALIGN[props.align ?? 'start'],
      }}
    >
      {props.children.map((c, i) => <Fragment key={i}>{buildChild(c)}</Fragment>)}
    </div>
  );
}

export function ColumnView({ props, buildChild }: ComponentViewProps<ContainerProps>): ReactNode {
  return (
    <div
      className="a2ui-column"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: JUSTIFY[props.justify ?? 'start'],
        alignItems: ALIGN[props.align ?? 'start'],
      }}
    >
      {props.children.map((c, i) => <Fragment key={i}>{buildChild(c)}</Fragment>)}
    </div>
  );
}

export function ListView({ props, buildChild }: ComponentViewProps<ListProps>): ReactNode {
  return (
    <div
      className="a2ui-list"
      style={{
        display: 'flex',
        flexDirection: props.direction === 'horizontal' ? 'row' : 'column',
        overflowX: props.direction === 'horizontal' ? 'auto' : 'hidden',
        overflowY: props.direction === 'horizontal' ? 'hidden' : 'auto',
      }}
    >
      {props.children.map((c, i) => <Fragment key={i}>{buildChild(c)}</Fragment>)}
    </div>
  );
}

export function CardView({ props, buildChild }: ComponentViewProps<CardProps>): ReactNode {
  return (
    <div className="a2ui-leaf" style={{ ...LEAF, border: '1px solid #ccc', borderRadius: 8, padding: 12 }}>
      {props.child ? buildChild(props.child) : null}
    </div>
  );
}

export function TabsView({ props, buildChild }: ComponentViewProps<TabsProps>): ReactNode {
  const [idx, setIdx] = useState(0);
  return (
    <div className="a2ui-leaf" style={LEAF}>
      <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
        {props.tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            style={{ fontWeight: i === idx ? 700 : 400, padding: '6px 12px', border: 'none', background: 'none', cursor: 'pointer' }}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div style={{ padding: 8 }}>
        {props.tabs[idx]?.child ? buildChild(props.tabs[idx].child!) : null}
      </div>
    </div>
  );
}

export function DividerView({ props }: ComponentViewProps<DividerProps>): ReactNode {
  return (
    <hr
      className="a2ui-leaf"
      style={props.axis === 'vertical'
        ? { ...LEAF, width: 1, alignSelf: 'stretch', border: 'none', borderLeft: '1px solid #ccc' }
        : { ...LEAF, width: '100%', border: 'none', borderTop: '1px solid #ccc' }}
    />
  );
}

export function ModalView({ props, buildChild }: ComponentViewProps<ModalProps>): ReactNode {
  const [show, setShow] = useState(false);
  return (
    <>
      <span onClick={() => setShow(true)}>{props.trigger ? buildChild(props.trigger) : null}</span>
      {show && (
        <div
          className="a2ui-modal"
          onClick={() => setShow(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
            {props.content ? buildChild(props.content) : null}
          </div>
        </div>
      )}
    </>
  );
}

// --- interactive / inputs ---

/** First failing check message, or null when checks are absent/valid. */
function firstErrorMessage(checks: { valid: boolean; message: string }[] | undefined): string | null {
  return checks?.find((c) => !c.valid && c.message)?.message ?? null;
}

const ERROR_MESSAGE_STYLE: CSSProperties = {
  color: '#dc2626',
  fontSize: '0.8em',
  marginTop: 2,
  display: 'block',
};

function buttonVariantStyle(variant: string): CSSProperties {
  if (variant === 'primary') return { background: '#2563eb', color: '#fff', border: 'none' };
  if (variant === 'borderless') return { background: 'transparent', border: 'none', color: '#2563eb' };
  return { background: '#f0f0f0', border: '1px solid #ccc' };
}

export function ButtonView({ props, ctx, buildChild }: ComponentViewProps<ButtonProps>): ReactNode {
  const onClick = () => {
    const action = props.action as
      | { event?: { name: string; context?: Record<string, unknown> } }
      | { functionCall?: { call: string; args?: Record<string, unknown> } }
      | undefined;
    if (action && 'event' in action && action.event) {
      const context: Record<string, unknown> = {};
      if (action.event.context) {
        for (const [k, v] of Object.entries(action.event.context)) context[k] = ctx.resolveDynamicValue(v);
      }
      ctx.dispatchAction({ name: action.event.name, context });
    } else if (action && 'functionCall' in action && action.functionCall) {
      ctx.resolveDynamicValue(action.functionCall);
    }
  };
  return (
    <button className="a2ui-leaf" onClick={onClick} disabled={props.disabled} style={{ ...LEAF, ...buttonVariantStyle(props.variant), padding: '6px 14px', borderRadius: 6, cursor: props.disabled ? 'not-allowed' : 'pointer' }}>
      {props.child ? buildChild(props.child) : null}
    </button>
  );
}

export function CheckBoxView({ props, ctx }: ComponentViewProps<CheckBoxProps>): ReactNode {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const p = boundPath(ctx);
    if (p) ctx.set(p, e.currentTarget.checked);
  };
  const error = firstErrorMessage(props.checks);
  return (
    <>
      <label className="a2ui-leaf" style={{ ...LEAF, display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="checkbox" checked={props.value} onChange={onChange} />
        <span>{props.label}</span>
      </label>
      {error && <div style={ERROR_MESSAGE_STYLE}>{error}</div>}
    </>
  );
}

const TEXTFIELD_TYPE: Record<string, string> = {
  shortText: 'text', longText: 'text', number: 'number', obscured: 'password',
};
export function TextFieldView({ props, ctx }: ComponentViewProps<TextFieldProps>): ReactNode {
  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const p = boundPath(ctx);
    if (p) ctx.set(p, e.currentTarget.value);
  };
  const common = { value: props.value, onChange, placeholder: props.label };
  const error = firstErrorMessage(props.checks);
  if (props.variant === 'longText') {
    return (
      <>
        <textarea {...common} className="a2ui-leaf" style={{ ...LEAF, width: '100%', minHeight: 80 }} />
        {error && <div style={ERROR_MESSAGE_STYLE}>{error}</div>}
      </>
    );
  }
  return (
    <>
      <input type={TEXTFIELD_TYPE[props.variant] ?? 'text'} {...common} className="a2ui-leaf" style={{ ...LEAF }} />
      {error && <div style={ERROR_MESSAGE_STYLE}>{error}</div>}
    </>
  );
}

export function DateTimeInputView({ props, ctx }: ComponentViewProps<DateTimeInputProps>): ReactNode {
  const type = props.enableDate && props.enableTime ? 'datetime-local' : props.enableDate ? 'date' : 'time';
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const p = boundPath(ctx);
    if (p) ctx.set(p, e.currentTarget.value);
  };
  const error = firstErrorMessage(props.checks);
  return (
    <>
      <input type={type} value={props.value} onChange={onChange} className="a2ui-leaf" style={LEAF} />
      {error && <div style={ERROR_MESSAGE_STYLE}>{error}</div>}
    </>
  );
}

export function ChoicePickerView({ props, ctx }: ComponentViewProps<ChoicePickerProps>): ReactNode {
  const exclusive = props.variant === 'mutuallyExclusive';
  const toggle = (value: string, checked: boolean) => {
    const p = boundPath(ctx);
    if (!p) return;
    if (exclusive) {
      ctx.set(p, value);
    } else {
      const cur = Array.isArray(props.value) ? props.value : [];
      ctx.set(p, checked ? [...cur, value] : cur.filter((v) => v !== value));
    }
  };
  const error = firstErrorMessage(props.checks);
  return (
    <>
      <div className="a2ui-leaf" style={{ ...LEAF, display: 'flex', flexWrap: 'wrap', gap: props.displayStyle === 'chips' ? 6 : 2 }}>
        {props.options.map((o) => {
          const selected = exclusive ? props.value[0] === o.value : props.value.includes(o.value);
          return (
            <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type={exclusive ? 'radio' : 'checkbox'} checked={selected} onChange={(e) => toggle(o.value, e.currentTarget.checked)} />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
      {error && <div style={ERROR_MESSAGE_STYLE}>{error}</div>}
    </>
  );
}

export function SliderView({ props, ctx }: ComponentViewProps<SliderProps>): ReactNode {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const p = boundPath(ctx);
    if (p) ctx.set(p, e.currentTarget.valueAsNumber);
  };
  const error = firstErrorMessage(props.checks);
  return (
    <>
      <label className="a2ui-leaf" style={{ ...LEAF, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="range" min={props.min} max={props.max} value={props.value} onChange={onChange} />
        <span>{props.value}</span>
      </label>
      {error && <div style={ERROR_MESSAGE_STYLE}>{error}</div>}
    </>
  );
}
