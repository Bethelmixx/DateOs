import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value }: { value: number }) {
  const clamped = Math.min(5, Math.max(1, value));
  const filled = Math.round(clamped);
  return (
    <div className="flex items-center gap-0.5" aria-label={`Reputación ${clamped.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < filled ? "fill-fg text-fg" : "fill-transparent text-subtle",
          )}
        />
      ))}
      <span className="ml-1 text-xs tabular-nums text-muted">{clamped.toFixed(1)}</span>
    </div>
  );
}
