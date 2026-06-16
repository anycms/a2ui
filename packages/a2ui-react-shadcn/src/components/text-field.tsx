import { Fragment, type ChangeEvent, type ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { TextFieldProps } from '@anycms/a2ui-core';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { boundPath } from '../bind';
import { TEXTFIELD_TYPE } from '../variants';
import { firstErrorMessage } from '../lib/utils';

export function TextFieldView({ props, ctx }: ComponentViewProps<TextFieldProps>): ReactNode {
  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const p = boundPath(ctx);
    if (p) ctx.set(p, e.currentTarget.value);
  };
  const common = { value: props.value, onChange, placeholder: props.label };
  const error = firstErrorMessage(props.checks);
  if (props.variant === 'longText') {
    return (
      <Fragment>
        <Textarea {...common} className="a2ui-leaf m-2 w-full" />
        {error && <p className="text-destructive text-sm mt-1 ml-2">{error}</p>}
      </Fragment>
    );
  }
  return (
    <Fragment>
      <Input type={TEXTFIELD_TYPE[props.variant] ?? 'text'} {...common} className="a2ui-leaf m-2" />
      {error && <p className="text-destructive text-sm mt-1 ml-2">{error}</p>}
    </Fragment>
  );
}
