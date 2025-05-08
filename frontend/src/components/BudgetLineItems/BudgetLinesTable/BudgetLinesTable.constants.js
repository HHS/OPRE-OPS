import { tableSortCodes } from "../../../helpers/utils";
export const BUDGET_LINE_TABLE_HEADERS = [
    { heading: "BL ID #", value: tableSortCodes.budgetLineCodes.BL_ID_NUMBER },
    { heading: "Obligate By", value: tableSortCodes.budgetLineCodes.OBLIGATE_BY },
    { heading: "FY", value: tableSortCodes.budgetLineCodes.FISCAL_YEAR },
    { heading: "CAN", value: tableSortCodes.budgetLineCodes.CAN_NUMBER },
    { heading: "Amount", value: tableSortCodes.budgetLineCodes.AMOUNT },
    { heading: "Fee", value: tableSortCodes.budgetLineCodes.FEES },
    { heading: "Total", value: tableSortCodes.budgetLineCodes.TOTAL },
    { heading: "Status", value: tableSortCodes.budgetLineCodes.STATUS }
];
