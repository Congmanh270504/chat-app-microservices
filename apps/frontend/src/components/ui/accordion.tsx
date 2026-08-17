'use client';

import * as React from 'react';
import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function Accordion({
  className,
  type,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root> & { type?: string }) {
  return <AccordionPrimitive.Root data-slot="accordion" className={cn('w-full', className)} {...(props as any)} />;
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('border-b last:border-b-0', className)}
      {...(props as any)}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline focus-visible:outline-hidden [&[data-panel-open]>svg]:rotate-180',
          className,
        )}
        {...(props as any)}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Panel>) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className={cn(
        'overflow-hidden text-sm transition-all data-open:animate-in data-closed:animate-out',
        className,
      )}
      {...(props as any)}
    >
      <div className="pt-0 pb-4">{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
