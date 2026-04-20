"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />;
}

function PopoverPositioner({
  className,
  ...props
}: PopoverPrimitive.Positioner.Props) {
  return (
    <PopoverPrimitive.Positioner
      data-slot="popover-positioner"
      className={cn("z-[250] outline-none", className)}
      {...props}
    />
  );
}

function PopoverContent({
  className,
  ...props
}: PopoverPrimitive.Popup.Props) {
  return (
    <PopoverPortal>
      <PopoverPositioner sideOffset={8} align="end">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "glass-strong w-[min(520px,92vw)] rounded-2xl border border-border p-3 text-tp-primary shadow-glow outline-none",
            className
          )}
          {...props}
        />
      </PopoverPositioner>
    </PopoverPortal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };

