import { useSelector } from "react-redux";
import { useAddAgreementMutation, useGetAgreementByIdQuery, useUpdateAgreementMutation } from "../api/opsAPI";
import { BLI_STATUS } from "../helpers/budgetLines.helpers";
import useAlert from "./use-alert.hooks";
import { cleanAgreementForApi } from "../helpers/agreement.helpers";
import { formatTeamMember } from "../api/postAgreements";
import React from "react";

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

    const anyBudgetLinesInExecuting = agreement?.budget_line_items?.some(
        (item) => item.status === BLI_STATUS.EXECUTING
    );
    const anyBudgetLinesObligated = agreement?.budget_line_items?.some((item) => item.status === BLI_STATUS.OBLIGATED);
    const isAgreementEditable = !anyBudgetLinesInExecuting && !anyBudgetLinesObligated;

    return isAgreementEditable;
};

export const useSaveAgreement = (agreement, selectedTeamMembers, setAgreementId) => {
    const [addAgreement] = useAddAgreementMutation();
    const [updateAgreement] = useUpdateAgreementMutation();
    const { setAlert } = useAlert();

    const saveAgreement = React.useCallback(async () => {
        const data = {
            ...agreement,
            team_members: selectedTeamMembers.map((team_member) => formatTeamMember(team_member))
        };
        const { id, cleanData } = cleanAgreementForApi(data);

        try {
            if (id) {
                const fulfilled = await updateAgreement({ id, data: cleanData }).unwrap();
                console.log(`UPDATE: agreement updated: ${JSON.stringify(fulfilled, null, 2)}`);
                setAlert({
                    type: "success",
                    heading: "Agreement Edited",
                    message: `The agreement ${agreement.name} has been successfully updated.`
                });
            } else {
                const payload = await addAgreement(cleanData).unwrap();
                const newAgreementId = payload.id;
                setAgreementId(newAgreementId);
                console.log(`CREATE: agreement success: ${JSON.stringify(payload, null, 2)}`);
                setAlert({
                    type: "success",
                    heading: "Agreement Draft Saved",
                    message: `The agreement ${agreement.name} has been successfully created.`
                });
            }
        } catch (error) {
            console.error(`Error saving agreement: ${JSON.stringify(error, null, 2)}`);
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while saving the agreement.",
                redirectUrl: "/error"
            });
        }
    }, [agreement, selectedTeamMembers, addAgreement, updateAgreement, setAlert, setAgreementId]);

    return { saveAgreement };
};
