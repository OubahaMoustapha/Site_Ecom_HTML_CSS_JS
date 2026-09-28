import type { HTMLAttributes, ReactNode } from "react";

type ErrorStateProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

function ErrorState({ children, ...props }: ErrorStateProps) {
  return (
    <div role="alert" {...props}>
      {children}
    </div>
  );
}

export default ErrorState;