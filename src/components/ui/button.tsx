import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[opacity,transform,background-color,border-color] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 active:not-disabled:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-fg hover:opacity-90",
        secondary: "bg-surface-2 text-fg border border-border hover:bg-surface",
        ghost: "text-fg hover:bg-surface-2",
        outline: "border border-border-strong bg-transparent text-fg hover:bg-surface-2",
        danger: "bg-status-red text-fg hover:opacity-90",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
