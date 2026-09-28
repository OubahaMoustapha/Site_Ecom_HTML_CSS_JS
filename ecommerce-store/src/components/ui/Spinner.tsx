import type { HTMLAttributes } from "react";

type SpinnerProps = HTMLAttributes<HTMLDivElement>;

function Spinner(props: SpinnerProps) {
  return (
    <div role="status" aria-label="Loading" {...props} />
  );
}

export default Spinner;