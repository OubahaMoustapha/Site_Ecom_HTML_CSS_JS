import type { HTMLAttributes, ReactNode } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

function Badge({ children, ...props }: BadgeProps) {
  return <span {...props}>{children}</span>;
}

export default Badge;