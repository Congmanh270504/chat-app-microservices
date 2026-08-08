'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from './ui/spinner';

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isDeleting: boolean;
  actionText: string;
  title: string;
  description: string;
  onCancel?: () => void;
  cancelText?: string;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  actionText,
  title,
  description,
  onCancel,
  cancelText = 'Hủy',
}: DeleteConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isDeleting && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        // onEscapeKeyDown={(event) => {
        //   if (isDeleting) event.preventDefault();
        // }}
        // onPointerDownOutside={(event) => {
        //   if (isDeleting) event.preventDefault();
        // }}
        className="sm:max-w-120 rounded-lg p-0 gap-0"
      >
        <DialogHeader className="bg-linear-to-r from-red-500 to-rose-600 px-4 py-3 rounded-t-lg">
          <DialogTitle className="text-3xl font-bold text-white">{title}</DialogTitle>
          <DialogDescription className="text-white text-base">{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="px-6 py-4 ">
          <Button
            variant="outline"
            onClick={() => {
              if (isDeleting) return;
              onOpenChange(false);
              onCancel?.();
            }}
            disabled={isDeleting}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            variant="destructive"
            className="text-white ml-2 bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isDeleting ? <Spinner /> : actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
