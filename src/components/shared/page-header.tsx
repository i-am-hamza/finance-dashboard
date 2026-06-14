import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Slot for buttons / controls rendered on the right */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-4 pb-4 pt-6 md:px-6 md:pt-8",
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        {/* Title is hidden on mobile because the TopBar already shows it */}
        <h1 className="hidden text-xl font-semibold tracking-tight text-foreground md:block">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
