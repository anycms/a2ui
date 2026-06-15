import { useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { ModalProps } from '@anycms/a2ui-core';

export function ModalView({ props, buildChild }: ComponentViewProps<ModalProps>): ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span className="a2ui-leaf inline-flex cursor-pointer">
          {props.trigger ? buildChild(props.trigger) : null}
        </span>
      </DialogTrigger>
      <DialogContent>
        {props.content ? buildChild(props.content) : null}
      </DialogContent>
    </Dialog>
  );
}
