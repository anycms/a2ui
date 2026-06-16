import { Fragment, type ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { CheckBoxProps } from '@anycms/a2ui-core';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { boundPath } from '../bind';
import { firstErrorMessage } from '../lib/utils';

export function CheckBoxView({ props, ctx }: ComponentViewProps<CheckBoxProps>): ReactNode {
  const onCheckedChange = (checked: boolean) => {
    const p = boundPath(ctx);
    if (p) ctx.set(p, checked);
  };
  const error = firstErrorMessage(props.checks);
  return (
    <Fragment>
      <Label className="a2ui-leaf m-2 inline-flex items-center gap-2">
        <Checkbox checked={props.value} onCheckedChange={(v) => onCheckedChange(v === true)} />
        <span>{props.label}</span>
      </Label>
      {error && <p className="text-destructive text-sm mt-1 ml-2">{error}</p>}
    </Fragment>
  );
}
