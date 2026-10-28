import { useState, type FormEvent } from "react";
import { usePreferences } from "../../context/preferences";
import type { SortKey } from "../../lib/worlds";
import type { Category } from "../../types/api";

export interface ListingFilters {
    cat?: number;
    sort: SortKey;
    min?: number;
    max?: number;
}

const SORTS: Array<[SortKey, "listing.sort.newest" | "listing.sort.priceAsc" | "listing.sort.priceDesc" | "listing.sort.name"]> = [
    ["newest", "listing.sort.newest"],
    ["price", "listing.sort.priceAsc"],
    ["-price", "listing.sort.priceDesc"],
    ["name", "listing.sort.name"],
];

export function SortSelect({ value, onChange }: { value: SortKey; onChange: (sort: SortKey) => void }) {
    const { t } = usePreferences();

    return (
        <label className="sort-select">
            <span>{t("listing.sort")}</span>
            <select value={value} onChange={(event) => onChange(event.target.value as SortKey)}>
                {SORTS.map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}
            </select>
        </label>
    );
}

export function CategoryTabs({ categories, value, onChange, variant = "chips" }: {
    categories: Category[];
    value?: number;
    onChange: (id?: number) => void;
    variant?: "chips" | "tabs";
}) {
    const { t } = usePreferences();

    return (
        <div className={variant === "tabs" ? "tabs" : "chips chips--wrap"} role="tablist">
            <button
                type="button"
                role="tab"
                aria-selected={value === undefined}
                className={variant === "tabs" ? `tab${value === undefined ? " tab--active" : ""}` : `chip${value === undefined ? " chip--active" : ""}`}
                onClick={() => onChange(undefined)}
            >
                {t("listing.all")}
            </button>
            {categories.map((category) => (
                <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={value === category.id}
                    className={variant === "tabs" ? `tab${value === category.id ? " tab--active" : ""}` : `chip${value === category.id ? " chip--active" : ""}`}
                    onClick={() => onChange(category.id)}
                >
                    {category.name}
                </button>
            ))}
        </div>
    );
}

/** Price range filter. Keyed by the applied values so it resets when they change. */
export function PriceFilter({ min, max, onApply }: {
    min?: number;
    max?: number;
    onApply: (min?: number, max?: number) => void;
}) {
    const { t } = usePreferences();
    const [from, setFrom] = useState(min?.toString() ?? "");
    const [to, setTo] = useState(max?.toString() ?? "");

    const submit = (event: FormEvent) => {
        event.preventDefault();
        onApply(from ? Number(from) : undefined, to ? Number(to) : undefined);
    };

    return (
        <form className="price-filter" onSubmit={submit}>
            <fieldset>
                <legend>{t("listing.price")}</legend>
                <div className="price-filter__row">
                    <label>
                        <span>{t("listing.min")}</span>
                        <input type="number" min={0} inputMode="numeric" value={from} onChange={(event) => setFrom(event.target.value)} />
                    </label>
                    <label>
                        <span>{t("listing.max")}</span>
                        <input type="number" min={0} inputMode="numeric" value={to} onChange={(event) => setTo(event.target.value)} />
                    </label>
                </div>
                <button type="submit" className="btn btn--outline btn--sm">{t("listing.apply")}</button>
            </fieldset>
        </form>
    );
}
