/**
 * Validates if the given budget line is an object.
 * @param {Object} agreement - The budget line to validate.
 * @throws {Error} Will throw an error if the budget line is not an object.
 */
const handleAgreementProp = (agreement) => {
    if (typeof agreement !== "object") {
        throw new Error(`Agreement must be an object, but got ${typeof agreement}`);
    }
};

// TODO: filter out DRAFT BLIs and UNDER_REVIEW BLIs
export const getAgreementSubTotal = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.budget_line_items?.reduce((n, { amount }) => n + amount, 0);
};

export const getProcurementShopSubTotal = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.budget_line_items?.reduce(
        (acc, { amount }) => acc + amount * (agreement.procurement_shop ? agreement.procurement_shop.fee : 0),
        0
    );
};
