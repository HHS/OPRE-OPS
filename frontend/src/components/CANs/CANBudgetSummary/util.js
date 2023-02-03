import constants from "../../../constants";

export const getPendingFunds = (canFiscalYear) => {
    if (!canFiscalYear || !canFiscalYear.total_fiscal_year_funding || !canFiscalYear.amount_available) {
        return constants.notFilledInText;
    } else {
        return canFiscalYear.total_fiscal_year_funding - canFiscalYear.amount_available;
    }
};
