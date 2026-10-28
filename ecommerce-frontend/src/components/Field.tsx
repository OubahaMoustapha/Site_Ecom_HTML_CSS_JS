import { useId, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";

export type FieldChange = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    label: string;
    error?: string;
    /** Guidance shown under the input (e.g. password rules). */
    hint?: string;
    multiline?: boolean;
    onChange?: (event: FieldChange) => void;
}

export default function Field({ label, error, hint, multiline = false, onChange, ...input }: Props) {
    const id = useId();
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;

    const shared = {
        id,
        name: input.name,
        value: input.value,
        onChange,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
    };

    return (
        <div className={`field${error ? " field--error" : ""}`}>
            <label htmlFor={id}>{label}</label>
            {multiline ? <textarea {...shared} rows={3} /> : <input {...input} {...shared} />}
            {hint && !error && <p id={hintId} className="field__hint">{hint}</p>}
            {error && <p id={errorId} className="field__error">{error}</p>}
        </div>
    );
}

interface SelectProps {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    error?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    children: ReactNode;
}

export function SelectField({ label, value, onChange, error, hint, required, disabled, children }: SelectProps) {
    const id = useId();
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;

    return (
        <div className={`field${error ? " field--error" : ""}`}>
            <label htmlFor={id}>{label}</label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
            >
                {children}
            </select>
            {hint && !error && <p id={hintId} className="field__hint">{hint}</p>}
            {error && <p id={errorId} className="field__error">{error}</p>}
        </div>
    );
}

export function CheckField({ label, checked, onChange, hint, disabled }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    hint?: string;
    disabled?: boolean;
}) {
    return (
        <label className="check-field">
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
            <span>
                <strong>{label}</strong>
                {hint && <small className="muted">{hint}</small>}
            </span>
        </label>
    );
}
