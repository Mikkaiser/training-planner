"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "positive" | "negative";
  size?: "default" | "sm";
}

export function Button({ className, variant = "primary", size = "default", type = "button", ...props }: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "tp-btn-primary"
      : variant === "ghost"
        ? "tp-btn-ghost"
        : variant === "positive"
          ? "tp-btn-pos"
          : "tp-btn-neg";

  return <button type={type} className={cn("tp-btn", variantClass, size === "sm" && "tp-btn-sm", className)} {...props} />;
}
