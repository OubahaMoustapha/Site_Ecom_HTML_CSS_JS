import type { InputHTMLAttributes } from "react";

type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function Radio(props: RadioProps) {
  return <input type="radio" {...props} />;
}

export default Radio;