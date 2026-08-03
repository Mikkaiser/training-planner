import type { CompetenceType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TagProps {
  type: CompetenceType;
  /** The tree view abbreviates to the first word to fit a 150px column. */
  short?: boolean;
  className?: string;
}

export function competenceTagClass(type: CompetenceType): string {
  switch (type) {
    case "Development":
      return "tp-tag-dev";
    case "Testing":
      return "tp-tag-test";
    case "Analysis & Design":
      return "tp-tag-anal";
    default:
      return "tp-tag-trans";
  }
}

export function Tag({ type, short, className }: TagProps) {
  return (
    <span className={cn("tp-tag", competenceTagClass(type), className)}>{short ? type.split(" ")[0] : type}</span>
  );
}
