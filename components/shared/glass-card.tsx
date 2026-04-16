import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "glass-panel border-accent-border/70 bg-[rgba(35,39,61,0.55)] shadow-glow transition-colors hover:border-accent-border",
        className
      )}
    >
      {children}
    </div>
  );
}

