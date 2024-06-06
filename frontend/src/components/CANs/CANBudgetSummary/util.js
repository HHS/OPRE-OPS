import constants from "../../../constants";

export const getPendingFunds = (canFiscalYear) => {
    if (!canFiscalYear || !canFiscalYear.total_funding || !canFiscalYear.amount_available) {
        return constants.notFilledInText;
    } else {
        return canFiscalYear.total_funding - canFiscalYear.amount_available;
    }
};
