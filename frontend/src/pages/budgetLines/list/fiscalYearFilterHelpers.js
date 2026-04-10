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
// APPROACH A: "All" as Default (Current PR #5483)
// ============================================

/**
 * Derive dropdown display value from filter state (Approach A)
 * @param {Array|null} fiscalYears - Filter state
 * @returns {string|number} - Dropdown value ("All", "Multi", or year number)
 */
export const deriveDropdownValueApproachA = (fiscalYears) => {
    if (fiscalYears === null) return "All"; // null = "All FYs"
    if (!fiscalYears || fiscalYears.length === 0) return getCurrentFiscalYear(); // fallback
    if (fiscalYears.length === 1) return fiscalYears[0].id;
    return "Multi"; // display only for multiple years
};

/**
 * Resolve fiscal years for API query (Approach A)
 * @param {Array|null} fiscalYears - Filter state
 * @returns {Array|null} - Resolved fiscal years for API
 */
export const resolveForAPIApproachA = (fiscalYears) => {
    if (fiscalYears === null) return null; // "All" → no filter
    if (!fiscalYears || fiscalYears.length === 0) {
        // Fallback to current FY
        const currentFY = getCurrentFiscalYear();
        return [{ id: currentFY, title: currentFY }];
    }
    return fiscalYears;
};

/**
 * Derive filter tags from filter state (Approach A)
 * @param {Array|null} fiscalYears - Filter state
 * @returns {Array} - Tag objects for display
 */
export const deriveTagsApproachA = (fiscalYears) => {
    if (fiscalYears === null) return []; // "All" = no tags
    if (!Array.isArray(fiscalYears)) return [];
    return fiscalYears.map((fy) => {
        const titleStr = fy.title.toString();
        const tagText = titleStr.startsWith("FY ") ? titleStr : `FY ${fy.title}`;
        return {
            tagText,
            filter: "fiscalYears"
        };
    });
};

/**
 * Get initial filter state (Approach A)
 * @returns {Array} - Initial fiscal years filter
 */
export const getInitialStateApproachA = () => {
    const currentFY = getCurrentFiscalYear();
    return [{ id: currentFY, title: currentFY }]; // Default to current year
};

/**
 * Handle tag removal (Approach A)
 * @param {Array|null} fiscalYears - Current filter state
 * @param {string} tagText - Tag text to remove (e.g., "FY 2024")
 * @returns {Array|null} - Updated fiscal years filter
 */
export const handleTagRemovalApproachA = (fiscalYears, tagText) => {
    if (!Array.isArray(fiscalYears)) return null;
    const yearValue = Number(tagText.replace("FY ", ""));
    const remaining = fiscalYears.filter((fy) => {
        const fyId = typeof fy.id === "number" ? fy.id : Number(fy.id);
        return fyId !== yearValue;
    });
    // If removal leaves 0 years, set to null ("All")
    return remaining.length === 0 ? null : remaining;
};

// ============================================
// APPROACH B: Current FY as Default (UX Request)
// ============================================

/**
 * Derive dropdown display value from filter state (Approach B)
 * @param {Array|null} fiscalYears - Filter state
 * @returns {string|number} - Dropdown value ("All", "Multi", or year number)
 */
export const deriveDropdownValueApproachB = (fiscalYears) => {
    if (fiscalYears === null) return getCurrentFiscalYear(); // Default = current FY
    if (!Array.isArray(fiscalYears) || fiscalYears.length === 0) return getCurrentFiscalYear();
    if (fiscalYears.length === 1 && fiscalYears[0].id === "all") return "All"; // Explicit "All FYs"
    if (fiscalYears.length === 1) return fiscalYears[0].id;
    return "Multi"; // display only for multiple years
};

/**
 * Resolve fiscal years for API query (Approach B)
 * @param {Array|null} fiscalYears - Filter state
 * @returns {Array|null} - Resolved fiscal years for API
 */
export const resolveForAPIApproachB = (fiscalYears) => {
    if (fiscalYears === null) {
        // Default = current FY filter
        const currentFY = getCurrentFiscalYear();
        return [{ id: currentFY, title: currentFY }];
    }
    if (fiscalYears.length === 1 && fiscalYears[0].id === "all") {
        return null; // "All FYs" explicit selection = no filter
    }
    return fiscalYears;
};

/**
 * Derive filter tags from filter state (Approach B)
 * @param {Array|null} fiscalYears - Filter state
 * @returns {Array} - Tag objects for display
 */
export const deriveTagsApproachB = (fiscalYears) => {
    if (fiscalYears === null) return []; // Default = no tags
    if (!Array.isArray(fiscalYears)) return [];
    if (fiscalYears.length === 1 && fiscalYears[0].id === "all") {
        return [{ tagText: "All FYs", filter: "fiscalYears" }]; // Show "All FYs" tag
    }
    return fiscalYears.map((fy) => {
        const titleStr = fy.title.toString();
        const tagText = titleStr.startsWith("FY ") ? titleStr : `FY ${fy.title}`;
        return {
            tagText,
            filter: "fiscalYears"
        };
    });
};

/**
 * Get initial filter state (Approach B)
 * @returns {null} - Initial fiscal years filter (null = default)
 */
export const getInitialStateApproachB = () => {
    return null; // Default = no filter (will show current FY data)
};

/**
 * Handle tag removal (Approach B)
 * @param {Array|null} fiscalYears - Current filter state
 * @param {string} tagText - Tag text to remove (e.g., "FY 2024" or "All FYs")
 * @returns {Array|null} - Updated fiscal years filter
 */
export const handleTagRemovalApproachB = (fiscalYears, tagText) => {
    if (!Array.isArray(fiscalYears)) return null;

    // Removing "All FYs" tag → revert to default
    if (tagText === "All FYs") return null;

    const yearValue = Number(tagText.replace("FY ", ""));
    const remaining = fiscalYears.filter((fy) => {
        const fyId = typeof fy.id === "number" ? fy.id : Number(fy.id);
        return fyId !== yearValue;
    });
    // If removal leaves 0 years, revert to default (null)
    return remaining.length === 0 ? null : remaining;
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
            deriveDropdownValue: deriveDropdownValueApproachB,
            resolveForAPI: resolveForAPIApproachB,
            deriveTags: deriveTagsApproachB,
            getInitialState: getInitialStateApproachB,
            handleTagRemoval: handleTagRemovalApproachB
        };
    }
    return {
        deriveDropdownValue: deriveDropdownValueApproachA,
        resolveForAPI: resolveForAPIApproachA,
        deriveTags: deriveTagsApproachA,
        getInitialState: getInitialStateApproachA,
        handleTagRemoval: handleTagRemovalApproachA
    };
};
