import * as React from "react";
import { useSelector } from "react-redux";
import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useUpdateBudgetLineItemMutation
} from "../../../api/opsAPI";
import { BLI_STATUS, groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import { useIsAgreementEditable, useIsUserAllowedToEditAgreement } from "../../../hooks/agreement.hooks";
import useAlert from "../../../hooks/use-alert.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useToggle from "../../../hooks/useToggle";
import { actionOptions, selectedAction } from "./ReviewAgreement.constants";
import { anyBudgetLinesByStatus, getSelectedBudgetLines, getTotalBySelectedCans } from "./ReviewAgreement.helpers";
import suite from "./suite";

/**
 * Custom hook for the Review Agreement page
 * @param {number} agreementId - the agreement ID
 */
const useReviewAgreement = (agreementId) => {
    const [action, setAction] = React.useState(""); // for the action accordion
    const [budgetLines, setBudgetLines] = React.useState([]);
    const [pageErrors, setPageErrors] = React.useState({});
    const [isAlertActive, setIsAlertActive] = React.useState(false);
    const [mainToggleSelected, setMainToggleSelected] = React.useState(false);
    const [notes, setNotes] = React.useState("");
    const [afterApproval, setAfterApproval] = useToggle(true);
    const activeUser = useSelector((state) => state.auth.activeUser);
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();
    const { setAlert } = useAlert();
    let res = suite.get();
    const {
        isSuccess,
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreement?.id);

    const groupedBudgetLinesByServicesComponent = budgetLines ? groupByServicesComponent(budgetLines) : [];

    // NOTE: convert page errors about budget lines object into an array of objects
    const budgetLinePageErrors = Object.entries(pageErrors).filter((error) => error[0].includes("Budget line item"));
    const budgetLinePageErrorsExist = budgetLinePageErrors.length > 0;
    const budgetLineErrors = res.getErrors("budget-line-items");
    const budgetLineErrorsExist = budgetLineErrors.length > 0;
    const areThereBudgetLineErrors = budgetLinePageErrorsExist || budgetLineErrorsExist;
    const anyBudgetLinesDraft = anyBudgetLinesByStatus(agreement ?? {}, "DRAFT");
    const anyBudgetLinePlanned = anyBudgetLinesByStatus(agreement ?? {}, "PLANNED");
    const changeInCans = getTotalBySelectedCans(budgetLines);
    const actionOptionsToChangeRequests = {
        [actionOptions.CHANGE_DRAFT_TO_PLANNED]: selectedAction.DRAFT_TO_PLANNED,
        [actionOptions.CHANGE_PLANNED_TO_EXECUTING]: selectedAction.PLANNED_TO_EXECUTING
    };
    let changeRequestAction = actionOptionsToChangeRequests[action];
    const isAnythingSelected = getSelectedBudgetLines(budgetLines).length > 0;
    const isDRAFTSubmissionReady =
        anyBudgetLinesDraft && action === actionOptions.CHANGE_DRAFT_TO_PLANNED && isAnythingSelected;
    const isPLANNEDSubmissionReady =
        anyBudgetLinePlanned && action === actionOptions.CHANGE_PLANNED_TO_EXECUTING && isAnythingSelected;
    const isSubmissionReady = isDRAFTSubmissionReady || isPLANNEDSubmissionReady;

    const isAgreementStateEditable = useIsAgreementEditable(agreement?.id);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const isAgreementEditable = isAgreementStateEditable && canUserEditAgreement;

    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);

    React.useEffect(() => {
        const newBudgetLines =
            agreement?.budget_line_items?.map((bli) => ({
                ...bli,
                selected: false, // for use in the BLI table
                actionable: false // based on action accordion
            })) ?? [];
        setBudgetLines(newBudgetLines);
    }, [agreement]);

    React.useEffect(() => {
        if (isSuccess) {
            suite({
                ...agreement
            });
        }
        return () => {
            suite.reset();
        };
    }, [isSuccess, agreement]);

    React.useEffect(() => {
        if (isSuccess && !res.isValid()) {
            setIsAlertActive(true);
            setPageErrors(res.getErrors());
        }
        return () => {
            setPageErrors({});
            setIsAlertActive(false);
        };
    }, [res, isSuccess]);
    /**
     * Handle the sending of the budget line items to approval
     * @returns {void}
     */
    const handleSendToApproval = () => {
        if (anyBudgetLinesDraft || anyBudgetLinePlanned) {
            const selectedBudgetLines = getSelectedBudgetLines(budgetLines);
            let selectedBLIsWithStatusAndNotes = [];

            switch (action) {
                case actionOptions.CHANGE_DRAFT_TO_PLANNED:
                    selectedBLIsWithStatusAndNotes = selectedBudgetLines.map((bli) => {
                        return { id: bli.id, status: BLI_STATUS.PLANNED, requestor_notes: notes };
                    });
                    break;
                case actionOptions.CHANGE_PLANNED_TO_EXECUTING:
                    selectedBLIsWithStatusAndNotes = selectedBudgetLines.map((bli) => {
                        return {
                            id: bli.id,
                            status: BLI_STATUS.EXECUTING,
                            requestor_notes: notes
                        };
                    });
                    break;
                default:
                    break;
            }

            const currentUserId = activeUser?.id;

            console.log("BLI Package Data:", selectedBudgetLines, currentUserId, notes);
            console.log("THE ACTION IS:", action);

            let promises = selectedBLIsWithStatusAndNotes.map((budgetLine) => {
                const { id, data: cleanExistingBLI } = cleanBudgetLineItemForApi(budgetLine);
                return updateBudgetLineItem({ id, data: cleanExistingBLI })
                    .unwrap()
                    .then((fulfilled) => {
                        console.log("Updated BLI:", fulfilled);
                    })
                    .catch((rejected) => {
                        console.error("Error Updating Budget Line");
                        console.error({ rejected });
                        throw new Error("Error Updating Budget Line");
                    });
            });
            Promise.allSettled(promises).then((results) => {
                let rejected = results.filter((result) => result.status === "rejected");
                if (rejected.length > 0) {
                    console.error(rejected[0].reason);
                    setAlert({
                        type: "error",
                        heading: "Error Sending Agreement Edits",
                        message: "There was an error sending your edits for approval. Please try again.",
                        redirectUrl: "/error"
                    });
                } else {
                    setAlert({
                        type: "success",
                        heading: "Changes Sent to Approval",
                        // TODO: add Change Requests to alert message
                        message:
                            "Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement.",
                        redirectUrl: "/agreements"
                    });
                }
            });
        }
    };
    /**
     * Handle the selection of a budget line item
     * @param {number} bliId - the budget line item ID
     * @returns {void}
     */
    const handleSelectBLI = (bliId) => {
        const newBudgetLines = budgetLines.map((bli) => {
            if (+bli.id === +bliId) {
                return {
                    ...bli,
                    selected: !bli.selected
                };
            }
            return bli;
        });

        setBudgetLines(newBudgetLines);
    };
    /**
     * Handle the change of the action accordion
     * @param {string} action - the selected action
     * @returns {void}
     */
    const handleActionChange = (action) => {
        setAction(action);
        setMainToggleSelected(false);

        const newBudgetLines = budgetLines.map((bli) => {
            switch (action) {
                case actionOptions.CHANGE_DRAFT_TO_PLANNED:
                    return {
                        ...bli,
                        selected: false,
                        actionable: bli.status === BLI_STATUS.DRAFT && !bli.in_review
                    };
                case actionOptions.CHANGE_PLANNED_TO_EXECUTING:
                    return {
                        ...bli,
                        selected: false,
                        actionable: bli.status === BLI_STATUS.PLANNED && !bli.in_review
                    };
                default:
                    return bli;
            }
        });
        setBudgetLines(newBudgetLines);
    };
    /**
     * Toggle the selection of actionable budget line items
     * @param {object[]} groupBudgetLines - the budget line items
     * @returns {void}
     */
    const toggleSelectActionableBLIs = () => {
        // TODO: refactor to account for service components
        const newBudgetLines = budgetLines.map((bli) => ({
            ...bli,
            selected: bli.actionable && !mainToggleSelected
        }));

        setBudgetLines(newBudgetLines);
    };
    /**
     * Clean the budget line item data for the API
     * @param {object} data - the budget line item data
     */
    const cleanBudgetLineItemForApi = (data) => {
        const cleanData = { ...data };
        if (data.services_component_id === 0) {
            cleanData.services_component_id = null;
        }
        if (cleanData.date_needed === "--") {
            cleanData.date_needed = null;
        }
        const budgetLineId = cleanData.id;
        delete cleanData.created_by;
        delete cleanData.created_on;
        delete cleanData.updated_on;
        delete cleanData.can;
        delete cleanData.id;
        delete cleanData.canDisplayName;
        delete cleanData.versions;
        delete cleanData.clin;
        delete cleanData.agreement;
        delete cleanData.financialSnapshotChanged;

        return { id: budgetLineId, data: cleanData };
    };

    return {
        action,
        setAction,
        budgetLines,
        setBudgetLines,
        handleSelectBLI,
        pageErrors,
        isAlertActive,
        res,
        handleActionChange,
        toggleSelectActionableBLIs,
        mainToggleSelected,
        setMainToggleSelected,
        notes,
        setNotes,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        handleSendToApproval,
        areThereBudgetLineErrors,
        isSubmissionReady,
        changeRequestAction,
        changeInCans,
        anyBudgetLinesDraft,
        anyBudgetLinePlanned,
        budgetLineErrorsExist,
        budgetLineErrors,
        budgetLinePageErrorsExist,
        budgetLinePageErrors,
        errorAgreement,
        isLoadingAgreement,
        isAgreementEditable,
        projectOfficerName,
        afterApproval,
        setAfterApproval,
        agreement
    };
};

export default useReviewAgreement;
