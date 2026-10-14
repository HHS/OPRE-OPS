// Module-level cache (not React/Redux state): tracks whether a user has already been
// classified "first visit" vs "returning" for the homepage welcome message, scoped to
// the lifetime of this browser tab (it only resets on a hard reload). It lives here, in
// a plain shared module, rather than inside the useWelcomeMessage hook so that auth's
// `logout` reducer can invalidate a user's entry synchronously as part of the logout
// action itself — reducers run before any subsequent re-render or route change, so
// invalidation doesn't depend on whether a React effect fires before a component
// unmounts.
const visitSessionCache = new Map();

export const hasVisitClassification = (userId) => visitSessionCache.has(userId);

export const getVisitClassification = (userId) => visitSessionCache.get(userId);

export const setVisitClassification = (userId, isReturning) => visitSessionCache.set(userId, isReturning);

// Called on logout so the next login (even same-tab, no reload) re-reads localStorage
// fresh instead of reusing a stale classification cached earlier in this tab session.
export const invalidateVisitClassification = (userId) => visitSessionCache.delete(userId);

// Test-only: clears every entry so test cases that reuse a user id don't leak a cached
// classification into one another. Not used by application code.
export const __resetVisitSessionCache = () => visitSessionCache.clear();
