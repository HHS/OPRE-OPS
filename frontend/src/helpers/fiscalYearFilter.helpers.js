/**
 * Shared pure helpers for fiscal-year filter logic (Model B: two-input precedence).
 *
 * These are page-agnostic — they accept only FY values, not a full `filters` object.
 * Used by Agreements list; Projects, CANs, Reporting will adopt these in follow-up PRs.
 *
 * State contract:
 *   selectedFiscalYear — the page-level dropdown value ("All" | year string). Never produces a tag.
 *   compareFYs         — the Compare Fiscal Years modal selection ({id,title}[]). The ONLY source
 *                        of FY tags; drives the dropdown display when non-empty.
 *
 * Precedence: compareFYs when non-empty, else fall back to the dropdown FY.
 */

/**
 * Returns true when compareFYs contains the "All FYs" sentinel.
 * Tolerates both lowercase "all" (emitted by FiscalYearComboBox) and uppercase "ALL"
 * (used internally by FiscalYearComboBox's option normalization).
 *
 * @param {Array<{id:number|string, title:number|string}>} compareFYs
 * @returns {boolean}
 */
export const isAllSentinel = (compareFYs) => {
    if (!Array.isArray(compareFYs)) return false;
    return compareFYs.some((fy) => fy.id === "all" || fy.id === "ALL");
};

/**
 * Normalizes a fiscal-year title to the "FY XXXX" display format.
 * Idempotent — titles that already start with "FY " are returned unchanged.
 * Fixes the double-prefix bug ("FY FY 2024") that occurs when FiscalYearComboBox
 * stores titles as "FY 2024" and the tag builder prepends another "FY ".
 *
 * @param {number|string} title
 * @returns {string}
 */
export const normalizeFYTag = (title) => {
    const str = String(title);
    return str.startsWith("FY ") ? str : `FY ${str}`;
};

/**
 * Derives the page-level FY dropdown display value from the two-input state.
 *
 * @param {string} selectedFiscalYear - The persistent dropdown value ("All" or a year string).
 * @param {Array<{id:number|string, title:number|string}>} compareFYs - Compare FYs modal selection.
 * @returns {"All" | "Multi" | string}
 */
export const deriveDropdownValue = (selectedFiscalYear, compareFYs) => {
    if (!Array.isArray(compareFYs) || compareFYs.length === 0) {
        return selectedFiscalYear;
    }
    // Sentinel check must precede length check — a mixed array containing the sentinel
    // (e.g. [{id:"all"}, {id:2024}]) should show "All", not "Multi", consistent with
    // how resolveForAPI and deriveFYTags both treat the sentinel as dominant.
    if (isAllSentinel(compareFYs)) {
        return "All";
    }
    if (compareFYs.length >= 2) {
        return "Multi";
    }
    return String(compareFYs[0].id);
};

/**
 * Resolves the FY array to send to the API query.
 * Returns [] when no FY filter should be applied (i.e. "All FYs").
 *
 * This replaces the page-level getFiscalYearFilter() pattern. Unlike the old implementation,
 * it does NOT suppress the dropdown FY when other non-FY filters are active — instead it always
 * falls back to the dropdown FY, which is the correct behavior per the business rules.
 *
 * @param {string} selectedFiscalYear - The persistent dropdown value ("All" or a year string).
 * @param {Array<{id:number|string, title:number|string}>} compareFYs - Compare FYs modal selection.
 * @returns {Array<{id:number, title:number}>} Empty array means no FY filter (all fiscal years).
 *
 * NOTE for future page migrations: this returns {id,title} objects, not raw scalars.
 * The getAgreements and getBudgetLineItems query builders already use getFiscalYearQueryValue()
 * to extract the id. The getCans query builder pushes raw values directly — it must be updated
 * to use getFiscalYearQueryValue() before the CAN page adopts this helper (opsAPI.js ~line 795).
 */
export const resolveForAPI = (selectedFiscalYear, compareFYs) => {
    if (Array.isArray(compareFYs) && compareFYs.length > 0) {
        // All-sentinel in the modal → no FY filter
        if (isAllSentinel(compareFYs)) {
            return [];
        }
        return compareFYs;
    }
    // No Compare FYs selection — fall back to the dropdown
    if (selectedFiscalYear === "All") {
        return [];
    }
    const year = Number(selectedFiscalYear);
    return [{ id: year, title: year }];
};

/**
 * Derives the filter tags array from the Compare FYs selection only.
 * Dropdown-only FY changes never produce a tag because they don't touch compareFYs.
 * Deduplicates tags by tagText.
 *
 * @param {Array<{id:number|string, title:number|string}>} compareFYs
 * @param {string} [filterKey="fiscalYear"] - The key used in each tag's `filter` field.
 *   Override when the consuming page's removeFilter switch uses a different key name
 *   (e.g. BLI uses "fiscalYears" — plural).
 * @returns {Array<{tagText:string, filter:string}>}
 */
export const deriveFYTags = (compareFYs, filterKey = "fiscalYear") => {
    if (!Array.isArray(compareFYs) || compareFYs.length === 0) {
        return [];
    }
    if (isAllSentinel(compareFYs)) {
        return [{ tagText: "All FYs", filter: filterKey }];
    }
    const seen = new Set();
    const tags = [];
    for (const fy of compareFYs) {
        const tagText = normalizeFYTag(fy.title);
        if (!seen.has(tagText)) {
            seen.add(tagText);
            tags.push({ tagText, filter: filterKey });
        }
    }
    return tags;
};

/**
 * Returns a new compareFYs array with the entry matching tagText removed.
 * Removing "All FYs" clears the sentinel. If the result is empty, returns [].
 *
 * @param {Array<{id:number|string, title:number|string}>} compareFYs
 * @param {string} tagText - The tag text to remove (e.g. "FY 2024" or "All FYs").
 * @returns {Array<{id:number|string, title:number|string}>}
 */
export const handleFYTagRemoval = (compareFYs, tagText) => {
    if (!Array.isArray(compareFYs)) return [];
    if (tagText === "All FYs") {
        return compareFYs.filter((fy) => !isAllSentinel([fy]));
    }
    return compareFYs.filter((fy) => normalizeFYTag(fy.title) !== tagText);
};
