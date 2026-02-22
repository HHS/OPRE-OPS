import { formatDate } from "../../../helpers/utils";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";

const handleAgreementProp = (agreement) => {
    if (typeof agreement !== "object") {
        throw new Error(`Agreement must be an object, but got ${typeof agreement}`);
    }
};

export const getAgreementName = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.display_name;
};

export const getResearchProjectName = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.project?.title;
};

export const areAllBudgetLinesInStatus = (agreement, status) => {
    handleAgreementProp(agreement);

    return agreement.budget_line_items?.every((bli) => bli.status === status);
};

export const isThereAnyBudgetLines = (agreement) => {
    handleAgreementProp(agreement);

    return agreement?.budget_line_items?.length > 0;
};

export const getAgreementContractNumber = (agreement) => {
    handleAgreementProp(agreement);

    return agreement?.contract_number;
};

export const getAgreementStartDate = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.sc_start_date ? formatDate(new Date(agreement.sc_start_date)) : "TBD";
};

export const getAgreementEndDate = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.sc_end_date ? formatDate(new Date(agreement.sc_end_date)) : "TBD";
};

export const getProcurementShopDisplay = (agreement) => {
    handleAgreementProp(agreement);
    const shop = agreement.procurement_shop;
    if (!shop || !shop.abbr) {
        return "TBD";
    }
    return `${shop.abbr} - Fee Rate: ${shop.fee_percentage}%`;
};

export const getFYObligatedAmount = (agreement, fiscalYear) => {
    handleAgreementProp(agreement);
    return (
        agreement.budget_line_items
            ?.filter((bli) => bli.status === BLI_STATUS.OBLIGATED && bli.fiscal_year === fiscalYear)
            .reduce((acc, { amount = 0, fees = 0 }) => acc + amount + fees, 0) || 0
    );
};
