import type { HTMLAttributes, ReactNode } from "react";

type DropdownProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

function Dropdown({ children, ...props }: DropdownProps) {
  return <div {...props}>{children}</div>;
}

export default Dropdown;