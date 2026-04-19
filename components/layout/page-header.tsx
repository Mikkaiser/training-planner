import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  actionIcon,
  className,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  /** When set, the primary action is a Next.js client navigation link. */
  actionHref?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  className?: string;
}) {
  const showAction = Boolean(actionLabel);

  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-end", className)}>
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-tp-primary">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-tp-secondary">{subtitle}</p>
        ) : null}
      </div>
      {showAction && actionHref ? (
        <Link
          href={actionHref}
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "md:w-auto"
          )}
        >
          {actionIcon ? <span className="mr-2">{actionIcon}</span> : null}
          {actionLabel}
        </Link>
      ) : showAction ? (
        <Button onClick={onAction} className="md:w-auto" disabled={!onAction}>
          {actionIcon ? <span className="mr-2">{actionIcon}</span> : null}
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
