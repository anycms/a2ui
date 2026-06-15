import { type ChangeEvent, type ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { TextFieldProps } from '@anycms/a2ui-core';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { boundPath } from '../bind';
import { TEXTFIELD_TYPE } from '../variants';

export function TextFieldView({ props, ctx }: ComponentViewProps<TextFieldProps>): ReactNode {
  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const p = boundPath(ctx);
    if (p) ctx.set(p, e.currentTarget.value);
  };
  const common = { value: props.value, onChange, placeholder: props.label };
  if (props.variant === 'longText') {
    return <Textarea {...common} className="a2ui-leaf m-2 w-full" />;
  }
  return <Input type={TEXTFIELD_TYPE[props.variant] ?? 'text'} {...common} className="a2ui-leaf m-2" />;
}
