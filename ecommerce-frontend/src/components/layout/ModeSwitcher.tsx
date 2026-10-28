import { MODES, usePreferences, type Mode } from "../../context/preferences";
import Icon, { type IconName } from "../icons";

const MODE_ICON: Record<Mode, IconName> = {
    day: "sun",
    dark: "moon",
    men: "male",
    women: "female",
};

export default function ModeSwitcher({ compact = false }: { compact?: boolean }) {
    const { mode, setMode, t } = usePreferences();

    return (
        <div className="modes" role="radiogroup" aria-label={t("mode.label")}>
            {MODES.map((item) => (
                <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={mode === item}
                    className={`modes__btn${mode === item ? " modes__btn--active" : ""}`}
                    onClick={() => setMode(item)}
                    title={t(`mode.${item}`)}
                >
                    <Icon name={MODE_ICON[item]} size={15} />
                    {!compact && <span>{t(`mode.${item}`)}</span>}
                </button>
            ))}
        </div>
    );
}
