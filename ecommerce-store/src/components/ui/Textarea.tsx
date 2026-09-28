import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

function Textarea(props: TextareaProps) {
	return <textarea {...props} />;
}

export default Textarea;