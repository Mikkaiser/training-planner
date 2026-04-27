import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  /** When set, the primary action is a Next.js client navigation link. */
  actionHref?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  actionIcon,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  const showAction = Boolean(actionLabel);
  const breadcrumbItems = breadcrumbs ?? [];

  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-end", className)}>
      <div className="flex-1">
        {breadcrumbItems.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs font-body">
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              return (
                <div key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
                  {item.href && !isLast ? (
                    <Link href={item.href} className="page-breadcrumb-link">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={cn(isLast ? "page-breadcrumb-current" : "page-breadcrumb-link")}>
                      {item.label}
                    </span>
                  )}
                  {!isLast ? (
                    <span className="page-breadcrumb-separator" aria-hidden>
                      ›
                    </span>
                  ) : null}
                </div>
              );
            })}
          </nav>
        ) : null}
        <h1 className="font-display text-[35px] font-bold text-tp-primary">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-[19px] text-tp-secondary">{subtitle}</p>
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
