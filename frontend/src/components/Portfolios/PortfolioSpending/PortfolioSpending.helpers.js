import { getTypesCounts } from "../../../pages/cans/detail/Can.helpers";

/**
 * @param {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine[]} budgetlines
 */
export const getAgreementTypesCount = (budgetlines) => {
    const budgetLinesAgreements = budgetlines?.filter((item) => item.agreement).map((item) => item.agreement);
    const uniqueBudgetLineAgreements =
        budgetLinesAgreements?.reduce((acc, item) => {
            // Skip if item is null or doesn't have a name
            if (!item?.name) return acc;

            if (!acc.some((existingItem) => existingItem?.name === item.name)) {
                acc.push(item);
            }
            return acc;
        }, []) ?? [];
    const agreementTypesCount = getTypesCounts(uniqueBudgetLineAgreements ?? [], "agreement_type");
    return agreementTypesCount;
};
