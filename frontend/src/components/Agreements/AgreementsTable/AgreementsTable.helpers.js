import { codesToDisplayText, draftBudgetLineStatuses, formatDate } from "../../../helpers/utils";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
export { getAgreementSubTotal, getProcurementShopSubTotal } from "../../../helpers/agreement.helpers";

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

export const getAgreementDescription = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.description;
};

export const getAgreementNotes = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.notes;
};

export const findNextBudgetLine = (agreement) => {
    handleAgreementProp(agreement);
    const today = new Date();
    let nextBudgetLine;
    agreement.budget_line_items?.forEach((bli) => {
        if (!draftBudgetLineStatuses.includes(bli.status) && bli.date_needed && new Date(bli.date_needed) >= today) {
            if (!nextBudgetLine || bli.date_needed < nextBudgetLine.date_needed) {
                nextBudgetLine = bli;
            }
        }
    });
    return nextBudgetLine;
};

export const findNextNeedBy = (agreement) => {
    handleAgreementProp(agreement);
    const nextBudgetLine = findNextBudgetLine(agreement);
    let nextNeedBy = nextBudgetLine?.date_needed;
    nextNeedBy = nextNeedBy ? formatDate(new Date(nextNeedBy)) : "None";
    return nextNeedBy;
};

export const getAgreementCreatedDate = (agreement) => {
    handleAgreementProp(agreement);
    const formattedToday = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });

    return agreement?.created_on
        ? new Date(agreement.created_on).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : formattedToday;
};

export const areAllBudgetLinesInStatus = (agreement, status) => {
    handleAgreementProp(agreement);

    return agreement.budget_line_items?.every((bli) => bli.status === status);
};

export const isThereAnyBudgetLines = (agreement) => {
    handleAgreementProp(agreement);

    return agreement?.budget_line_items?.length > 0;
};

export const getBudgetLineCountsByStatus = (agreement) => {
    handleAgreementProp(agreement);

    const countsByStatus = agreement.budget_line_items?.reduce((p, c) => {
        const status = c.status;
        if (!(status in p)) {
            p[status] = 0;
        }
        p[status]++;
        return p;
    }, {});

    const statuses = Object.keys(codesToDisplayText.budgetLineStatus);

    const zerosForAllStatuses = statuses.reduce((obj, status) => {
        obj[status] = 0;
        return obj;
    }, {});
    const countsByStatusWithZeros = { ...zerosForAllStatuses, ...countsByStatus };

    return countsByStatusWithZeros;
};

export const getAgreementContractNumber = (agreement) => {
    handleAgreementProp(agreement);

    return agreement?.contract_number;
};

export const getAgreementStartDate = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.start_date ? formatDate(new Date(agreement.start_date)) : "TBD";
};

export const getAgreementEndDate = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.end_date ? formatDate(new Date(agreement.end_date)) : "TBD";
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

export const getLifetimeObligatedAmount = (agreement) => {
    handleAgreementProp(agreement);
    return (
        agreement.budget_line_items
            ?.filter((bli) => bli.status === BLI_STATUS.OBLIGATED)
            .reduce((acc, { amount = 0, fees = 0 }) => acc + amount + fees, 0) || 0
    );
};
