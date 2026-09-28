import type { HTMLAttributes, ReactNode } from "react";

type ToastProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

function Toast({ children, ...props }: ToastProps) {
  return (
    <div role="status" {...props}>
      {children}
    </div>
  );
}

export default Toast;