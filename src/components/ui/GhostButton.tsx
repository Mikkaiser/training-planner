"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  large?: boolean;
}

export function GhostButton({ className, children, large = false, type = "button", ...props }: GhostButtonProps) {
  return (
    <button type={type} className={cn("tp-ghost", large && "tp-ghost-lg", className)} {...props}>
      <Plus size={14} />
      {children}
    </button>
  );
}
