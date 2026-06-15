import { type ChangeEvent, type ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { DateTimeInputProps } from '@anycms/a2ui-core';
import { Input } from '../ui/input';
import { boundPath } from '../bind';

export function DateTimeInputView({ props, ctx }: ComponentViewProps<DateTimeInputProps>): ReactNode {
  const type = props.enableDate && props.enableTime ? 'datetime-local' : props.enableDate ? 'date' : 'time';
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const p = boundPath(ctx);
    if (p) ctx.set(p, e.currentTarget.value);
  };
  return <Input type={type} value={props.value} onChange={onChange} className="a2ui-leaf m-2" />;
}
