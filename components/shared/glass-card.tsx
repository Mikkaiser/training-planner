import { cn } from "@/lib/utils";

type GlassVariant = "default" | "subtle" | "strong";

const variantClass: Record<GlassVariant, string> = {
  default: "glass",
  subtle: "glass-subtle",
  strong: "glass-strong",
};

export function GlassCard({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: GlassVariant;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(variantClass[variant], "p-[18px]", className)}>
      {children}
    </div>
  );
}
