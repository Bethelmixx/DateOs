import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "red" | "yellow" | "green" | "primary";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
        tone === "neutral" && "bg-surface-2 text-muted",
        tone === "red" && "bg-status-red/15 text-status-red",
        tone === "yellow" && "bg-status-yellow/15 text-status-yellow",
        tone === "green" && "bg-status-green/15 text-status-green",
        tone === "primary" && "bg-primary/15 text-primary",
        className,
      )}
      {...props}
    />
  );
}
