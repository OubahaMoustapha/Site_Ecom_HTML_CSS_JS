import type { HTMLAttributes, ReactNode } from "react";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

function EmptyState({ children, ...props }: EmptyStateProps) {
  return <div {...props}>{children}</div>;
}

export default EmptyState;