/**
 * Format vendor type enum value for human-readable display.
 * @param {string} vendorType - e.g. "VendorType.SMALL_BUSINESS" or "SMALL_BUSINESS"
 * @returns {string}
 */
export const formatVendorType = (vendorType) => {
    if (!vendorType) return "";

    // Strip "VendorType." prefix if present
    const cleanType = vendorType.replace(/^VendorType\./, "");

    const typeMap = {
        SMALL_BUSINESS: "Small Business",
        EIGHT_A: "8(a)",
        HUBZONE: "HUBZone",
        WOMAN_OWNED: "Woman-Owned Small Business",
        VETERAN_OWNED: "Veteran-Owned Small Business",
        SERVICE_DISABLED_VETERAN_OWNED: "Service-Disabled Veteran-Owned Small Business",
        LARGE_BUSINESS: "Large Business",
        OTHER: "Other"
    };

    return typeMap[cleanType] || vendorType;
};

/**
 * Default Modification # value for a new award.
 * @type {string}
 */
export const DEFAULT_MODIFICATION_NUMBER = "Base";

/**
 * Modification # dropdown options for Step 6 (OPS-5892).
 * For a new award the value is "Base"; future modification versions are P00001..P00020.
 * Built once at module load — the list is static, so it must not be rebuilt on every render.
 * Mirrored server-side by AWARD_MODIFICATION_NUMBERS in backend/models/procurement_tracker.py.
 * @type {readonly string[]}
 */
export const MODIFICATION_NUMBER_OPTIONS = Object.freeze([
    DEFAULT_MODIFICATION_NUMBER,
    ...Array.from({ length: 20 }, (_, i) => `P${String(i + 1).padStart(5, "0")}`)
]);

/**
 * @typedef {Object} AwardFieldValues
 * @property {string} agreementTitle
 * @property {string} modificationNumber
 * @property {string} purchaseOrderNumber
 * @property {string} taskOrderNumber
 */

/**
 * Baseline values for the four OPS-5892 award fields.
 *
 * Used for BOTH the initial seeding of form state and the `hasChanged` comparison, so a pristine
 * form can never trip the navigation blocker. Values come from a prior step 6 submission when one
 * exists (the decline → resubmit path on the request page, and every visit to the edit page) and
 * otherwise fall back to the current agreement name / "Base" defaults.
 *
 * Empty strings are treated as "not provided" so a blank stored Modification # can never leave the
 * <select> on a value it has no option for.
 *
 * @param {any} step6 - The step 6 object from the active procurement tracker, if loaded.
 * @param {any} agreement - The agreement, if loaded.
 * @returns {AwardFieldValues}
 */
export const getSeededAwardFields = (step6, agreement) => ({
    agreementTitle: step6?.agreement_title || agreement?.name || "",
    modificationNumber: step6?.modification_number || DEFAULT_MODIFICATION_NUMBER,
    purchaseOrderNumber: step6?.purchase_order_number || "",
    taskOrderNumber: step6?.task_order_number || ""
});

/**
 * Whether any of the four OPS-5892 award fields differ from their seeded baseline.
 *
 * Text fields are compared trimmed because trimmed values are what gets submitted — otherwise
 * adding a trailing space would mark the form dirty while saving nothing.
 *
 * @param {AwardFieldValues} current - Current form values.
 * @param {AwardFieldValues} seeded - Baseline from {@link getSeededAwardFields}.
 * @returns {boolean}
 */
export const hasAwardFieldChanges = (current, seeded) =>
    current.agreementTitle.trim() !== seeded.agreementTitle.trim() ||
    current.modificationNumber !== seeded.modificationNumber ||
    current.purchaseOrderNumber.trim() !== seeded.purchaseOrderNumber.trim() ||
    current.taskOrderNumber.trim() !== seeded.taskOrderNumber.trim();
