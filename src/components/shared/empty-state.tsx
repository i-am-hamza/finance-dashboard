import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  message: string;
  cta?: {
    label: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ message, cta, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16 text-center",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">{message}</p>

      {cta && (
        <Button size="sm" onClick={cta.onClick} className="rounded-lg">
          {cta.label}
        </Button>
      )}
    </div>
  );
}
