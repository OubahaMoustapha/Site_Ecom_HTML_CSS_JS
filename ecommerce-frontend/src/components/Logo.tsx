import { Link } from "react-router";
import { usePreferences } from "../context/preferences";

/** Brand mark: a pearl inside a Majorelle-blue shell, with a saffron glint. */
export function LogoMark({ size = 36 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="logo__mark">
            <circle cx="20" cy="20" r="19" fill="#2B44D6" />
            <circle cx="20" cy="20" r="11" fill="#F7F3EC" />
            <circle cx="24" cy="16" r="3" fill="#F4A62A" />
            <circle cx="9" cy="31" r="1.6" fill="#16142E" />
        </svg>
    );
}

export default function Logo({ to = "/", subtitle }: { to?: string; subtitle?: string }) {
    const { t } = usePreferences();

    return (
        <Link to={to} className="logo" aria-label={t("brand.name")}>
            <LogoMark />
            <span className="logo__text">
                <span className="logo__word">{t("brand.name")}</span>
                {subtitle && <span className="logo__sub">{subtitle}</span>}
            </span>
        </Link>
    );
}
