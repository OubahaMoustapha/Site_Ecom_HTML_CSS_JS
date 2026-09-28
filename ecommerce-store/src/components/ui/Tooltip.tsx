import type { HTMLAttributes, ReactNode } from "react";

type TooltipProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  content: ReactNode;
};

function Tooltip({ children, content, ...props }: TooltipProps) {
  return (
    <span {...props}>
      {children}
      <span role="tooltip">{content}</span>
    </span>
  );
}

export default Tooltip;