import { usePreferences } from "../context/preferences";
import { isWorldCategory } from "../lib/catalog";
import { WORLDS, worldName } from "../lib/worlds";
import type { Category } from "../types/api";

/** <option>s for a category <select>, grouped under their parent (worlds first). */
export default function CategoryOptions({ categories, exclude }: { categories: Category[]; exclude?: number }) {
    const { t } = usePreferences();

    const label = (category: Category) => {
        const world = WORLDS.find((entry) => entry.slug === category.slug);
        return world ? t(worldName(world.key)) : category.name;
    };

    const parents = categories
        .filter((category) => category.parent_id === null && category.id !== exclude)
        .sort((a, b) => Number(isWorldCategory(b)) - Number(isWorldCategory(a)) || a.name.localeCompare(b.name));

    return (
        <>
            {parents.map((parent) => {
                const children = categories.filter((category) => category.parent_id === parent.id && category.id !== exclude);

                return children.length === 0
                    ? <option key={parent.id} value={parent.id}>{label(parent)}</option>
                    : (
                        <optgroup key={parent.id} label={label(parent)}>
                            <option value={parent.id}>{label(parent)}</option>
                            {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
                        </optgroup>
                    );
            })}
        </>
    );
}
