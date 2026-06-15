import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { IconProps } from '@anycms/a2ui-core';
import { cn } from '../lib/utils';

/**
 * Icon view. A2UI's Icon only carries a free-form `name`; we render a generic
 * lucide glyph as a placeholder. A full name→lucide registry is a future enhancement.
 */
export function IconView({ props }: ComponentViewProps<IconProps>): ReactNode {
  return (
    <span className="a2ui-leaf m-2 inline-flex items-center" title={props.name}>
      <Sparkles className={cn('h-5 w-5 text-foreground')} />
    </span>
  );
}
