import { tableSortCodes } from "../../../helpers/utils";
export const CAN_FUNDING_RECEIVED_HEADERS = {
    FUNDING_ID: "Funding ID",
    FISCAL_YEAR: "FY",
    FUNDING_RECEIVED: "Funding Received",
    BUDGET_PERCENT: "% of Total FY Budget"
};
export const CAN_FUNDING_RECEIVED_HEADERS_LIST = [
    { heading: CAN_FUNDING_RECEIVED_HEADERS.FUNDING_ID, value: tableSortCodes.canFundingReceivedCodes.FUNDING_ID },
    { heading: CAN_FUNDING_RECEIVED_HEADERS.FISCAL_YEAR, value: tableSortCodes.canFundingReceivedCodes.FISCAL_YEAR },
    {
        heading: CAN_FUNDING_RECEIVED_HEADERS.FUNDING_RECEIVED,
        value: tableSortCodes.canFundingReceivedCodes.FUNDING_RECEIVED
    },
    {
        heading: CAN_FUNDING_RECEIVED_HEADERS.BUDGET_PERCENT,
        value: tableSortCodes.canFundingReceivedCodes.BUDGET_PERCENT
    }
];
