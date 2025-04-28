import { useState, useMemo } from "react";
import {
    getAgreementSubTotal,
    getProcurementShopSubTotal,
    getBudgetLineAmount,
    findNextBudgetLine,
    findNextNeedBy
} from "../components/Agreements/AgreementsTable/AgreementsTable.helpers";
import { CAN_FUNDING_RECEIVED_HEADERS } from "../components/CANs/CANFundingReceivedTable/CANFundingReceived.constants";
import { useGetServicesComponentDisplayNameLocal } from "./useServicesComponents.hooks";
import {
    formatDateNeeded,
    totalBudgetLineAmountPlusFees,
    totalBudgetLineFeeAmount,
    calculatePercent,
    fiscalYearFromDate
} from "../helpers/utils";
import { tableSortCodes } from "../helpers/utils";
import { canLabel, BLILabel } from "../helpers/budgetLines.helpers";
import { CAN_TABLE_HEADERS } from "../components/CANs/CANTable/CANTable.constants";
import { formatObligateBy } from "../components/CANs/CANTable/CANTable.helpers";

export const SORT_TYPES = {
    AGREEMENTS: "Agreement",
    ALL_BUDGET_LINES: "All Budget Lines",
    BLI_DIFF: "BLI Diff",
    BLI_REVIEW: "BLI Review",
    BUDGET_LINES: "Budget Lines",
    CAN_BLI: "CAN Budget Line",
    CAN_FUNDING_RECEIVED: "CAN Funding Received",
    CAN_TABLE: "CAN Table"
};

const getAgreementComparableValue = (agreement, condition) => {
    switch (condition) {
        case tableSortCodes.agreementCodes.AGREEMENT:
            return agreement.name;
        case tableSortCodes.agreementCodes.PROJECT:
            return agreement.project?.title;
        case tableSortCodes.agreementCodes.TYPE:
            return agreement.agreement_type;
        case tableSortCodes.agreementCodes.AGREEMENT_TOTAL:
            console.log(`getAgreementSubTotal: ${getAgreementSubTotal(agreement)}`);
            return getAgreementSubTotal(agreement) + getProcurementShopSubTotal(agreement);
        case tableSortCodes.agreementCodes.NEXT_BUDGET_LINE:
            return getBudgetLineAmount(findNextBudgetLine(agreement));
        case tableSortCodes.agreementCodes.NEXT_OBLIGATE_BY:
            return findNextNeedBy(agreement);
        default:
            return agreement;
    }
};

const getAllBudgetLineComparableValue = (budgetLine, condition) => {
    switch (condition) {
        case tableSortCodes.budgetLineCodes.BL_ID_NUMBER:
            return budgetLine.id;
        case tableSortCodes.budgetLineCodes.AGREEMENT_NAME:
            return budgetLine.agreement_name;
        case tableSortCodes.budgetLineCodes.SERVICES_COMPONENT:
            return useGetServicesComponentDisplayNameLocal(budgetLine.services_component_id);
        case tableSortCodes.budgetLineCodes.OBLIGATE_BY:
            return formatDateNeeded(budgetLine.date_needed);
        case tableSortCodes.budgetLineCodes.FISCAL_YEAR:
            return budgetLine.fiscal_year;
        case tableSortCodes.budgetLineCodes.CAN_NUMBER:
            return budgetLine.can_number;
        case tableSortCodes.budgetLineCodes.TOTAL:
            return totalBudgetLineAmountPlusFees(
                budgetLine.amount,
                totalBudgetLineFeeAmount(budgetLine.amount, budgetLine.proc_shop_fee_percentage)
            );
        case tableSortCodes.budgetLineCodes.STATUS:
            return budgetLine.status;
        default:
            return budgetLine;
    }
};

