// ============================================
// TEMPORARY: A/B Testing Fiscal Year Filter
// Query param: ?filterMode=explicit-all
//
// Approach A (default): "All FYs" as default, null = no filter
// Approach B (explicit-all): Current FY as default, "All FYs" explicit
//
// After UX decision, remove unused approach and toggle logic
// ============================================

import { getCurrentFiscalYear } from "../../../helpers/utils";

// ============================================
// APPROACH A: "All" as Default (Current Implementation)
// ============================================

/**
 * Get initial filter state (Approach A)
 * Note: Agreements uses separate selectedFiscalYear state, not filters.fiscalYear
 * @returns {Array} - Initial fiscal year filter (empty array)
 */
export const getInitialStateApproachA = () => {
    return []; // Empty array, selectedFiscalYear drives the filter
};

/**
 * Get initial selectedFiscalYear state (Approach A)
 * @returns {number} - Current fiscal year
 */
export const getInitialSelectedFiscalYearApproachA = () => {
    return getCurrentFiscalYear();
};

/**
 * Resolve fiscal year filter for API (Approach A)
 * @param {Array} fiscalYear - Filter state
 * @param {string|number} selectedFiscalYear - Dropdown value
 * @param {boolean} hasOtherFilters - Whether other filters are active
 * @returns {Array} - Fiscal years for API
 */
export const resolveForAPIApproachA = (fiscalYear, selectedFiscalYear, hasOtherFilters) => {
    // If explicit filters are set via filter modal, use those
    if ((fiscalYear ?? []).length > 0) {
        // "All FYs" means no fiscal year filter
        if (fiscalYear.some((fy) => fy.id === "all")) {
            return [];
        }
        return fiscalYear;
    }
    // If other filters are active but no fiscal year was selected, don't default
    if (hasOtherFilters) {
        return [];
    }
    // If "All" is selected from the page dropdown, no fiscal year filter
    if (selectedFiscalYear === "All") {
        return [];
    }
    // Otherwise, use the selected fiscal year
    return [{ id: Number(selectedFiscalYear), title: Number(selectedFiscalYear) }];
};

/**
 * Derive filter tags from filter state (Approach A)
 * @param {Array} fiscalYear - Filter state
 * @returns {Array} - Tag objects for display
 */
export const deriveTagsApproachA = (fiscalYear) => {
    if (!Array.isArray(fiscalYear) || fiscalYear.length === 0) return [];
    // Check for "All FYs" selection
    if (fiscalYear.some((fy) => fy.id === "all")) {
        return [{ tagText: "All FYs", filter: "fiscalYear" }];
    }
    return fiscalYear.map((fy) => {
        const titleStr = fy.title.toString();
        const tagText = titleStr.startsWith("FY ") ? titleStr : `FY ${fy.title}`;
        return {
            tagText,
            filter: "fiscalYear"
        };
    });
};

/**
 * Handle tag removal (Approach A)
 * @param {Array} fiscalYear - Current filter state
 * @param {string} tagText - Tag text to remove
 * @returns {Array} - Updated fiscal year filter
 */
export const handleTagRemovalApproachA = (fiscalYear, tagText) => {
    if (!Array.isArray(fiscalYear)) return [];

    // Removing "All FYs" tag → empty array
    if (tagText === "All FYs") return [];

    const yearValue = Number(tagText.replace("FY ", ""));
    const remaining = fiscalYear.filter((fy) => {
        const fyId = typeof fy.id === "number" ? fy.id : Number(fy.id);
        return fyId !== yearValue;
    });
    // Return empty array if no years left
    return remaining;
};

/**
 * Handle dropdown "All" selection (Approach A)
 * @returns {Object} - Filter update
 */
export const handleDropdownAllApproachA = () => {
    return { fiscalYear: [] }; // Empty array, dropdown handles display
};

// ============================================
// APPROACH B: Current FY as Default (UX Request)
// ============================================

/**
 * Get initial filter state (Approach B)
 * @returns {null} - null means default (current FY)
 */
export const getInitialStateApproachB = () => {
    return null; // null = default state
};

/**
 * Get initial selectedFiscalYear state (Approach B)
 * @returns {number} - Current fiscal year
 */
export const getInitialSelectedFiscalYearApproachB = () => {
    return getCurrentFiscalYear();
};

