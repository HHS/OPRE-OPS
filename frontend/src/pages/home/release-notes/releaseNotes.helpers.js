import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { RELEASE_NOTES_COUNT_LABELS } from "./constants";

/**
 * @typedef {Object} ReleaseChange
 * @property {string} id - Unique id for the change.
 * @property {string} subject - Short title of the change.
 * @property {string} type - One of RELEASE_NOTES_TYPES.
 * @property {string} description - Detailed description of the change.
 */

/**
 * @typedef {Object} Release
 * @property {string} releaseDate - ISO date string, e.g. "2026-09-11".
 * @property {string} version - Semantic version of the release.
 * @property {ReleaseChange[]} changes - Changes shipped in the release.
 */

/**
 * @typedef {Object} ReleaseChangeCount
 * @property {string} type - One of RELEASE_NOTES_TYPES.
 * @property {number} count - Number of changes of this type.
 * @property {string} label - Pluralized label, e.g. "4 New Features".
 */

/**
 * @typedef {Object} ReleaseSummary
 * @property {string} version - Semantic version of the release.
 * @property {string|null} releaseDate - Release date formatted as MMMM D, YYYY.
 * @property {number} totalChanges - Total number of changes in the release.
 * @property {ReleaseChangeCount[]} changeCounts - Per-type counts, excluding types with no changes.
 */

/**
 * Summarizes a release for display in the release summary card.
 * @param {Release} [release] - The release to summarize.
 * @returns {ReleaseSummary|null} The summary, or null when no release is given.
 */
export const summarizeRelease = (release) => {
    if (!release) return null;

    const changes = release.changes ?? [];
    const changeCounts = Object.entries(RELEASE_NOTES_COUNT_LABELS)
        .map(([type, [singular, plural]]) => {
            const count = changes.filter((change) => change.type === type).length;
            return { type, count, label: `${count} ${count === 1 ? singular : plural}` };
        })
        .filter(({ count }) => count > 0);

    return {
        version: release.version,
        releaseDate: formatDateToMonthDayYear(release.releaseDate),
        totalChanges: changes.length,
        changeCounts
    };
};
