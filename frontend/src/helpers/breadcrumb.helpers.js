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
 * Build a breadcrumb trail for a destination.
 *
 * Composition rule: the new trail is the ancestry the current page already
 * carries (`parentAncestors`) plus the current page's own crumb (`ownCrumb`).
 * Because each hop stores the ancestry of the previous hop, chains compose
 * naturally across multiple drill-downs.
 *
 * @param {Object} params
 * @param {string} params.targetPath - Destination base pathname (e.g. "/agreements/123"). No trailing tab segment.
 * @param {BreadcrumbAncestor[]} [params.parentAncestors] - Ancestors of the page the link is rendered on.
 * @param {BreadcrumbAncestor | null} [params.ownCrumb] - The current page's own crumb (label + link back to it). Omit for list pages, which are already represented by their route-fallback crumb.
 * @returns {BreadcrumbTrail}
 */
export const buildTrail = ({ targetPath, parentAncestors = [], ownCrumb = null }) => {
    const ancestors = ownCrumb ? [...parentAncestors, ownCrumb] : [...parentAncestors];
    return { targetPath, ancestors };
};

/**
 * Normalize a pathname to its base (id-bearing) form by stripping any trailing
 * tab/sub-route segment. Detail pages render nested tabs whose pathname extends
 * the base path (e.g. "/cans/1/spending"); the trail is keyed to the base path
 * ("/cans/1") so it survives tab navigation.
 *
 * A "base" is the resource collection + id: two path segments (e.g. "/cans/1").
 * Anything beyond the second segment is treated as a tab/sub-route and dropped.
 *
 * @param {string} pathname
 * @returns {string} The base pathname (leading slash, at most two segments).
 */
export const toBasePath = (pathname) => {
    if (!pathname) return "";
    const segments = pathname.split("/").filter(Boolean);
    return "/" + segments.slice(0, 2).join("/");
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
