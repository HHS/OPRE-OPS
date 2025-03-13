import { useState, useMemo } from "react";
import { AGREEMENT_TABLE_HEADINGS } from "../components/Agreements/AgreementsTable/AgreementsTable.constants";
import { getAgreementSubTotal, getProcurementShopSubTotal, getBudgetLineAmount, findNextBudgetLine, findNextNeedBy } from "../components/Agreements/AgreementsTable/AgreementsTable.helpers";

export const SORT_TYPES = {
    AGREEMENTS: "Agreement"
}

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


const VALUE_RETRIEVAL_FUNCTIONS = {
    "Agreement": getAgreementComparableValue,
}
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
    const getComparableValue = VALUE_RETRIEVAL_FUNCTIONS[sortType]
    return sortableItems.sort((a, b) => {
        const aVal = getComparableValue(a, sortCondition);
        const bVal = getComparableValue(b, sortCondition);
        return compareRows(aVal, bVal, descending);
    });
}
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
