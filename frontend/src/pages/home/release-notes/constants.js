export const RELEASE_NOTES_TYPES = {
    NEW_FEATURE: "New Feature",
    FIXES: "Fixes",
    IMPROVEMENTS: "Improvements"
};

/**
 * Tag background/text utility classes for each release change type.
 * @type {Record<string, string>}
 */
export const RELEASE_NOTES_TAG_CLASSES = {
    [RELEASE_NOTES_TYPES.NEW_FEATURE]: "bg-brand-primary text-white",
    [RELEASE_NOTES_TYPES.FIXES]: "bg-brand-release-changes-fixes text-ink",
    [RELEASE_NOTES_TYPES.IMPROVEMENTS]: "bg-brand-can-budget-by-fy-graph-4 text-ink"
};

/**
 * Singular/plural labels used by the release summary card counts.
 * @type {Record<string, [string, string]>}
 */
export const RELEASE_NOTES_COUNT_LABELS = {
    [RELEASE_NOTES_TYPES.NEW_FEATURE]: ["New Feature", "New Features"],
    [RELEASE_NOTES_TYPES.FIXES]: ["Fix", "Fixes"],
    [RELEASE_NOTES_TYPES.IMPROVEMENTS]: ["Improvement", "Improvements"]
};
