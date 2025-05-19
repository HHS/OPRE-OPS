import { tableSortCodes } from "../../../helpers/utils";
export const BLI_DIFF_TABLE_HEADERS = {
    BL_ID_NUMBER: "BL ID #",
    OBLIGATE_BY: "Obligate By",
    FISCAL_YEAR: "FY",
    CAN_ID: "CAN",
    AMOUNT: "Amount",
    FEE: "Fee",
    TOTAL: "Total",
    STATUS: "Status"
};
export const BUDGET_LINE_TABLE_HEADERS_LIST = [
    { heading: BLI_DIFF_TABLE_HEADERS.BL_ID_NUMBER, value: tableSortCodes.budgetLineCodes.BL_ID_NUMBER },
    { heading: BLI_DIFF_TABLE_HEADERS.OBLIGATE_BY, value: tableSortCodes.budgetLineCodes.OBLIGATE_BY },
    { heading: BLI_DIFF_TABLE_HEADERS.FISCAL_YEAR, value: tableSortCodes.budgetLineCodes.FISCAL_YEAR },
    { heading: BLI_DIFF_TABLE_HEADERS.CAN_ID, value: tableSortCodes.budgetLineCodes.CAN_NUMBER },
    { heading: BLI_DIFF_TABLE_HEADERS.AMOUNT, value: tableSortCodes.budgetLineCodes.AMOUNT },
    { heading: BLI_DIFF_TABLE_HEADERS.FEE, value: tableSortCodes.budgetLineCodes.FEES },
    { heading: BLI_DIFF_TABLE_HEADERS.TOTAL, value: tableSortCodes.budgetLineCodes.TOTAL },
    { heading: BLI_DIFF_TABLE_HEADERS.STATUS, value: tableSortCodes.budgetLineCodes.STATUS }
];
