import { useSelector } from "react-redux";
import { useGetAgreementByIdQuery } from "../api/opsAPI";

/**
 * Custom hook that returns whether the user is allowed to edit the agreement.
 * @param {number} agreementId - The id of the agreement.
 * @returns {boolean} Whether the user is allowed to edit the agreement.
 *
 * @example
 * const isUserAllowedToEditAgreement = useIsUserAllowedToEditAgreement(1);
 */
export const useIsUserAllowedToEditAgreement = (agreementId) => {
    // TODO: add check if user is on the Budget Team
    const { data: agreement } = useGetAgreementByIdQuery(agreementId);
    const loggedInUserId = useSelector((state) => state?.auth?.activeUser?.id);

    const isUserTheProjectOfficer = agreement?.project_officer_id === loggedInUserId;
    const isUserTheAgreementCreator = agreement?.created_by === loggedInUserId;
    const isUserATeamMember = agreement?.team_members?.some((teamMember) => teamMember.id === loggedInUserId);
    const isUserCreatorOfAnyBudgetLines = agreement?.budget_line_items?.some(
        (bli) => bli.created_by === loggedInUserId
    );
    const isUserAllowedToEditAgreement =
        isUserTheProjectOfficer || isUserTheAgreementCreator || isUserATeamMember || isUserCreatorOfAnyBudgetLines;

    return isUserAllowedToEditAgreement;
};

/**
 * Custom hook that returns whether the agreement is editable.
 * @param {number} agreementId - The id of the agreement.
 * @returns {boolean} Whether the agreement is editable.
 *
 * @example
 * const isAgreementEditable = useIsAgreementEditable(1);
 */
export const useIsAgreementEditable = (agreementId) => {
    const { data: agreement } = useGetAgreementByIdQuery(agreementId);

    const anyBudgetLinesInExecuting = agreement?.budget_line_items?.some((item) => item.status === "IN_EXECUTING");
    const anyBudgetLinesObligated = agreement?.budget_line_items?.some((item) => item.status === "OBLIGATED");
    const isAgreementEditable = !anyBudgetLinesInExecuting && !anyBudgetLinesObligated;

    return isAgreementEditable;
};
