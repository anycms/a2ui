import type { ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { MediaProps } from '@anycms/a2ui-core';
import { cn } from '../lib/utils';

export function VideoView({ props }: ComponentViewProps<MediaProps>): ReactNode {
  return <video className={cn('a2ui-leaf m-2 w-full rounded-md')} src={props.url} controls />;
}

export function AudioPlayerView({ props }: ComponentViewProps<MediaProps>): ReactNode {
  return <audio className={cn('a2ui-leaf m-2 w-full')} src={props.url} controls />;
}
