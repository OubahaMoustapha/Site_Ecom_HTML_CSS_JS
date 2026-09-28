import type { HTMLAttributes, ReactNode } from "react";

type DrawerProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

function Drawer({ children, ...props }: DrawerProps) {
  return (
    <aside {...props}>
      {children}
    </aside>
  );
}

export default Drawer;