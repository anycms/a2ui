import type { ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { CheckBoxProps } from '@anycms/a2ui-core';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { boundPath } from '../bind';

export function CheckBoxView({ props, ctx }: ComponentViewProps<CheckBoxProps>): ReactNode {
  const onCheckedChange = (checked: boolean) => {
    const p = boundPath(ctx);
    if (p) ctx.set(p, checked);
  };
  return (
    <Label className="a2ui-leaf m-2 inline-flex items-center gap-2">
      <Checkbox checked={props.value} onCheckedChange={(v) => onCheckedChange(v === true)} />
      <span>{props.label}</span>
    </Label>
  );
}
