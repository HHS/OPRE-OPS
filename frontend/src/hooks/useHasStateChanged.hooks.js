import React from "react";

/**
 * Custom React hook that checks if the state has changed.
 *
 * @param {Object} initialState - The initial state of the component.
 * @returns {boolean} - Returns true if the state has changed, false otherwise.
 *
 * @example
 * const hasAgreementChanged = useHasStateChanged(agreement);
 * if (hasAgreementChanged) {
 *    // Do something
 * }
 */
const useHasStateChanged = (initialState) => {
    const initialStateCopy = React.useMemo(() => {
        return { ...initialState };
    }, []);

    return JSON.stringify(initialStateCopy) !== JSON.stringify(initialState);
};

export default useHasStateChanged;
