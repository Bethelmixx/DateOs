import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-16 text-lg" : "size-10 text-sm";
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 font-medium text-fg",
        dim,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
