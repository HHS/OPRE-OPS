import { getTypesCounts } from "../../../pages/cans/detail/Can.helpers";

export const getAgreementTypesCount = (budgetlines) => {
    const budgetLinesAgreements = budgetlines?.map((item) => item.agreement).filter(Boolean) ?? [];
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
