/**
 * Helpers for composing context-aware breadcrumb trails.
 *
 * The breadcrumb trail records how a user actually arrived at a detail page.
 * It is written synchronously in an entry-point link's click handler — before
 * navigation — because the click site is the only place where both the current
 * page's ancestry and the destination path are known together.
 *
 * @typedef {import("../sessionUISlice").BreadcrumbAncestor} BreadcrumbAncestor
 * @typedef {import("../sessionUISlice").BreadcrumbTrail} BreadcrumbTrail
 */

/**
 * Canonical list-page crumbs, matching the labels used by the route
 * `handle.crumb` fallbacks. Used as the first ancestor for each drill-down and
 * as the `fallbackCrumb` when a detail page has no matching stored trail.
 * @type {Record<string, BreadcrumbAncestor>}
 */
export const LIST_CRUMBS = {
    portfolios: { label: "Portfolios", to: "/portfolios" },
    agreements: { label: "Agreements", to: "/agreements" },
    cans: { label: "CANs", to: "/cans" },
    budgetLines: { label: "Budget Lines", to: "/budget-lines" }
};

/**
 * Decide whether a stored trail applies to the current location.
 *
 * Matches when the current pathname is the trail's target base path OR a
 * sub-route (tab) beneath it — so the trail survives detail-page tab
 * navigation — but never a sibling resource (e.g. "/cans/12" must not match a
 * trail keyed to "/cans/1").
 *
 * @param {BreadcrumbTrail | null | undefined} trail
 * @param {string} pathname - The current location pathname.
 * @returns {boolean}
 */
export const trailMatchesPath = (trail, pathname) => {
    if (!trail?.targetPath || !pathname) return false;
    const base = trail.targetPath;
    return pathname === base || pathname.startsWith(base + "/");
};

/**
 * Resolve the ancestor list a detail page should pass to the entry-point links
 * it renders. If a stored trail applies to the current location, the page's
 * ancestors are that trail's ancestors plus the page's own crumb; otherwise
 * the page falls back to its route-based crumb only.
 *
 * @param {Object} params
 * @param {BreadcrumbTrail | null | undefined} params.trail - The stored trail.
 * @param {string} params.pathname - The current location pathname.
 * @param {BreadcrumbAncestor} params.ownCrumb - The current page's own crumb.
 * @param {BreadcrumbAncestor} params.fallbackCrumb - The route-hierarchy crumb to use when no trail applies (e.g. the "CANs" list link).
 * @returns {BreadcrumbAncestor[]} Ancestors to hand to child links.
 */
export const resolveAncestryForChildren = ({ trail, pathname, ownCrumb, fallbackCrumb }) => {
    if (trailMatchesPath(trail, pathname)) {
        return [...trail.ancestors, ownCrumb];
    }
    return [fallbackCrumb, ownCrumb];
};
