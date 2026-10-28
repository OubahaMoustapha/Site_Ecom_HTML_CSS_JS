import { useMemo, type ReactNode } from "react";
import { useAsync } from "../hooks/useAsync";
import { loadWorldTrees, worldOfCategory, type WorldKey } from "../lib/worlds";
import { WorldsContext } from "./worlds";

export default function WorldsProvider({ children }: { children: ReactNode }) {
    const { data, error, reload } = useAsync(loadWorldTrees);

    const value = useMemo(() => {
        const trees = data ?? [];

        return {
            trees,
            ready: data !== undefined,
            error,
            reload,
            worldOf: (categoryId: number | null) => worldOfCategory(trees, categoryId),
            treeOf: (key: WorldKey) => trees.find((tree) => tree.world.key === key),
        };
    }, [data, error, reload]);

    return <WorldsContext.Provider value={value}>{children}</WorldsContext.Provider>;
}
