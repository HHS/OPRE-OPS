import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { resolveAncestryForChildren } from "../helpers/breadcrumb.helpers";
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

/**
 * Resolves the ancestry a detail page should hand to the entry-point links it
 * renders (see `resolveAncestryForChildren`), reading the stored trail and the
 * current location.
 *
 * @param {Object} params
 * @param {import("../sessionUISlice").BreadcrumbAncestor} params.ownCrumb - The current page's own crumb.
 * @param {import("../sessionUISlice").BreadcrumbAncestor} params.fallbackCrumb - The route-hierarchy crumb used when no trail applies.
 * @returns {import("../sessionUISlice").BreadcrumbAncestor[]}
 */
export const useAncestryForChildren = ({ ownCrumb, fallbackCrumb }) => {
    const { pathname } = useLocation();
    const trail = useSelector((state) => state.sessionUI?.navContext?.trail);
    return resolveAncestryForChildren({ trail, pathname, ownCrumb, fallbackCrumb });
};
