import { type ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { SliderProps } from '@anycms/a2ui-core';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { boundPath } from '../bind';

export function SliderView({ props, ctx }: ComponentViewProps<SliderProps>): ReactNode {
  return (
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
  );
}
