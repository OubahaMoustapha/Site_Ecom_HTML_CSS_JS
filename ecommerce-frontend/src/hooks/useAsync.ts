import { useCallback, useEffect, useState } from "react";

interface Settled<T> {
    fn: () => Promise<T>;
    nonce: number;
    data?: T;
    error?: unknown;
}

/**
 * Runs an async loader and tracks its result.
 * Pass a loader memoised with useCallback: a new loader identity triggers a new load.
 */
export function useAsync<T>(fn: () => Promise<T>) {
    const [nonce, setNonce] = useState(0);
    const [state, setState] = useState<Settled<T> | null>(null);

    useEffect(() => {
        let active = true;

        fn().then(
            (data) => active && setState({ fn, nonce, data }),
            (error: unknown) => active && setState({ fn, nonce, error })
        );

        return () => {
            active = false;
        };
    }, [fn, nonce]);

    const settled = state !== null && state.fn === fn && state.nonce === nonce;

    // Keep showing the previous data while the same loader reloads.
    const sameLoader = state !== null && state.fn === fn;

    const reload = useCallback(() => setNonce((value) => value + 1), []);

    return {
        data: sameLoader ? state.data : undefined,
        error: settled ? state.error : undefined,
        loading: !settled,
        reload,
    };
}
