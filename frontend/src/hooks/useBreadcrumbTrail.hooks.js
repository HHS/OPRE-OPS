import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { LIST_CRUMBS, resolveAncestryForChildren, withListQuery } from "../helpers/breadcrumb.helpers";
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
 * The page's own crumb links to the current location (tab sub-route + query)
 * unless `ownCrumb.to` is given, so following it back restores the tab the
 * user left from.
 *
 * @param {Object} params
 * @param {{ label: string, to?: string }} params.ownCrumb - The current page's own crumb.
 * @param {import("../sessionUISlice").BreadcrumbAncestor} params.fallbackCrumb - The route-hierarchy crumb used when no trail applies.
 * @returns {import("../sessionUISlice").BreadcrumbAncestor[]}
 */
export const useAncestryForChildren = ({ ownCrumb, fallbackCrumb }) => {
    const { pathname, search } = useLocation();
    const trail = useSelector((state) => state.sessionUI?.navContext?.trail);
    return resolveAncestryForChildren({
        trail,
        pathname,
        ownCrumb: { label: ownCrumb.label, to: ownCrumb.to ?? `${pathname}${search}` },
        fallbackCrumb
    });
};

/**
 * The `LIST_CRUMBS` entry for a list page, linking back to the list's current
 * tab when rendered on that list (see `withListQuery`).
 *
 * @param {keyof typeof LIST_CRUMBS} listKey
 * @returns {import("../sessionUISlice").BreadcrumbAncestor}
 */
export const useListCrumb = (listKey) => {
    const location = useLocation();
    return withListQuery(LIST_CRUMBS[listKey], location);
};