/**
 * Resolve fiscal year filter for API (Approach B)
 * Note: selectedFiscalYear and hasOtherFilters are unused in Approach B
 * but kept for consistent function signature with Approach A
 * @param {Array|null} fiscalYear - Filter state
 * @param {string|number} selectedFiscalYear - Dropdown value (unused in Approach B)
 * @param {boolean} hasOtherFilters - Whether other filters are active (unused in Approach B)
 * @returns {Array} - Fiscal years for API
 */
// eslint-disable-next-line no-unused-vars
export const resolveForAPIApproachB = (fiscalYear, selectedFiscalYear, hasOtherFilters) => {
    // null = default (use current FY)
    if (fiscalYear === null) {
        const currentFY = getCurrentFiscalYear();
        return [{ id: Number(currentFY), title: Number(currentFY) }];
    }

    // Explicit "All FYs" selection
    if (Array.isArray(fiscalYear) && fiscalYear.length === 1 && fiscalYear[0].id === "all") {
        return []; // No fiscal year filter
    }

    // Empty array after removal → revert to default
    if (Array.isArray(fiscalYear) && fiscalYear.length === 0) {
        const currentFY = getCurrentFiscalYear();
        return [{ id: Number(currentFY), title: Number(currentFY) }];
    }

    // Explicit years selected
    return fiscalYear;
};

/**
 * Derive filter tags from filter state (Approach B)
 * @param {Array|null} fiscalYear - Filter state
 * @returns {Array} - Tag objects for display
 */
export const deriveTagsApproachB = (fiscalYear) => {
    if (fiscalYear === null) return []; // Default = no tags
    if (!Array.isArray(fiscalYear) || fiscalYear.length === 0) return [];

    // Check for explicit "All FYs" selection
    if (fiscalYear.some((fy) => fy.id === "all")) {
        return [{ tagText: "All FYs", filter: "fiscalYear" }];
    }

    return fiscalYear.map((fy) => {
        const titleStr = fy.title.toString();
        const tagText = titleStr.startsWith("FY ") ? titleStr : `FY ${fy.title}`;
        return {
            tagText,
            filter: "fiscalYear"
        };
    });
};

/**
 * Handle tag removal (Approach B)
 * @param {Array|null} fiscalYear - Current filter state
 * @param {string} tagText - Tag text to remove
 * @returns {Array|null} - Updated fiscal year filter
 */
export const handleTagRemovalApproachB = (fiscalYear, tagText) => {
    if (!Array.isArray(fiscalYear)) return null;

    // Removing "All FYs" tag → revert to default
    if (tagText === "All FYs") return null;

    const yearValue = Number(tagText.replace("FY ", ""));
    const remaining = fiscalYear.filter((fy) => {
        const fyId = typeof fy.id === "number" ? fy.id : Number(fy.id);
        return fyId !== yearValue;
    });

    // If removal leaves 0 years, revert to default (null)
    return remaining.length === 0 ? null : remaining;
};

/**
 * Handle dropdown "All" selection (Approach B)
 * @returns {Object} - Filter update
 */
export const handleDropdownAllApproachB = () => {
    return { fiscalYear: [{ id: "all", title: "All FYs" }] }; // Explicit selection
};

// ============================================
// TOGGLE SELECTOR
// ============================================

/**
 * Get fiscal year helper functions based on approach
 * @param {boolean} useApproachB - Whether to use Approach B (UX requested)
 * @returns {Object} - Helper functions for the selected approach
 */
export const getFiscalYearHelpers = (useApproachB) => {
    if (useApproachB) {
        return {
            getInitialState: getInitialStateApproachB,
            getInitialSelectedFiscalYear: getInitialSelectedFiscalYearApproachB,
            resolveForAPI: resolveForAPIApproachB,
            deriveTags: deriveTagsApproachB,
            handleTagRemoval: handleTagRemovalApproachB,
            handleDropdownAll: handleDropdownAllApproachB
        };
    }
    return {
        getInitialState: getInitialStateApproachA,
        getInitialSelectedFiscalYear: getInitialSelectedFiscalYearApproachA,
        resolveForAPI: resolveForAPIApproachA,
        deriveTags: deriveTagsApproachA,
        handleTagRemoval: handleTagRemovalApproachA,
        handleDropdownAll: handleDropdownAllApproachA
    };
};
