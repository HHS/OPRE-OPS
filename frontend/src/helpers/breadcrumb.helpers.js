/**
 * Helpers for composing context-aware breadcrumb trails.
 *
 * The breadcrumb trail shows how a user actually arrived at a detail page.
 * Entry-point links carry it as React Router location state (see
 * `buildTrailState`), so each history entry keeps its own trail: it survives
 * browser Back/Forward and refresh, and a page reached any other way (direct
 * URL, notification, redirect after save) has no trail and falls back to the
 * route hierarchy instead of showing a stale one.
 *
 * @typedef {Object} BreadcrumbAncestor
 * @property {string} label - The crumb text.
 * @property {string} to - The path the crumb links to (may include a tab sub-route and query).
 *
 * @typedef {Object} BreadcrumbTrail
 * @property {string} targetPath - Destination path the trail applies to (e.g. "/agreements/123").
 * @property {BreadcrumbAncestor[]} ancestors - Crumbs shown before the leaf, in order.
 */

/** Location-state key under which a link carries its breadcrumb trail. */
const TRAIL_STATE_KEY = "breadcrumbTrail";

/**
 * Wrap a trail as location state.
 *
 * @param {BreadcrumbTrail} trail
 * @returns {{ breadcrumbTrail: BreadcrumbTrail }}
 */
export const toTrailState = (trail) => ({ [TRAIL_STATE_KEY]: trail });

/**
 * Build the location state an entry-point link passes to `<Link state>` so the
 * destination renders with this trail.
 *
 * @param {string} targetPath - The link's destination path.
 * @param {BreadcrumbAncestor[]} [ancestors] - Crumbs to show before the destination's leaf.
 * @returns {{ breadcrumbTrail: BreadcrumbTrail }}
 */
export const buildTrailState = (targetPath, ancestors = []) => toTrailState({ targetPath, ancestors });

/**
 * Read the breadcrumb trail carried on a location's state, if any.
 *
 * @param {unknown} locationState - `useLocation().state`.
 * @returns {BreadcrumbTrail | null}
 */
export const getTrailFromState = (locationState) => locationState?.[TRAIL_STATE_KEY] ?? null;

/**
 * Agreement pages whose route puts an action before the id
 * ("/agreements/review/:id", "/agreements/approve/:id").
 */
const AGREEMENT_ACTION_PREFIXES = ["review", "approve"];

/**
 * The resource a path belongs to: its first two segments, without query
 * (e.g. "/cans/1/spending?fy=2025" → "/cans/1"). Agreement action routes
 * belong to their agreement ("/agreements/review/1/edit" → "/agreements/1").
 *
 * @param {string} path
 * @returns {string}
 */
export const resourceBasePath = (path) => {
    const segments = path.split("?")[0].split("/").filter(Boolean);
    if (segments[0] === "agreements" && AGREEMENT_ACTION_PREFIXES.includes(segments[1])) segments.splice(1, 1);
    return "/" + segments.slice(0, 2).join("/");
};

/**
 * Canonical list-page crumbs, also used to build the route `handle.crumb`
 * fallbacks (see `listCrumb` in index.jsx). Used as the first ancestor for each
 * drill-down and as the `fallbackCrumb` when a detail page has no matching
 * carried trail.
 * @type {Record<string, BreadcrumbAncestor>}
 */
export const LIST_CRUMBS = {
    portfolios: { label: "Portfolios", to: "/portfolios" },
    agreements: { label: "Agreements", to: "/agreements" },
    cans: { label: "CANs", to: "/cans" },
    budgetLines: { label: "Budget Lines", to: "/budget-lines" },
    projects: { label: "Projects", to: "/projects" },
    procurementDashboard: { label: "Procurement Dashboard", to: "/procurement-dashboard" }
};

/** Longest visible label for a crumb before the leaf; longer labels are cut and end in an ellipsis. */
export const MAX_CRUMB_LABEL_LENGTH = 25;

/**
 * Shorten a crumb label to its first `maxLength` characters followed by "…",
 * so a trail of long names fits on one line. Shorter labels are returned as is.
 *
 * @param {string} label
 * @param {number} [maxLength]
 * @returns {string}
 */
export const truncateCrumbLabel = (label, maxLength = MAX_CRUMB_LABEL_LENGTH) =>
    label.length > maxLength ? `${label.slice(0, maxLength).trimEnd()}…` : label;

/**
 * The crumb for an agreement, used as the `parentCrumb` of the agreement's
 * change-request pages (Change BL Status, approvals, …). Labelled like the
 * agreement page's own leaf crumb so the two match.
 *
 * @param {{ id: number, name?: string } | null | undefined} agreement
 * @returns {BreadcrumbAncestor | undefined} Undefined until the agreement has loaded.
 */
export const agreementCrumb = (agreement) =>
    agreement?.id ? { label: agreement.name ?? "Agreement", to: `/agreements/${agreement.id}` } : undefined;

/**
 * Return a list crumb that links back to the list's current tab when the user
 * is on that list page (e.g. "/agreements?filter=my-agreements"), so following
 * the crumb restores the tab. Off the list page, the canonical crumb is returned.
 *
 * @param {BreadcrumbAncestor} listCrumb - A `LIST_CRUMBS` entry.
 * @param {{ pathname: string, search?: string }} location - The current location.
 * @returns {BreadcrumbAncestor}
 */
export const withListQuery = (listCrumb, { pathname, search = "" }) =>
    pathname === listCrumb.to ? { ...listCrumb, to: `${listCrumb.to}${search}` } : listCrumb;

/**
 * Whether a trail passes through a list page (e.g. a CAN reached via the
 * Projects list), whatever tab or query that list crumb carries.
 *
 * @param {BreadcrumbTrail | null | undefined} trail
 * @param {BreadcrumbAncestor} listCrumb - A `LIST_CRUMBS` entry.
 * @returns {boolean}
 */
export const trailIncludesList = (trail, listCrumb) =>
    Boolean(trail?.ancestors.some((ancestor) => ancestor.to.split("?")[0] === listCrumb.to));

/**
 * Decide whether a trail applies to the current location.
 *
 * Matches when the current pathname belongs to the same resource as the
 * trail's target — any tab of it, so a trail forwarded by tab navigation still
 * applies — but never a sibling resource (e.g. "/cans/12" must not match a
 * trail for "/cans/1").
 *
 * @param {BreadcrumbTrail | null | undefined} trail
 * @param {string} pathname - The current location pathname.
 * @returns {boolean}
 */
export const trailMatchesPath = (trail, pathname) => {
    if (!trail?.targetPath || !pathname) return false;
    return resourceBasePath(trail.targetPath) === resourceBasePath(pathname);
};

/**
 * The trail to carry when navigating from a page with `trail` to `path`.
 *
 * If `path` belongs to one of the trail's ancestors (e.g. returning from an
 * agreement's approval page to the agreement), the trail is cut just before
 * that ancestor, so the destination doesn't list itself. Otherwise the trail is
 * kept only when `path` is the same resource as the trail's target.
 *
 * @param {BreadcrumbTrail | null | undefined} trail
 * @param {string} path - The destination path.
 * @returns {BreadcrumbTrail | null}
 */
export const trailFor = (trail, path) => {
    if (!trail || !path) return null;
    const base = resourceBasePath(path);
    const index = trail.ancestors.findIndex((ancestor) => resourceBasePath(ancestor.to) === base);
    if (index >= 0) return { targetPath: path, ancestors: trail.ancestors.slice(0, index) };
    return trailMatchesPath(trail, path) ? trail : null;
};
