import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  colorVariant?: "primary" | "secondary" | "accent";
  className?: string;
}

const variantStyles = {
  primary:   { iconColor: "text-primary",   iconBg: "bg-primary/10",   value: "text-primary" },
  secondary: { iconColor: "text-secondary", iconBg: "bg-secondary/10", value: "text-secondary" },
  accent:    { iconColor: "text-accent",    iconBg: "bg-accent/10",    value: "text-accent" },
} as const;

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorVariant = "primary",
  className,
}: StatCardProps) {
  const styles = variantStyles[colorVariant];

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-800 leading-tight">{title}</p>
          {Icon && (
            <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", styles.iconBg)}>
              <Icon className={cn("h-3.5 w-3.5", styles.iconColor)} />
            </div>
          )}
        </div>
        <p className={cn("text-2xl font-bold leading-none tracking-tight", styles.value)}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-slate-500 leading-tight">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("h-28 rounded-xl bg-slate-200 animate-pulse", className)} />
  );
}
