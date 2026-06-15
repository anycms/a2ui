import { Fragment, type ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { ListProps } from '@anycms/a2ui-core';
import { cn } from '../lib/utils';
import { LIST_DIRECTION } from '../variants';

export function ListView({ props, buildChild }: ComponentViewProps<ListProps>): ReactNode {
  return (
    <div className={cn('a2ui-list', LIST_DIRECTION[props.direction] ?? LIST_DIRECTION.vertical)}>
      {props.children.map((c, i) => <Fragment key={i}>{buildChild(c)}</Fragment>)}
    </div>
  );
}