const getBLIDiffComparableValue = (budgetLine, condition) => {
    switch (condition) {
        case tableSortCodes.budgetLineCodes.BL_ID_NUMBER: {
            let bliLabel = BLILabel(budgetLine);
            return bliLabel == "TBD" ? 0 : bliLabel;
        }
        case tableSortCodes.budgetLineCodes.OBLIGATE_BY:
            return new Date(budgetLine.date_needed);
        case tableSortCodes.budgetLineCodes.FISCAL_YEAR:
            return budgetLine.fiscal_year ? budgetLine.fiscal_year : fiscalYearFromDate(budgetLine.date_needed);
        case tableSortCodes.budgetLineCodes.CAN_NUMBER:
            return canLabel(budgetLine);
        case tableSortCodes.budgetLineCodes.AMOUNT:
            return budgetLine?.amount;
        case tableSortCodes.budgetLineCodes.FEES:
            return totalBudgetLineFeeAmount(budgetLine?.amount, budgetLine.proc_shop_fee_percentage);
        case tableSortCodes.budgetLineCodes.TOTAL:
            return totalBudgetLineAmountPlusFees(
                budgetLine.amount,
                totalBudgetLineFeeAmount(budgetLine.amount, budgetLine.proc_shop_fee_percentage)
            );
        case tableSortCodes.budgetLineCodes.STATUS:
            return budgetLine?.status;
        default:
            return budgetLine;
    }
};

const getFundingReceivedComparableValue = (fundingReceived, condition) => {
    switch (condition) {
        case CAN_FUNDING_RECEIVED_HEADERS.FUNDING_ID:
            return fundingReceived.id;
        case CAN_FUNDING_RECEIVED_HEADERS.FISCAL_YEAR:
            return fundingReceived.fiscal_year;
        case CAN_FUNDING_RECEIVED_HEADERS.FUNDING_RECEIVED:
            return fundingReceived.funding;
        case CAN_FUNDING_RECEIVED_HEADERS.BUDGET_PERCENT:
            return calculatePercent(fundingReceived.funding, fundingReceived.totalFunding);
        default:
            return fundingReceived;
    }
};

const getCANTableComparableValue = (can, condition) => {
    switch (condition) {
        case CAN_TABLE_HEADERS.CAN_NAME:
            return can.name ?? "TBD";
        case CAN_TABLE_HEADERS.PORTFOLIO:
            return can.portfolio.abbreviation;
        case CAN_TABLE_HEADERS.ACTIVE_PERIOD:
            return can.active_period ?? 0;
        case CAN_TABLE_HEADERS.OBLIGATE_BY:
            return formatObligateBy(can.obligate_by);
        case CAN_TABLE_HEADERS.FY_BUDGET:
            return "";
        case CAN_TABLE_HEADERS.FUNDING_RECEIVED:
            return "";
        case CAN_TABLE_HEADERS.AVAILABLE_BUDGET:
            return "";
        default:
            return can;
    }
};

const VALUE_RETRIEVAL_FUNCTIONS = {
    Agreement: getAgreementComparableValue,
    "All Budget Lines": getAllBudgetLineComparableValue,
    "BLI Diff": getBLIDiffComparableValue,
    "BLI Review": getBLIDiffComparableValue,
    "Budget Lines": getBLIDiffComparableValue,
    "CAN Budget Line": getBLIDiffComparableValue,
    "CAN Funding Received": getFundingReceivedComparableValue,
    "CAN Table": getCANTableComparableValue
};
const compareRows = (a, b, descending) => {
    if (a < b) {
        console.log("a < b");
        return descending ? 1 : -1;
    } else if (b < a) {
        console.log("a > b");
        return descending ? -1 : 1;
    }
    return 0;
};

export const useSortData = (items, descending, sortCondition, sortType) => {
    let sortableItems = [...items];
    const getComparableValue = VALUE_RETRIEVAL_FUNCTIONS[sortType];
    return sortableItems.sort((a, b) => {
        const aVal = getComparableValue(a, sortCondition);
        const bVal = getComparableValue(b, sortCondition);
        console.log(`aVal: ${aVal} bVal: ${bVal}`);
        return compareRows(aVal, bVal, descending);
    });
};
const useSortableData = (items, config = null) => {
    const [sortConfig, setSortConfig] = useState(config);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === "ascending" ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === "ascending" ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key) => {
        let direction = "ascending";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
            direction = "descending";
        }
        setSortConfig({ key, direction });
    };

    return { items: sortedItems, requestSort, sortConfig };
};

export default useSortableData;
