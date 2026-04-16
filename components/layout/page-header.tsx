import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon,
  className,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-end", className)}>
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-secondary">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[rgba(244,253,217,0.65)]">{subtitle}</p>
        ) : null}
      </div>
      {actionLabel ? (
        <Button onClick={onAction} className="md:w-auto">
          {actionIcon ? <span className="mr-2">{actionIcon}</span> : null}
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

