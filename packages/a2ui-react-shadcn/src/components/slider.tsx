import { Fragment, type ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { SliderProps } from '@anycms/a2ui-core';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { boundPath } from '../bind';
import { firstErrorMessage } from '../lib/utils';

export function SliderView({ props, ctx }: ComponentViewProps<SliderProps>): ReactNode {
  const error = firstErrorMessage(props.checks);
  return (
    <Fragment>
      <Label className="a2ui-leaf m-2 flex items-center gap-3">
        <Slider
          min={props.min}
          max={props.max}
          value={[props.value]}
          onValueChange={(v) => {
            const p = boundPath(ctx);
            if (p && typeof v[0] === 'number') ctx.set(p, v[0]);
          }}
          className="w-40"
        />
        <span className="text-sm tabular-nums">{props.value}</span>
      </Label>
      {error && <p className="text-destructive text-sm mt-1 ml-2">{error}</p>}
    </Fragment>
  );
}
