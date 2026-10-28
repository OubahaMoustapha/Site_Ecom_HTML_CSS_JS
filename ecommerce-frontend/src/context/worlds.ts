import { createContext, useContext } from "react";
import type { WorldKey, WorldTree } from "../lib/worlds";

export interface WorldsValue {
    trees: WorldTree[];
    ready: boolean;
    /** Set when the categories could not be loaded; `reload` tries again. */
    error: unknown;
    reload: () => void;
    worldOf: (categoryId: number | null) => WorldKey | null;
    treeOf: (key: WorldKey) => WorldTree | undefined;
}

export const WorldsContext = createContext<WorldsValue | null>(null);

export function useWorlds() {
    const value = useContext(WorldsContext);

    if (!value) {
        throw new Error("useWorlds must be used inside WorldsProvider");
    }

    return value;
}
