import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

function Card({ children, ...props }: CardProps) {
  return <div {...props}>{children}</div>;
}

export default Card;