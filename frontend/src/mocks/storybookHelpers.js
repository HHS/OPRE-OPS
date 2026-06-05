/**
 * Build a single RTK Query cache entry under the key format that RTK Query
 * uses internally (`${endpointName}(${JSON.stringify(args, sortedKeys)})`),
 * so it can be spread into `preloadedState[opsApi.reducerPath].queries`.
 *
 * @param {string} endpointName - The RTK Query endpoint name (e.g. "getCanFunding").
 * @param {Object} args - The hook args object (e.g. `{ id: 1, fiscalYear: 2025 }`).
 * @param {*} [data] - The fulfilled response payload. Required for `fulfilled`.
 * @param {"fulfilled" | "pending" | "rejected"} [status="fulfilled"]
 * @returns {Object} An object `{ [cacheKey]: entry }` ready to merge under `queries`.
 */
export const rtkQueryEntry = (endpointName, args, data, status = "fulfilled") => {
    const sortedArgs = Object.keys(args)
        .sort()
        .reduce((acc, key) => {
            acc[key] = args[key];
            return acc;
        }, {});
    const cacheKey = `${endpointName}(${JSON.stringify(sortedArgs)})`;
    const entry = {
        status,
        endpointName,
        requestId: "storybook-fixture",
        originalArgs: args,
        startedTimeStamp: Date.now()
    };
    if (status === "fulfilled") {
        entry.data = data;
        entry.fulfilledTimeStamp = Date.now();
    }
    return { [cacheKey]: entry };
};

/**
 * Build a `parameters.store.preloadedState` block that seeds the `opsApi`
 * RTK Query slice with one or more cache entries. Includes the default
 * `config` shape so middleware behaves consistently.
 *
 * @param {Object} queries - Cache entries keyed by RTK Query cache key.
 *   Typically built by spreading `rtkQueryEntry(...)` calls.
 * @returns {Object} `{ parameters: { store: { preloadedState: { opsApi: {...} } } } }`
 */
export const seedOpsApi = (queries) => ({
    parameters: {
        store: {
            preloadedState: {
                opsApi: {
                    queries,
                    mutations: {},
                    provided: {},
                    subscriptions: {},
                    config: {
                        online: true,
                        focused: true,
                        middlewareRegistered: true,
                        refetchOnFocus: false,
                        refetchOnReconnect: false,
                        refetchOnMountOrArgChange: false,
                        keepUnusedDataFor: 60,
                        reducerPath: "opsApi",
                        invalidationBehavior: "delayed"
                    }
                }
            }
        }
    }
});
