import type { InputHTMLAttributes } from "react";

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function Switch(props: SwitchProps) {
  return <input type="checkbox" role="switch" {...props} />;
}

export default Switch;