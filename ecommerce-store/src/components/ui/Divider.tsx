import type { HTMLAttributes } from "react";

type DividerProps = HTMLAttributes<HTMLHRElement>;

function Divider(props: DividerProps) {
  return <hr {...props} />;
}

export default Divider;