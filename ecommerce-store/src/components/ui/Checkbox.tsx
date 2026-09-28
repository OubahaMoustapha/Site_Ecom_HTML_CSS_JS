import type { InputHTMLAttributes } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function Checkbox(props: CheckboxProps) {
  return <input type="checkbox" {...props} />;
}

export default Checkbox;