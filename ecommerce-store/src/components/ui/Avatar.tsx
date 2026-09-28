import type { ImgHTMLAttributes } from "react";

type AvatarProps = ImgHTMLAttributes<HTMLImageElement>;

function Avatar(props: AvatarProps) {
  return <img {...props} alt={props.alt ?? ""} />;
}

export default Avatar;