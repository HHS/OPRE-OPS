import { useLocation } from "react-router-dom";
import {
    getTrailFromState,
    LIST_CRUMBS,
    resolveAncestryForChildren,
    TRAIL_STATE_KEY,
    trailMatchesPath,
    withListQuery
} from "../helpers/breadcrumb.helpers";

/**
 * @typedef {import("../helpers/breadcrumb.helpers").BreadcrumbAncestor} BreadcrumbAncestor
 * @typedef {import("../helpers/breadcrumb.helpers").BreadcrumbTrail} BreadcrumbTrail
 */

/**
 * The breadcrumb trail carried on the current location, when it applies to the
 * current path (see `trailMatchesPath`).
 *
 * @returns {BreadcrumbTrail | null}
 */
export const useBreadcrumbTrail = () => {
    const { pathname, state } = useLocation();
    const trail = getTrailFromState(state);
    return trailMatchesPath(trail, pathname) ? trail : null;
};

/**
 * Location state that detail-page tab navigation passes along so the trail
 * survives switching tabs (`navigate(path, { state })` / `<Link state>`).
 *
 * @returns {{ breadcrumbTrail: BreadcrumbTrail } | undefined}
 */
export const useForwardedTrailState = () => {
    const trail = useBreadcrumbTrail();
    return trail ? { [TRAIL_STATE_KEY]: trail } : undefined;
};

/**
 * Resolves the ancestry a detail page should hand to the entry-point links it
 * renders (see `resolveAncestryForChildren`), from the trail carried on the
 * current location.
 *
 * The page's own crumb links to the current location (tab sub-route + query)
 * unless `ownCrumb.to` is given, so following it back restores the tab the
 * user left from.
 *
 * @param {Object} params
 * @param {{ label: string, to?: string }} params.ownCrumb - The current page's own crumb.
 * @param {BreadcrumbAncestor} params.fallbackCrumb - The route-hierarchy crumb used when no trail applies.
 * @returns {BreadcrumbAncestor[]}
 */
export const useAncestryForChildren = ({ ownCrumb, fallbackCrumb }) => {
    const { pathname, search, state } = useLocation();
    return resolveAncestryForChildren({
        trail: getTrailFromState(state),
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
 * @returns {BreadcrumbAncestor}
 */
export const useListCrumb = (listKey) => {
    const location = useLocation();
    return withListQuery(LIST_CRUMBS[listKey], location);
};
