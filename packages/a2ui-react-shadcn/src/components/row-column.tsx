import { Fragment, type ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { ContainerProps } from '@anycms/a2ui-core';
import { cn } from '../lib/utils';
import { ALIGN, JUSTIFY } from '../variants';

export function RowView({ props, buildChild }: ComponentViewProps<ContainerProps>): ReactNode {
  return (
    <div
      className={cn(
        'a2ui-row flex flex-row',
        JUSTIFY[props.justify ?? 'start'],
        ALIGN[props.align ?? 'start'],
      )}
    >
      {props.children.map((c, i) => <Fragment key={i}>{buildChild(c)}</Fragment>)}
    </div>
  );
}

export function ColumnView({ props, buildChild }: ComponentViewProps<ContainerProps>): ReactNode {
  return (
    <div
      className={cn(
        'a2ui-column flex flex-col',
        JUSTIFY[props.justify ?? 'start'],
        ALIGN[props.align ?? 'start'],
      )}
    >
      {props.children.map((c, i) => <Fragment key={i}>{buildChild(c)}</Fragment>)}
    </div>
  );
}
