/**
 * Return a safe in-app redirect path or "/" as a fallback.
 *
 * Post-login we read `location.state.from.pathname` and hand it to
 * `navigate(...)`. That value is attacker-influenceable — a crafted link can
 * stash any string in react-router's navigation state — so we restrict the
 * allowed shape to paths that react-router will resolve inside our own origin.
 *
 * Allowed: "/" and paths starting with "/<non-slash>…" (e.g. "/agreements/42").
 * Rejected:
 *   - Non-strings / empty strings
 *   - Protocol-relative URLs like "//evil.com"
 *   - Backslash-smuggled paths like "/\\evil.com" (some browsers normalize
 *     backslashes to forward slashes)
 *   - Absolute URLs with any scheme ("http:", "javascript:", "data:", …)
 *   - Anything that doesn't start with "/"
 *
 * @param {unknown} candidate
 * @returns {string}
 */
export const safeRedirectPath = (candidate) => {
    if (typeof candidate !== "string" || candidate.length === 0) return "/";
    if (candidate === "/") return "/";
    // Must start with a single forward slash, and the second char must not be
    // another slash or a backslash (both forms resolve offsite in some browsers).
    if (candidate[0] !== "/" || candidate[1] === "/" || candidate[1] === "\\") return "/";
    // Reject anything that parses as an absolute URL with a scheme.
    if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) return "/";
    return candidate;
};

/**
 * Return a safe query-string fragment or "" as a fallback.
 *
 * Used when forwarding `location.search` into `navigate(...)`. A well-formed
 * query string starts with "?" and contains no control characters or newline
 * injection. Anything else collapses to an empty string, which react-router
 * treats as "no query params on the resolved path."
 *
 * @param {unknown} candidate
 * @returns {string}
 */
export const safeRedirectSearch = (candidate) => {
    if (typeof candidate !== "string" || candidate.length === 0) return "";
    if (candidate[0] !== "?") return "";
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1F\x7F]/.test(candidate)) return "";
    return candidate;
};
