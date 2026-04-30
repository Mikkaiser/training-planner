import type { CompetenceType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TagProps {
  type: CompetenceType;
}

export function Tag({ type }: TagProps) {
  const className =
    type === "Development"
      ? "tp-tag-dev"
      : type === "Testing"
        ? "tp-tag-test"
        : type === "Analysis & Design"
          ? "tp-tag-anal"
          : "tp-tag-trans";

  return <span className={cn("tp-tag", className)}>{type}</span>;
}
