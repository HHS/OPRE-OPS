import { tableSortCodes } from "../../../helpers/utils";

export const PORTFOLIO_TABLE_HEADERS = {
    PORTFOLIO_NAME: "Portfolio",
    FY_BUDGET: "FY Budget",
    FY_SPENDING: "FY Spending",
    FY_AVAILABLE: "FY Available Budget"
};

export const PORTFOLIO_SORT_CODES = {
    ...tableSortCodes.portfolioCodes,
    STATIC_ORDER: "STATIC_ORDER"
};
