import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

function Select(props: SelectProps) {
	return <select {...props} />;
}

export default Select;