"use client";

import Image from "next/image";

type Variant = "headerMark" | "footerMark" | "authFull" | "full";

type Props = {
  variant: Variant;
  className?: string;
  priority?: boolean;
};

export function ThemedLogo({ variant, className, priority = false }: Props) {
  if (variant === "headerMark") {
    return (
      <Image
        src="/training-planner-logomark-white-mode.png"
        alt="Training Planner"
        width={36}
        height={36}
        priority={priority}
        className={className}
      />
    );
  }

  if (variant === "footerMark") {
    return (
      <Image
        src="/training-planner-logomark-white-mode.png"
        alt="Training Planner"
        width={28}
        height={28}
        priority={priority}
        className={className}
      />
    );
  }

  if (variant === "authFull") {
    return (
      <Image
        src="/training-planner-logo-white-mode.png"
        alt="Training Planner"
        width={200}
        height={50}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    <Image
      src="/training-planner-logo-white-mode.png"
      alt="Training Planner"
      width={160}
      height={40}
      priority={priority}
      className={className}
    />
  );
}

