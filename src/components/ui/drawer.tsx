import { Drawer as Vaul } from "vaul";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onOpenChange,
  children,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title: string;
}) {
  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-bg/55 transition-opacity duration-150" />
        <Vaul.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col",
            "rounded-t-2xl border border-border bg-surface shadow-[var(--shadow-panel)]",
            "outline-none",
          )}
        >
          <div className="flex justify-center pt-3">
            <div className="h-1 w-10 rounded-full bg-border-strong" />
          </div>
          <Vaul.Title className="sr-only">{title}</Vaul.Title>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
            {children}
          </div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
