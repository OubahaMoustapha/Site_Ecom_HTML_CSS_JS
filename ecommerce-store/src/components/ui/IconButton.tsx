import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	icon: ReactNode;
	"aria-label": string;
};

function IconButton({
	icon,
	type = "button",
	...props
}: IconButtonProps) {
	return (
		<button type={type} {...props}>
			{icon}
		</button>
	);
}

export default IconButton;