import { tableSortCodes } from "../../../helpers/utils";
export const All_BUDGET_LINES_TABLE_HEADINGS = {
    BL_ID_NUMBER: "BL ID #",
    AGREEMENT: "Agreement",
    SERVICE_COMPONENT: "SC",
    OBLIGATE_BY: "Obligate By",
    FISCAL_YEAR: "FY",
    CAN: "CAN",
    TOTAL: "Total",
    STATUS: "Status"
};
export const All_BUDGET_LINES_TABLE_HEADINGS_LIST = [
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.BL_ID_NUMBER, value: tableSortCodes.budgetLineCodes.BL_ID_NUMBER },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.AGREEMENT, value: tableSortCodes.budgetLineCodes.AGREEMENT_NAME },
    {
        heading: All_BUDGET_LINES_TABLE_HEADINGS.SERVICE_COMPONENT,
        value: tableSortCodes.budgetLineCodes.SERVICES_COMPONENT
    },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.OBLIGATE_BY, value: tableSortCodes.budgetLineCodes.OBLIGATE_BY },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.FISCAL_YEAR, value: tableSortCodes.budgetLineCodes.FISCAL_YEAR },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.CAN, value: tableSortCodes.budgetLineCodes.CAN_NUMBER },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.TOTAL, value: tableSortCodes.budgetLineCodes.TOTAL },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.STATUS, value: tableSortCodes.budgetLineCodes.STATUS }
];
