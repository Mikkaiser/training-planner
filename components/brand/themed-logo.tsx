"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Variant = "sidebarFull" | "headerMark" | "footerMark" | "authFull";

type Props = {
  variant: Variant;
  className?: string;
  priority?: boolean;
};

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const check = () => setIsDark(root.getAttribute("data-theme") === "dark");
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function ThemedLogo({ variant, className, priority = false }: Props) {
  const isDark = useIsDark();

  if (variant === "headerMark") {
    return (
      <Image
        src={
          isDark
            ? "/training-planner-logomark-dark-mode.png"
            : "/training-planner-logomark-white-mode.png"
        }
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
        src={
          isDark
            ? "/training-planner-logomark-dark-mode.png"
            : "/training-planner-logomark-white-mode.png"
        }
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
        src={
          isDark
            ? "/training-planner-logo-dark-mode.png"
            : "/training-planner-logo-white-mode.png"
        }
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
      src={
        isDark
          ? "/training-planner-logo-dark-mode.png"
          : "/training-planner-logo-white-mode.png"
      }
      alt="Training Planner"
      width={160}
      height={40}
      priority={priority}
      className={className}
    />
  );
}

