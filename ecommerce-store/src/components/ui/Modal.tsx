import type { HTMLAttributes, ReactNode } from "react";

type ModalProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

function Modal({ children, ...props }: ModalProps) {
  return (
    <div role="dialog" aria-modal="true" {...props}>
      {children}
    </div>
  );
}

export default Modal;