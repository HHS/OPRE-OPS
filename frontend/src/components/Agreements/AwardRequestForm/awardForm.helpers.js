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
