import React from "react";
import { useBlocker } from "react-router-dom";

/**
 * Shared `useBlocker` + bypass-ref plumbing for this app's unsaved-changes guards.
 *
 * A ref (not state) because an intentional, already-confirmed exit can navigate
 * synchronously in the same tick (e.g. via Alert's redirectUrl effect), before a state
 * update would have propagated to the blocker's registered predicate — react-router only
 * re-registers it inside an effect.
 *
 * @param {boolean} hasChanged - Whether there are unsaved changes to guard against.
 * @returns {{ blocker: import("react-router-dom").Blocker, blockerRef: Object, isBypassingRef: Object }}
 */
export default function useBlockerWithBypassRef(hasChanged) {
    const isBypassingRef = React.useRef(false);

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !isBypassingRef.current && hasChanged && currentLocation.pathname !== nextLocation.pathname
    );

    const blockerRef = React.useRef(blocker);
    React.useEffect(() => {
        blockerRef.current = blocker;
    }, [blocker]);

    return { blocker, blockerRef, isBypassingRef };
}
