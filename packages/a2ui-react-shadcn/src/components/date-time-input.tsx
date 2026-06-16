import { Fragment, type ChangeEvent, type ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { DateTimeInputProps } from '@anycms/a2ui-core';
import { Input } from '../ui/input';
import { boundPath } from '../bind';
import { firstErrorMessage } from '../lib/utils';

export function DateTimeInputView({ props, ctx }: ComponentViewProps<DateTimeInputProps>): ReactNode {
  const type = props.enableDate && props.enableTime ? 'datetime-local' : props.enableDate ? 'date' : 'time';
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const p = boundPath(ctx);
    if (p) ctx.set(p, e.currentTarget.value);
  };
  const error = firstErrorMessage(props.checks);
  return (
    <Fragment>
      <Input type={type} value={props.value} onChange={onChange} className="a2ui-leaf m-2" />
      {error && <p className="text-destructive text-sm mt-1 ml-2">{error}</p>}
    </Fragment>
  );
}
