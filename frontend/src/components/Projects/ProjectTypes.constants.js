/**
 * Shared constants for project type display: colors, labels, and tag styles.
 * Used by ProjectCountSummaryCard, ProjectTypeSummaryCard, and Tag.jsx.
 */

export const PROJECT_TYPE_RESEARCH = "RESEARCH";
export const PROJECT_TYPE_ADMIN_SUPPORT = "ADMINISTRATIVE_AND_SUPPORT";

export const PROJECT_TYPE_LABELS = {
    [PROJECT_TYPE_RESEARCH]: "Research",
    [PROJECT_TYPE_ADMIN_SUPPORT]: "Admin & Support"
};

/**
 * Raw hex values — must be used anywhere the color is passed to a third-party
 * charting library (e.g. nivo) that cannot resolve CSS custom properties.
 */
export const PROJECT_TYPE_COLORS = {
    [PROJECT_TYPE_RESEARCH]: "#A7B9D9",
    [PROJECT_TYPE_ADMIN_SUPPORT]: "#C2486E"
};

export const PROJECT_TYPE_TEXT_COLORS = {
    [PROJECT_TYPE_RESEARCH]: "black",
    [PROJECT_TYPE_ADMIN_SUPPORT]: "white"
};

/** Named tagStyleActive keys used by Tag.jsx for hover state */
export const PROJECT_TYPE_TAG_STYLE_ACTIVE = {
    [PROJECT_TYPE_RESEARCH]: "darkOnProjectResearch",
    [PROJECT_TYPE_ADMIN_SUPPORT]: "whiteOnProjectAdminSupport"
};

/** Render order for project type tags */
export const PROJECT_TYPE_ORDER = [PROJECT_TYPE_RESEARCH, PROJECT_TYPE_ADMIN_SUPPORT];
