import type { ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { ImageProps } from '@anycms/a2ui-core';
import { cn } from '../lib/utils';
import { IMAGE_FIT, IMAGE_VARIANT } from '../variants';

export function ImageView({ props }: ComponentViewProps<ImageProps>): ReactNode {
  return (
    <img
      className={cn(
        'a2ui-leaf m-2',
        IMAGE_FIT[props.fit ?? 'fill'],
        IMAGE_VARIANT[props.variant ?? 'mediumFeature'],
      )}
      src={props.url}
      alt={props.description ?? ''}
    />
  );
}
