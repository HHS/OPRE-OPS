import { tableSortCodes } from "../../../helpers/utils";
export const All_BUDGET_LINES_TABLE_HEADINGS = {
    BL_ID_NUMBER: "BL ID #",
    AGREEMENT: "Agreement",
    AGREEMENT_TYPE: "Type",
    SERVICE_COMPONENT: "SC",
    OBLIGATE_BY: "Obligate By",
    CAN: "CAN",
    PORTFOLIO: "Portfolio",
    TOTAL: "Total",
    STATUS: "Status"
};
export const All_BUDGET_LINES_TABLE_HEADINGS_LIST = [
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.BL_ID_NUMBER, value: tableSortCodes.budgetLineCodes.BL_ID_NUMBER },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.AGREEMENT, value: tableSortCodes.budgetLineCodes.AGREEMENT_NAME },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.AGREEMENT_TYPE, value: tableSortCodes.budgetLineCodes.AGREEMENT_TYPE },
    {
        heading: All_BUDGET_LINES_TABLE_HEADINGS.SERVICE_COMPONENT,
        value: tableSortCodes.budgetLineCodes.SERVICES_COMPONENT
    },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.OBLIGATE_BY, value: tableSortCodes.budgetLineCodes.OBLIGATE_BY },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.CAN, value: tableSortCodes.budgetLineCodes.CAN_NUMBER },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.PORTFOLIO, value: tableSortCodes.budgetLineCodes.PORTFOLIO },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.TOTAL, value: tableSortCodes.budgetLineCodes.TOTAL },
    { heading: All_BUDGET_LINES_TABLE_HEADINGS.STATUS, value: tableSortCodes.budgetLineCodes.STATUS }
];
