import Image from "next/image";

import { cn } from "@/lib/utils";

/** Full wordmark (icon + text). */
const LOGO_FULL_SRC = "/training-planner-logo-full.png";
const LOGO_FULL_WIDTH = 842;
const LOGO_FULL_HEIGHT = 1024;

/** Icon-only mark for sidebar. */
const LOGO_MARK_SRC = "/logomark.png";
const LOGO_MARK_WIDTH = 512;
const LOGO_MARK_HEIGHT = 512;

export type TrainingPlannerLogoVariant =
  | "stacked"
  | "auth"
  | "header"
  | "sidebar"
  | "footer";

const variantClass: Record<TrainingPlannerLogoVariant, string> = {
  stacked:
    "mx-auto block h-auto w-full max-w-[min(240px,85vw)] object-contain",
  auth:
    "mx-auto block h-auto w-full max-w-[min(10.5rem,72vw)] object-contain md:max-w-[11rem]",
  header:
    "h-11 w-auto max-h-[2.75rem] object-contain object-left md:h-12 md:max-h-[3rem]",
  sidebar:
    "mx-auto block h-auto w-full max-w-[6rem] object-contain object-center md:max-w-[6.75rem]",
  footer: "h-10 w-auto object-contain opacity-95 md:h-11",
};

type Props = {
  variant?: TrainingPlannerLogoVariant;
  className?: string;
  priority?: boolean;
};

export function TrainingPlannerLogo({
  variant = "stacked",
  className,
  priority = false,
}: Props) {
  const isMark = variant === "sidebar";
  const src = isMark ? LOGO_MARK_SRC : LOGO_FULL_SRC;
  const width = isMark ? LOGO_MARK_WIDTH : LOGO_FULL_WIDTH;
  const height = isMark ? LOGO_MARK_HEIGHT : LOGO_FULL_HEIGHT;

  return (
    <Image
      src={src}
      alt="Training Planner"
      width={width}
      height={height}
      priority={priority}
      sizes={
        variant === "stacked"
          ? "(max-width: 768px) 85vw, 240px"
          : variant === "auth"
            ? "(max-width: 768px) 72vw, 176px"
            : variant === "header"
              ? "160px"
              : variant === "sidebar"
                ? "120px"
                : "140px"
      }
      className={cn(variantClass[variant], className)}
    />
  );
}
