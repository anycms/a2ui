import type { ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { CardProps } from '@anycms/a2ui-core';
import { Card, CardContent } from '../ui/card';

export function CardView({ props, buildChild }: ComponentViewProps<CardProps>): ReactNode {
  return (
    <Card className="a2ui-leaf m-2">
      <CardContent className="pt-6">{props.child ? buildChild(props.child) : null}</CardContent>
    </Card>
  );
}
