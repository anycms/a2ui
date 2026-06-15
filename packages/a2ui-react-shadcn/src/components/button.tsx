import type { ReactNode } from 'react';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { ButtonProps } from '@anycms/a2ui-core';
import { Button } from '../ui/button';
import { dispatchButtonAction, type ButtonAction } from '../bind';
import { BUTTON_VARIANT } from '../variants';

export function ButtonView({ props, ctx, buildChild }: ComponentViewProps<ButtonProps>): ReactNode {
  const variant = BUTTON_VARIANT[props.variant] ?? 'outline';
  return (
    <Button
      className="a2ui-leaf m-2"
      variant={variant}
      disabled={props.disabled}
      onClick={() => dispatchButtonAction(ctx, props.action as ButtonAction)}
    >
      {props.child ? buildChild(props.child) : null}
    </Button>
  );
}
