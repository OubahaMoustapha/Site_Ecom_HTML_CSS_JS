import { usePreferences } from "../context/preferences";
import Icon from "./icons";

interface Props {
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
}

export default function QtyStepper({ value, min = 0, max = Infinity, onChange }: Props) {
    const { t } = usePreferences();

    return (
        <div className="stepper" role="group" aria-label={t("product.quantity")}>
            <button
                type="button"
                className="stepper__btn"
                onClick={() => onChange(value - 1)}
                disabled={value <= min}
                aria-label="−"
            >
                <Icon name="minus" size={16} />
            </button>
            <span className="stepper__value" aria-live="polite">{value}</span>
            <button
                type="button"
                className="stepper__btn stepper__btn--plus"
                onClick={() => onChange(value + 1)}
                disabled={value >= max}
                aria-label="+"
            >
                <Icon name="plus" size={16} />
            </button>
        </div>
    );
}
