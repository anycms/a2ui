import type { ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { DividerProps } from '@anycms/a2ui-core';
import { Separator } from '../ui/separator';

export function DividerView({ props }: ComponentViewProps<DividerProps>): ReactNode {
  return (
    <Separator
      className="a2ui-leaf m-2"
      orientation={props.axis === 'vertical' ? 'vertical' : 'horizontal'}
    />
  );
}
