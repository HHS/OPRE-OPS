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
import { useGetServicesComponentDisplayNameLocal } from "./useServicesComponents.hooks";
import { formatDateNeeded, totalBudgetLineAmountPlusFees, totalBudgetLineFeeAmount } from "../helpers/utils";
import { canLabel, BLILabel } from "../helpers/budgetLines.helpers";

export const SORT_TYPES = {
    AGREEMENTS: "Agreement",
    BUDGET_LINES: "Budget Lines",
    BLI_DIFF: "BLI Diff",
    BLI_REVIEW: "BLI Review"
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

const getBudgetLineComparableValue = (budgetLine, condition) => {
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
            return budgetLine.fiscal_year;
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

const VALUE_RETRIEVAL_FUNCTIONS = {
    Agreement: getAgreementComparableValue,
    "Budget Lines": getBudgetLineComparableValue,
    "BLI Diff": getBLIDiffComparableValue,
    "BLI Review": getBLIDiffComparableValue
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
