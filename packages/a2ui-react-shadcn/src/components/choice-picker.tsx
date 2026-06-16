import { Fragment, type ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { ChoicePickerProps } from '@anycms/a2ui-core';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { boundPath } from '../bind';
import { cn, firstErrorMessage } from '../lib/utils';
import { CHOICE_GAP } from '../variants';

export function ChoicePickerView({ props, ctx }: ComponentViewProps<ChoicePickerProps>): ReactNode {
  const exclusive = props.variant === 'mutuallyExclusive';

  const write = (value: string, checked: boolean) => {
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

  // chips → ToggleGroup; otherwise checkbox/radio list.
  // Radix's ToggleGroup props are a discriminated union on `type`, so the two
  // cases branch separately for correct narrowing.
  if (props.displayStyle === 'chips') {
    const items = props.options.map((o) => (
      <ToggleGroupItem key={o.value} value={o.value}>{o.label}</ToggleGroupItem>
    ));
    if (exclusive) {
      return (
        <Fragment>
          <ToggleGroup
            type="single"
            className="a2ui-leaf m-2 flex flex-wrap gap-2 justify-start"
            value={props.value[0] ?? ''}
            onValueChange={(v: string) => v && write(v, true)}
          >
            {items}
          </ToggleGroup>
          {error && <p className="text-destructive text-sm mt-1 ml-2">{error}</p>}
        </Fragment>
      );
    }
    return (
      <Fragment>
        <ToggleGroup
          type="multiple"
          className="a2ui-leaf m-2 flex flex-wrap gap-2 justify-start"
          value={props.value}
          onValueChange={(v: string[]) => {
            for (const item of props.options) {
              const on = v.includes(item.value);
              if (on !== props.value.includes(item.value)) write(item.value, on);
            }
          }}
        >
          {items}
        </ToggleGroup>
        {error && <p className="text-destructive text-sm mt-1 ml-2">{error}</p>}
      </Fragment>
    );
  }

  if (exclusive) {
    return (
      <Fragment>
        <RadioGroup
          className={cn('a2ui-leaf m-2 grid gap-2', CHOICE_GAP[props.displayStyle ?? 'checkbox'])}
          value={props.value[0] ?? ''}
          onValueChange={(v) => v && write(v, true)}
        >
          {props.options.map((o) => (
            <Label key={o.value} className="inline-flex items-center gap-2">
              <RadioGroupItem value={o.value} />
              <span>{o.label}</span>
            </Label>
          ))}
        </RadioGroup>
        {error && <p className="text-destructive text-sm mt-1 ml-2">{error}</p>}
      </Fragment>
    );
  }

  return (
    <Fragment>
      <div className={cn('a2ui-leaf m-2 grid gap-2', CHOICE_GAP[props.displayStyle ?? 'checkbox'])}>
        {props.options.map((o) => {
          const selected = props.value.includes(o.value);
          return (
            <Label key={o.value} className="inline-flex items-center gap-2">
              <Checkbox checked={selected} onCheckedChange={(c) => write(o.value, c === true)} />
              <span>{o.label}</span>
            </Label>
          );
        })}
      </div>
      {error && <p className="text-destructive text-sm mt-1 ml-2">{error}</p>}
    </Fragment>
  );
}
