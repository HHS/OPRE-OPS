import { tableSortCodes } from "../../../helpers/utils";
export const BLI_REVIEW_HEADERS = {
    OBLIGATE_BY: "Obligate By",
    FISCAL_YEAR: "FY",
    CAN: "CAN",
    AMOUNT: "Amount",
    FEE: "Fee",
    TOTAL: "Total",
    STATUS: "Status"
};
export const BUDGET_LINE_TABLE_HEADERS_LIST = [
    { heading: BLI_REVIEW_HEADERS.OBLIGATE_BY, value: tableSortCodes.budgetLineCodes.OBLIGATE_BY },
    { heading: BLI_REVIEW_HEADERS.FISCAL_YEAR, value: tableSortCodes.budgetLineCodes.FISCAL_YEAR },
    { heading: BLI_REVIEW_HEADERS.CAN, value: tableSortCodes.budgetLineCodes.CAN_NUMBER },
    { heading: BLI_REVIEW_HEADERS.AMOUNT, value: tableSortCodes.budgetLineCodes.AMOUNT },
    { heading: BLI_REVIEW_HEADERS.FEE, value: tableSortCodes.budgetLineCodes.FEES },
    { heading: BLI_REVIEW_HEADERS.TOTAL, value: tableSortCodes.budgetLineCodes.TOTAL },
    { heading: BLI_REVIEW_HEADERS.STATUS, value: tableSortCodes.budgetLineCodes.STATUS }
];
