import { tableSortCodes } from "../../../helpers/utils";
export const CAN_BLI_HEADERS = {
    BLI_ID_NUMBER: "BLI ID #",
    AGREEMENT: "Agreement",
    OBLIGATE_BY: "Obligate By",
    FISCAL_YEAR: "FY",
    TOTAL: "Total",
    PERCENT_OF_CAN: "% of CAN",
    PERCENT_OF_BUDGET: "% of Budget",
    STATUS: "Status"
};

export const CAN_HEADERS = [
    { heading: CAN_BLI_HEADERS.BLI_ID_NUMBER, value: tableSortCodes.budgetLineCodes.BL_ID_NUMBER },
    { heading: CAN_BLI_HEADERS.AGREEMENT, value: tableSortCodes.budgetLineCodes.AGREEMENT_NAME },
    { heading: CAN_BLI_HEADERS.OBLIGATE_BY, value: tableSortCodes.budgetLineCodes.OBLIGATE_BY },
    { heading: CAN_BLI_HEADERS.FISCAL_YEAR, value: tableSortCodes.budgetLineCodes.FISCAL_YEAR },
    { heading: CAN_BLI_HEADERS.TOTAL, value: tableSortCodes.budgetLineCodes.TOTAL },
    { heading: CAN_BLI_HEADERS.PERCENT_OF_CAN, value: tableSortCodes.budgetLineCodes.PERCENT_OF_CAN },
    { heading: CAN_BLI_HEADERS.STATUS, value: tableSortCodes.budgetLineCodes.STATUS }
];

export const PORTFOLIO_HEADERS = [
    { heading: CAN_BLI_HEADERS.BLI_ID_NUMBER, value: tableSortCodes.budgetLineCodes.BL_ID_NUMBER },
    { heading: CAN_BLI_HEADERS.AGREEMENT, value: tableSortCodes.budgetLineCodes.AGREEMENT_NAME },
    { heading: CAN_BLI_HEADERS.OBLIGATE_BY, value: tableSortCodes.budgetLineCodes.OBLIGATE_BY },
    { heading: CAN_BLI_HEADERS.FISCAL_YEAR, value: tableSortCodes.budgetLineCodes.FISCAL_YEAR },
    { heading: CAN_BLI_HEADERS.TOTAL, value: tableSortCodes.budgetLineCodes.TOTAL },
    { heading: CAN_BLI_HEADERS.PERCENT_OF_BUDGET, value: tableSortCodes.budgetLineCodes.PERCENT_OF_BUDGET },
    { heading: CAN_BLI_HEADERS.STATUS, value: tableSortCodes.budgetLineCodes.STATUS }
];
