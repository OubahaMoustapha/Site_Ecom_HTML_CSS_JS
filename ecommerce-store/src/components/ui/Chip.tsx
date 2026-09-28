import type { HTMLAttributes, ReactNode } from "react";

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

function Chip({ children, ...props }: ChipProps) {
  return <span {...props}>{children}</span>;
}

export default Chip;