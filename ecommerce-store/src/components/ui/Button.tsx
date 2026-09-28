import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ type = "button", ...props }: ButtonProps) {
  return <button type={type} {...props} />;
}

export default Button;