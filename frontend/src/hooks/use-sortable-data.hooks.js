import { useState, useMemo } from "react";
import { AGREEMENT_TABLE_HEADINGS } from "../components/Agreements/AgreementsTable/AgreementsTable.constants";
import {
    getAgreementSubTotal,
    getProcurementShopSubTotal,
    getBudgetLineAmount,
    findNextBudgetLine,
    findNextNeedBy
} from "../components/Agreements/AgreementsTable/AgreementsTable.helpers";
import { All_BUDGET_LINES_TABLE_HEADINGS } from "../components/BudgetLineItems/AllBudgetLinesTable/AllBudgetLinesTable.constants";
import { BLI_DIFF_TABLE_HEADERS } from "../components/BudgetLineItems/BLIDiffTable/BLIDiffTable.constants";
import { CAN_FUNDING_RECEIVED_HEADERS } from "../components/CANs/CANFundingReceivedTable/CANFundingReceived.constants";
import { useGetServicesComponentDisplayNameLocal } from "./useServicesComponents.hooks";
import {
    formatDateNeeded,
    totalBudgetLineAmountPlusFees,
    totalBudgetLineFeeAmount,
    calculatePercent,
    fiscalYearFromDate
} from "../helpers/utils";
import { canLabel, BLILabel } from "../helpers/budgetLines.helpers";

export const SORT_TYPES = {
    AGREEMENTS: "Agreement",
    ALL_BUDGET_LINES: "All Budget Lines",
    BLI_DIFF: "BLI Diff",
    BLI_REVIEW: "BLI Review",
    BUDGET_LINES: "Budget Lines",
    CAN_BLI: "CAN Budget Line",
    CAN_FUNDING_RECEIVED: "CAN Funding Received"
};

const getAgreementComparableValue = (agreement, condition) => {
    switch (condition) {
        case AGREEMENT_TABLE_HEADINGS.AGREEMENT:
            return agreement.name;
        case AGREEMENT_TABLE_HEADINGS.PROJECT:
            return agreement.project?.title;
        case AGREEMENT_TABLE_HEADINGS.TYPE:
            return agreement.agreement_type;
        case AGREEMENT_TABLE_HEADINGS.AGREEMENT_TOTAL:
            return getAgreementSubTotal(agreement) + getProcurementShopSubTotal(agreement);
        case AGREEMENT_TABLE_HEADINGS.NEXT_BUDGET_LINE:
            return getBudgetLineAmount(findNextBudgetLine(agreement));
        case AGREEMENT_TABLE_HEADINGS.NEXT_OBLIGATE_BY:
            return findNextNeedBy(agreement);
        default:
            return agreement;
    }
};

const getAllBudgetLineComparableValue = (budgetLine, condition) => {
    switch (condition) {
        case All_BUDGET_LINES_TABLE_HEADINGS.BL_ID_NUMBER:
            return budgetLine.id;
        case All_BUDGET_LINES_TABLE_HEADINGS.AGREEMENT:
            return budgetLine.agreement_name;
        case All_BUDGET_LINES_TABLE_HEADINGS.SERVICE_COMPONENT:
            return useGetServicesComponentDisplayNameLocal(budgetLine.services_component_id);
        case All_BUDGET_LINES_TABLE_HEADINGS.OBLIGATE_BY:
            return formatDateNeeded(budgetLine.date_needed);
        case All_BUDGET_LINES_TABLE_HEADINGS.FISCAL_YEAR:
            return budgetLine.fiscal_year;
        case All_BUDGET_LINES_TABLE_HEADINGS.CAN:
            return budgetLine.can_number;
        case All_BUDGET_LINES_TABLE_HEADINGS.TOTAL:
            return totalBudgetLineAmountPlusFees(
                budgetLine.amount,
                totalBudgetLineFeeAmount(budgetLine.amount, budgetLine.proc_shop_fee_percentage)
            );
        case All_BUDGET_LINES_TABLE_HEADINGS.STATUS:
            return budgetLine.status;
        default:
            return budgetLine;
    }
};

const getBLIDiffComparableValue = (budgetLine, condition) => {
    switch (condition) {
        case BLI_DIFF_TABLE_HEADERS.BL_ID_NUMBER:
            return BLILabel(budgetLine);
        case BLI_DIFF_TABLE_HEADERS.OBLIGATE_BY:
            return formatDateNeeded(budgetLine.date_needed);
        case BLI_DIFF_TABLE_HEADERS.FISCAL_YEAR:
            return budgetLine.fiscal_year ? budgetLine.fiscal_year : fiscalYearFromDate(budgetLine.date_needed);
        case BLI_DIFF_TABLE_HEADERS.CAN_ID:
            return canLabel(budgetLine);
        case BLI_DIFF_TABLE_HEADERS.AMOUNT:
            return budgetLine?.amount;
        case BLI_DIFF_TABLE_HEADERS.FEE:
            return totalBudgetLineFeeAmount(budgetLine?.amount, budgetLine.proc_shop_fee_percentage);
        case BLI_DIFF_TABLE_HEADERS.TOTAL:
            return totalBudgetLineAmountPlusFees(
                budgetLine.amount,
                totalBudgetLineFeeAmount(budgetLine.amount, budgetLine.proc_shop_fee_percentage)
            );
        case BLI_DIFF_TABLE_HEADERS.STATUS:
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

const VALUE_RETRIEVAL_FUNCTIONS = {
    Agreement: getAgreementComparableValue,
    "All Budget Lines": getAllBudgetLineComparableValue,
    "BLI Diff": getBLIDiffComparableValue,
    "BLI Review": getBLIDiffComparableValue,
    "Budget Lines": getBLIDiffComparableValue,
    "CAN Budget Line": getBLIDiffComparableValue,
    "CAN Funding Received": getFundingReceivedComparableValue
};
const compareRows = (a, b, descending) => {
    if (a < b) {
        return descending ? 1 : -1;
    } else if (b < a) {
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
