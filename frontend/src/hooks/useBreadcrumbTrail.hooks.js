import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    buildTrailState,
    getTrailFromState,
    LIST_CRUMBS,
    toTrailState,
    trailFor,
    trailMatchesPath,
    withListQuery
} from "../helpers/breadcrumb.helpers";

/**
 * @typedef {import("../helpers/breadcrumb.helpers").BreadcrumbAncestor} BreadcrumbAncestor
 * @typedef {import("../helpers/breadcrumb.helpers").BreadcrumbTrail} BreadcrumbTrail
 */

/**
 * The breadcrumb trail carried on the current location, when it applies to the
 * current path (see `trailMatchesPath`). A trail with no ancestors counts as no
 * trail, so the page falls back to the route hierarchy instead of rendering
 * just "Home > <page>".
 *
 * @returns {BreadcrumbTrail | null}
 */
export const useBreadcrumbTrail = () => {
    const { pathname, state } = useLocation();
    const trail = getTrailFromState(state);
    return trail?.ancestors?.length && trailMatchesPath(trail, pathname) ? trail : null;
};

/**
 * Location state that carries the current trail, for `<Link state>` /
 * `<Navigate state>` to another page of the same resource (e.g. a tab).
 * Imperative navigation should use `useTrailNavigate` instead.
 *
 * @returns {{ breadcrumbTrail: BreadcrumbTrail } | undefined}
 */
export const useForwardedTrailState = () => {
    const trail = useBreadcrumbTrail();
    return trail ? toTrailState(trail) : undefined;
};

/**
 * `useNavigate`, but navigating to another page of the same resource (a tab,
 * an edit flow, a redirect back) carries the current breadcrumb trail along
 * (see `trailFor`). Calls with an explicit `state`, numeric deltas, and
 * navigation elsewhere pass through unchanged.
 *
 * @returns {(to: string | number, options?: import("react-router-dom").NavigateOptions) => void}
 */
export const useTrailNavigate = () => {
    const navigate = useNavigate();
    const trail = useBreadcrumbTrail();
    return useCallback(
        (to, options) => {
            const nextTrail = typeof to === "string" && options?.state === undefined ? trailFor(trail, to) : null;
            if (!nextTrail) return options === undefined ? navigate(to) : navigate(to, options);
            return navigate(to, { ...options, state: toTrailState(nextTrail) });
        },
        [navigate, trail]
    );
};

/**
 * The ancestry a detail page hands to the entry-point links it renders: the
 * carried trail's ancestors (or `fallbackCrumb` when there is none) plus the
 * page's own crumb.
 *
 * The own crumb links to the current tab (pathname), with `?fy=` when a
 * `fiscalYear` is given, so following it back restores both; pass `to` to
 * link elsewhere.
 *
 * @param {Object} params
 * @param {{ label: string, to?: string, fiscalYear?: number | null }} params.ownCrumb - The current page's own crumb.
 * @param {BreadcrumbAncestor} params.fallbackCrumb - The route-hierarchy crumb used when no trail applies.
 * @returns {BreadcrumbAncestor[]}
 */
export const useAncestryForChildren = ({ ownCrumb, fallbackCrumb }) => {
    const { pathname } = useLocation();
    const trail = useBreadcrumbTrail();
    const to = ownCrumb.to ?? (ownCrumb.fiscalYear ? `${pathname}?fy=${ownCrumb.fiscalYear}` : pathname);
    return [...(trail?.ancestors ?? [fallbackCrumb]), { label: ownCrumb.label, to }];
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

/**
 * Build location state for links from a list page's rows: each destination's
 * trail is the list's crumb (see `useListCrumb`).
 *
 * @param {keyof typeof LIST_CRUMBS} listKey
 * @returns {(targetPath: string) => { breadcrumbTrail: BreadcrumbTrail }}
 */
export const useListTrailState = (listKey) => {
    const listCrumb = useListCrumb(listKey);
    return (targetPath) => buildTrailState(targetPath, [listCrumb]);
};
