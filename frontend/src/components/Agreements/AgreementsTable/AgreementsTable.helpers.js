import { formatDate } from "../../../helpers/utils";

const handleAgreementProp = (agreement) => {
    if (typeof agreement !== "object") {
        throw new Error(`Agreement must be an object, but got ${typeof agreement}`);
    }
};

export const getAgreementName = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.name;
};

export const getResearchProjectName = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.research_project?.title;
};

export const getAgreementSubTotal = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.budget_line_items?.reduce((n, { amount }) => n + amount, 0);
};

export const getProcurementShopSubTotal = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.budget_line_items?.reduce(
        (n, { amount }) => n + amount * (agreement.procurement_shop ? agreement.procurement_shop.fee : 0),
        0
    );
};

export const getAgreementNotes = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.notes;
};

export const findMinDateNeeded = (agreement) => {
    handleAgreementProp(agreement);
    let nextNeedBy = agreement.budget_line_items?.reduce(
        (n, { date_needed }) => (n < date_needed ? n : date_needed),
        0
    );
    nextNeedBy = nextNeedBy ? formatDate(new Date(nextNeedBy)) : "";

    return nextNeedBy;
};

export const getAgreementCreatedDate = (agreement) => {
    handleAgreementProp(agreement);
    const formattedToday = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });

    return agreement?.created_on
        ? new Date(agreement.created_on).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : formattedToday;
};

export const getAgreementStatus = (agreement) => {
    handleAgreementProp(agreement);

    return agreement.budget_line_items?.find((bli) => bli.status === "UNDER_REVIEW") ? "In Review" : "Draft";
};

export const areAllBudgetLinesInStatus = (agreement, status) => {
    handleAgreementProp(agreement);

    return agreement.budget_line_items?.every((bli) => bli.status === status);
};

export const isThereAnyBudgetLines = (agreement) => {
    handleAgreementProp(agreement);

    return agreement?.budget_line_items?.length > 0;
};
