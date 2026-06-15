import type { ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { TextProps } from '@anycms/a2ui-core';
import { cn } from '../lib/utils';
import { TEXT_VARIANT } from '../variants';

export function TextView({ props }: ComponentViewProps<TextProps>): ReactNode {
  return <div className={cn('a2ui-leaf m-2', TEXT_VARIANT[props.variant] ?? TEXT_VARIANT.body)}>{props.text}</div>;
}
