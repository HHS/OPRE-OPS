import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { codesToDisplayText, draftBudgetLineStatuses, formatDate } from "../../../helpers/utils";
export { getAgreementSubTotal, getProcurementShopSubTotal } from "../../../helpers/agreement.helpers";
export { hasBlIsInReview } from "../../../helpers/budgetLines.helpers";

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

export const isUserAllowedToEditAgreement = (agreement, loggedInUserId) => {
    // TODO: add check if user is on the Budget Team
    // const loggedInUserId = useSelector((state) => state?.auth?.activeUser?.id);

    const isUserTheProjectOfficer = agreement?.project_officer_id === loggedInUserId;
    const isUserTheAgreementCreator = agreement?.created_by === loggedInUserId;
    const isUserATeamMember = agreement?.team_members?.some((teamMember) => teamMember.id === loggedInUserId);
    const isUserCreatorOfAnyBudgetLines = agreement?.budget_line_items?.some(
        (bli) => bli.created_by === loggedInUserId
    );
    const isAlternateProjectOfficer = agreement?.alternate_project_officer_id === loggedInUserId;

    const isUserAllowedToEditAgreement =
        isUserTheProjectOfficer ||
        isUserTheAgreementCreator ||
        isUserATeamMember ||
        isUserCreatorOfAnyBudgetLines ||
        isAlternateProjectOfficer;

    return isUserAllowedToEditAgreement;
};

/**
 * Custom hook that returns whether the agreement is editable.
 * @param {object} agreement - The id of the agreement.
 * @returns {boolean} Whether the agreement is editable.
 *
 * @example
 * const isAgreementEditable = useIsAgreementEditable(1);
 */
export const isAgreementEditable = (agreement) => {
    const anyBudgetLinesInExecuting = agreement?.budget_line_items?.some(
        (item) => item.status === BLI_STATUS.EXECUTING
    );
    const anyBudgetLinesObligated = agreement?.budget_line_items?.some((item) => item.status === BLI_STATUS.OBLIGATED);
    const isAgreementEditable = !anyBudgetLinesInExecuting && !anyBudgetLinesObligated;

    return isAgreementEditable;
};
