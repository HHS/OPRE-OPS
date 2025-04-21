import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useReviewChangeRequestMutation,
    useGetCansQuery
} from "../../../api/opsAPI";
import {
    CHANGE_REQUEST_ACTION,
    CHANGE_REQUEST_SLUG_TYPES
} from "../../../components/ChangeRequests/ChangeRequests.constants";
import { BLI_STATUS, groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import { getInReviewChangeRequests } from "../../../helpers/changeRequests.helpers";
import { fromUpperCaseToTitleCase, renderField, toTitleCaseFromSlug } from "../../../helpers/utils";
import useAlert from "../../../hooks/use-alert.hooks.js";
import { useChangeRequestsForBudgetLines } from "../../../hooks/useChangeRequests.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useToggle from "../../../hooks/useToggle";
import { getTotalByCans } from "../review/ReviewAgreement.helpers";
import { useSelector } from "react-redux";

/**
 * @typedef {import('../../../components/ChangeRequests/ChangeRequestsTypes').ChangeRequest} ChangeRequest
 * @typedef {import('../../../components/BudgetLineItems/BudgetLineTypes').BudgetLine} BudgetLine
 * @typedef {import('../../../components/CANs/CANTypes').CAN} CAN
 * @typedef {import('../../../components/CANs/CANTypes').BasicCAN} BasicCAN
 * @typedef {import('../../../components/Agreements/AgreementTypes').Agreement} Agreement
 */

/**
 * @typedef {Object} ApproveAgreementHookResult
 * @property {boolean} afterApproval - The function to call after the agreement is approved
 * @property {Agreement|null} agreement - The agreement data
 * @property {BudgetLine[]} approvedBudgetLinesPreview - The budget lines preview after approval
 * @property {BudgetLine[]} budgetLinesInReview - The budget lines in review
 * @property { {
    canNumber: string;
    amount: number;
    term: string;
}[]} changeInCans - The CANs data
 * @property {string} changeRequestTitle - The title of the change request
 * @property {ChangeRequest[]} changeRequestsInReview - The change requests in review for the user
 * @property {string} checkBoxText - The text for the checkbox
 * @property {boolean} confirmation - The confirmation state
 * @property {import("@reduxjs/toolkit/query").FetchBaseQueryError | import("@reduxjs/toolkit").SerializedError | undefined} errorAgreement - The error state for the agreement
 * @property {Object[]} groupedBudgetLinesByServicesComponent - The grouped budget lines by services component
 * @property {BudgetLine[]} groupedUpdatedBudgetLinesByServicesComponent - The grouped updated budget lines by services component
 * @property {(action: 'APPROVE' | 'REJECT') => void} handleApproveChangeRequests - Function to handle approval of change requests} handleApproveChangeRequests - The function to handle the approval of change requests
 * @property {() => void} handleCancel - Function to handle cancellation of the approval process
 * @property { boolean} hasPermissionToViewPage - The permission to view the page
 * @property {boolean} isLoadingAgreement - The loading state for the agreement
 * @property {Object} modalProps - The modal properties
 * @property {string} notes - The notes for the approval
 * @property {string} projectOfficerName
 * @property {string} alternateProjectOfficerName
 * @property {string} requestorNoters - The requestor noters
 * @property {Object[]} servicesComponents - The services components
 * @property {Function} setAfterApproval - The function to set the after approval state
 * @property {Function} setConfirmation - The function to set the confirmation state
 * @property {Function} setNotes - The function to set the notes
 * @property {Function} setShowModal - The function to set the modal
 * @property {Function} setModalProps - The function to set the modal properties
 * @property {boolean} showModal - The modal state
 * @property {string} statusChangeTo - The status change to function
 * @property {string} statusForTitle
 * @property {string} title - The title of the page
 * @property {string} urlChangeToStatus - The URL change to status
 */

/**
 * @description Custom hook for managing the approval process of an agreement
 * @returns {ApproveAgreementHookResult} The data and functions for the approval process
 */
const useApproveAgreement = () => {
    const { setAlert } = useAlert();
    const urlPathParams = useParams();
    const [reviewCR] = useReviewChangeRequestMutation();
    const [notes, setNotes] = React.useState("");
    const [confirmation, setConfirmation] = React.useState(false);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    // @ts-ignore
    const agreementId = +urlPathParams.id;
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const userId = useSelector((state) => state.auth?.activeUser?.id) ?? null;
    /**
     * @typeof {CHANGE_REQUEST_SLUG_TYPES.BUDGET | CHANGE_REQUEST_SLUG_TYPES.STATUS}
     */
    let changeRequestType = React.useMemo(() => searchParams.get("type") ?? "", [searchParams]);
    /**
     * @typeof {'EXECUTING' | 'PLANNED'}
     */
    let urlChangeToStatus = React.useMemo(() => searchParams.get("to")?.toUpperCase() ?? "", [searchParams]);
    /**
     * @typeof {BLI_STATUS.PLANNED | BLI_STATUS.EXECUTING}
     */
    const statusChangeTo = React.useMemo(
        () => (urlChangeToStatus === "EXECUTING" ? BLI_STATUS.EXECUTING : BLI_STATUS.PLANNED),
        [urlChangeToStatus]
    );

    let checkBoxText;
    switch (changeRequestType) {
        case CHANGE_REQUEST_SLUG_TYPES.BUDGET:
            checkBoxText = "I understand that approving this budget change will affect my CANs balance(s)";
            break;
        case CHANGE_REQUEST_SLUG_TYPES.STATUS:
            checkBoxText =
                statusChangeTo === BLI_STATUS.PLANNED
                    ? "I understand that approving budget lines for Planned Status will subtract the amounts from the FY budget"
                    : "I understand that approving budget lines for Executing Status will start the Procurement Process";
            break;
        default:
            checkBoxText = "";
            break;
    }
    const [afterApproval, setAfterApproval] = useToggle(true);

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
        isSuccess: isSuccessAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });

    const { data: cans } = useGetCansQuery({});

    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreement?.id);

    const groupedBudgetLinesByServicesComponent = agreement?.budget_line_items
        ? groupByServicesComponent(agreement.budget_line_items)
        : [];
    const budgetLinesInReview =
        agreement?.budget_line_items?.filter(
            /** @param {BudgetLine} bli */
            (bli) =>
                bli.in_review &&
                (bli.can?.portfolio?.division.division_director_id === userId ||
                    bli.can?.portfolio?.division.deputy_division_director_id === userId)
        ) || [];

    /**
     * @type {ChangeRequest[]} changeRequestsInReview
     */
    const changeRequestsInReview = agreement?.budget_line_items
        ? getInReviewChangeRequests(agreement.budget_line_items, userId)
        : [];
    const changeInCans = getTotalByCans(budgetLinesInReview);

    let statusForTitle = "";

    if (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS) {
        statusForTitle = `- ${renderField(null, "status", statusChangeTo)}`;
    }
    const changeRequestTitle = toTitleCaseFromSlug(changeRequestType);
    const title = `Approval for ${changeRequestTitle} ${statusForTitle}`;

    let requestorNoters = "";
    if (changeRequestType !== CHANGE_REQUEST_SLUG_TYPES.BUDGET) {
        const uniqueNotes = new Set();
        changeRequestsInReview.forEach((changeRequest) => {
            if (changeRequest?.requestor_notes && changeRequest.requested_change_data.status === statusChangeTo) {
                uniqueNotes.add(changeRequest.requestor_notes);
            }
        });
        requestorNoters = Array.from(uniqueNotes)
            .map((note) => `• ${note}`)
            .join("\n");
    }
    // NOTE: 3 types of change requests: budget change, status change to planned, status change to executing
    const budgetChangeRequests = changeRequestsInReview.filter((changeRequest) => changeRequest.has_budget_change);
    const statusChangeRequestsToPlanned = changeRequestsInReview.filter(
        (changeRequest) =>
            changeRequest.has_status_change && changeRequest.requested_change_data.status === BLI_STATUS.PLANNED
    );
    const statusChangeRequestsToExecuting = changeRequestsInReview.filter(
        (changeRequest) =>
            changeRequest.has_status_change && changeRequest.requested_change_data.status === BLI_STATUS.EXECUTING
    );

    const budgetChangeBudgetLines = budgetLinesInReview.filter(
        /** @param {BudgetLine} bli */
        (bli) => bli.change_requests_in_review?.filter((cr) => cr.has_budget_change)
    );
    const budgetChangeMessages = useChangeRequestsForBudgetLines(budgetChangeBudgetLines, null, true);
    const budgetLinesToPlannedMessages = useChangeRequestsForBudgetLines(budgetLinesInReview, BLI_STATUS.PLANNED);
    const budgetLinesToExecutingMessages = useChangeRequestsForBudgetLines(budgetLinesInReview, BLI_STATUS.EXECUTING);

    // NOTE: Permission checks
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles) ?? [];
    const userIsDivisionDirector = userRoles.includes("REVIEWER_APPROVER") ?? false;

    const relevantMessages = React.useMemo(() => {
        if (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.BUDGET) {
            return budgetChangeMessages;
        }
        if (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS) {
            if (statusChangeTo === BLI_STATUS.PLANNED) {
                return budgetLinesToPlannedMessages;
            }
            if (statusChangeTo === BLI_STATUS.EXECUTING) {
                return budgetLinesToExecutingMessages;
            }
        }
        return [];
    }, [
        changeRequestType,
        statusChangeTo,
        budgetChangeMessages,
        budgetLinesToPlannedMessages,
        budgetLinesToExecutingMessages
    ]);

    /**
     * @description This function is used to apply the pending changes to the budget lines
     * @param {BudgetLine[]} originalBudgetLines - The original budget lines
     * @param {BasicCAN[]} cans - The CAN data retrieved from the RTL Query
     * @returns {BudgetLine[]} The updated budget lines
     */
    function applyPendingChangesToBudgetLines(originalBudgetLines, cans) {
        if (!Array.isArray(originalBudgetLines)) {
            console.error("Expected an array, received:", originalBudgetLines);
            return [];
        }

        return originalBudgetLines.map((budgetLine) => {
            let updatedBudgetLine = { ...budgetLine };

            // Check if budget line belongs to approver's division
            if (
                budgetLine.can?.portfolio.division.division_director_id !== userId &&
                budgetLine.can?.portfolio.division.deputy_division_director_id !== userId
            ) {
                return budgetLine; // Return original budget line unchanged if not in approver's division
            }

            if (budgetLine.change_requests_in_review && budgetLine.change_requests_in_review.length > 0) {
                budgetLine.change_requests_in_review.forEach((changeRequest) => {
                    // Only apply changes based on the changeRequestType and if they belong to the approver's division
                    if (
                        (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.BUDGET && changeRequest.has_budget_change) ||
                        (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS &&
                            changeRequest.has_status_change &&
                            changeRequest.requested_change_data.status === statusChangeTo)
                    ) {
                        Object.assign(updatedBudgetLine, changeRequest.requested_change_data);

                        if (changeRequest.requested_change_data.can_id) {
                            const newCan = cans.find((can) => can.id === changeRequest.requested_change_data.can_id);
                            if (newCan) {
                                updatedBudgetLine.can = newCan;
                            } else {
                                console.warn(`CAN with id ${changeRequest.requested_change_data.can_id} not found.`);
                            }
                        }
                    }
                });
            }

            return updatedBudgetLine;
        });
    }
    let approvedBudgetLinesPreview = [];
    let groupedUpdatedBudgetLinesByServicesComponent = [];

    if (isSuccessAgreement && cans) {
        approvedBudgetLinesPreview = applyPendingChangesToBudgetLines(agreement?.budget_line_items, cans);
        groupedUpdatedBudgetLinesByServicesComponent = approvedBudgetLinesPreview
            ? groupByServicesComponent(approvedBudgetLinesPreview)
            : [];
    }

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading:
                "Are you sure you want to cancel? This will exit the review process and you can come back to it later.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Reviewing",
            handleConfirm: () => {
                navigate("/agreements?filter=change-requests");
            }
        });
    };

    /**
     * @param {'APPROVE' | 'REJECT'} action - The action to take (APPROVE or REJECT)
     */
    const handleApproveChangeRequests = (action) => {
        /**
         * @type {ChangeRequest[]}
         */
        let changeRequests = [];
        let heading,
            btnText,
            alertType,
            alertHeading,
            alertMsg = "";

        const BUDGET_APPROVE =
            action === CHANGE_REQUEST_ACTION.APPROVE && changeRequestType === CHANGE_REQUEST_SLUG_TYPES.BUDGET;
        const BUDGET_REJECT =
            action === CHANGE_REQUEST_ACTION.REJECT && changeRequestType === CHANGE_REQUEST_SLUG_TYPES.BUDGET;
        const PLANNED_STATUS_APPROVE =
            changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS &&
            statusChangeTo === BLI_STATUS.PLANNED &&
            action === CHANGE_REQUEST_ACTION.APPROVE;
        const PLANNED_STATUS_REJECT =
            changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS &&
            statusChangeTo === BLI_STATUS.PLANNED &&
            action === CHANGE_REQUEST_ACTION.REJECT;
        const EXECUTING_STATUS_APPROVE =
            changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS &&
            statusChangeTo === BLI_STATUS.EXECUTING &&
            action === CHANGE_REQUEST_ACTION.APPROVE;
        const EXECUTING_STATUS_REJECT =
            changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS &&
            statusChangeTo === BLI_STATUS.EXECUTING &&
            action === CHANGE_REQUEST_ACTION.REJECT;

        if (BUDGET_APPROVE) {
            heading = `Are you sure you want to approve this ${toTitleCaseFromSlug(changeRequestType).toLowerCase()}? The agreement will be updated after your approval.`;
            btnText = "Approve";
            alertType = "success";
            alertHeading = "Changes Approved";
            alertMsg =
                `The following change(s) have been updated on the ${agreement.display_name} agreement.\n\n` +
                `<strong>Changes Approved:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = budgetChangeRequests;
        }
        if (BUDGET_REJECT) {
            heading = `Are you sure you want to decline this ${toTitleCaseFromSlug(changeRequestType).toLowerCase()}? The agreement will remain as it was before the change was requested.`;
            btnText = "Decline";
            alertType = "error";
            alertHeading = "Changes Declined";
            alertMsg =
                `The following change(s) have been declined on the ${agreement.display_name} agreement.\n\n` +
                `<strong>Changes Declined:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = budgetChangeRequests;
        }
        if (PLANNED_STATUS_APPROVE) {
            heading = `Are you sure you want to approve this status change to ${fromUpperCaseToTitleCase(urlChangeToStatus)} Status? This will subtract the amounts from the FY budget.`;
            btnText = "Approve";
            alertType = "success";
            alertHeading = "Changes Approved";
            alertMsg =
                `The following change(s) have been updated on the ${agreement.display_name} agreement.\n\n` +
                `<strong>Changes Approved:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = statusChangeRequestsToPlanned;
        }
        if (PLANNED_STATUS_REJECT) {
            heading = `Are you sure you want to decline this status change to ${fromUpperCaseToTitleCase(urlChangeToStatus)} Status? The agreement will remain as it was before the change was requested.`;
            btnText = "Decline";
            alertType = "error";
            alertHeading = "Changes Declined";
            alertMsg =
                `The following change(s) have been declined on the ${agreement.display_name} agreement.\n\n` +
                `<strong>Changes Declined:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = statusChangeRequestsToPlanned;
        }
        if (EXECUTING_STATUS_APPROVE) {
            heading = `Are you sure you want to approve this status change to ${fromUpperCaseToTitleCase(urlChangeToStatus)} Status? This will start the procurement process.`;
            btnText = "Approve";
            alertType = "success";
            alertHeading = "Changes Approved";
            alertMsg =
                `The following change(s) have been updated on the ${agreement.display_name} agreement. \n\n` +
                `<strong>Changes Approved:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = statusChangeRequestsToExecuting;
        }
        if (EXECUTING_STATUS_REJECT) {
            heading = `Are you sure you want to decline these budget lines for ${fromUpperCaseToTitleCase(urlChangeToStatus)} Status? The agreement will remain as it was before the change was requested.`;
            btnText = "Decline";
            alertType = "error";
            alertHeading = "Changes Declined";
            alertMsg =
                `The following change(s) have been declined on the ${agreement.display_name} agreement. \n\n` +
                `<strong>Changes Declined:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = statusChangeRequestsToExecuting;
        }

        setShowModal(true);
        setModalProps({
            heading,
            actionButtonText: btnText,
            secondaryButtonText: "Cancel",
            handleConfirm: () => {
                let promises = changeRequests.map((changeRequest) => {
                    return reviewCR({
                        change_request_id: changeRequest.id,
                        action,
                        reviewer_notes: notes
                    })
                        .unwrap()
                        .then((fulfilled) => {
                            console.log("Change Request: updated", fulfilled);
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
                            type: alertType,
                            heading: alertHeading,
                            message: alertMsg,
                            redirectUrl: "/agreements?filter=change-requests"
                        });
                    }
                });
            }
        });
    };
    return {
        afterApproval,
        agreement,
        approvedBudgetLinesPreview,
        budgetLinesInReview,
        changeInCans,
        changeRequestTitle,
        changeRequestsInReview,
        checkBoxText,
        confirmation,
        errorAgreement,
        groupedBudgetLinesByServicesComponent,
        groupedUpdatedBudgetLinesByServicesComponent,
        handleApproveChangeRequests,
        handleCancel,
        hasPermissionToViewPage: userIsDivisionDirector,
        isLoadingAgreement,
        modalProps,
        notes,
        projectOfficerName,
        alternateProjectOfficerName,
        requestorNoters,
        servicesComponents,
        setAfterApproval,
        setConfirmation,
        setNotes,
        setShowModal,
        showModal,
        statusChangeTo,
        statusForTitle,
        title,
        urlChangeToStatus
    };
};

export default useApproveAgreement;
