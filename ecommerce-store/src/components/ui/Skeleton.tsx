import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

function Skeleton(props: SkeletonProps) {
  return <div aria-hidden="true" {...props} />;
}

export default Skeleton;