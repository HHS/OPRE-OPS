import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { setTrail } from "../sessionUISlice";

/**
 * Returns a click handler that records the breadcrumb trail for a destination
 * synchronously (before navigation), so the destination page renders with the
 * correct context-aware crumbs and no first-paint flicker.
 *
 * @returns {(params: { targetPath: string, ancestors?: import("../sessionUISlice").BreadcrumbAncestor[] }) => void}
 *   A function to call from an entry-point link's onClick. `ancestors` is the
 *   full ancestor list for the destination (already composed by the caller,
 *   e.g. via `resolveAncestryForChildren` on a detail page or a static list
 *   crumb + own crumb on a list row).
 */
export const useSetBreadcrumbTrail = () => {
    const dispatch = useDispatch();
    return useCallback(
        ({ targetPath, ancestors = [] }) => {
            dispatch(setTrail({ targetPath, ancestors: [...ancestors] }));
        },
        [dispatch]
    );
};
