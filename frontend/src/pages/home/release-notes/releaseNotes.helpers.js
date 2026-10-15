import { RELEASE_NOTES_TYPES } from "./constants";

/**
 * @typedef {Object} ReleaseTotals
 * @property {number} totalReleaseChanges - Total number of changes in the release.
 * @property {number} totalNewFeatures - Number of "New Feature" changes.
 * @property {number} totalFixes - Number of "Fixes" changes.
 * @property {number} totalImprovements - Number of "Improvements" changes.
 */

/**
 * Compute the change-count totals for a single release. Tolerates a release that
 * is missing its `changes` array (returns all zeros) so callers don't need their
 * own guards.
 * @param {{changes?: Array<{type: string}>}} [release] - A release entry from the release-notes data.
 * @returns {ReleaseTotals} The per-category and total change counts.
 */
export const getReleaseTotals = (release) => {
    const changes = release?.changes ?? [];
    const countOf = (type) => changes.filter((change) => change.type === type).length;
    return {
        totalReleaseChanges: changes.length,
        totalNewFeatures: countOf(RELEASE_NOTES_TYPES.NEW_FEATURE),
        totalFixes: countOf(RELEASE_NOTES_TYPES.FIXES),
        totalImprovements: countOf(RELEASE_NOTES_TYPES.IMPROVEMENTS)
    };
};
