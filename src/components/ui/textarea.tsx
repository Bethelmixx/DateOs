import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm text-fg placeholder:text-subtle",
        "transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
