import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary";
};

export function Button({
  asChild = false,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ember focus:ring-offset-2",
        variant === "primary"
          ? "bg-ink text-white hover:bg-ink/90"
          : "border border-ink/10 bg-white text-ink hover:bg-skyglass",
        className,
      )}
      {...props}
    />
  );
}
