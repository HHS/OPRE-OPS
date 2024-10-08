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
 */

/**
 * Custom hook for managing the approval process of an agreement
 * @typedef {Object} ApproveAgreementHookResult
 * @property {Object|null} agreement - The agreement data
 * @property {string} projectOfficerName - The name of the project officer
 * @property {Object[]} servicesComponents - The services components
 * @property {Object[]} groupedBudgetLinesByServicesComponent - The budget lines grouped by services component
 * @property {Object[]} groupedUpdatedBudgetLinesByServicesComponent - The updated budget lines grouped by services component
 * @property {Object[]} budgetLinesInReview - The budget lines in review
 * @property {Object[]} changeRequestsInReview - The change requests in review
 * @property {Object} changeInCans - The change in CANs
 * @property {string} notes - The reviewer notes
 * @property {React.Dispatch<React.SetStateAction<string>>} setNotes - The setter for reviewer notes
 * @property {boolean} confirmation - The confirmation state
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setConfirmation - The setter for confirmation state
 * @property {boolean} showModal - The modal visibility state
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setShowModal - The setter for modal visibility
 * @property {Object} modalProps - The modal properties
 * @property {string} checkBoxText - The text for the confirmation checkbox
 * @property {() => void} handleCancel - Function to handle cancellation of the approval process
 * @property {(action: 'APPROVE' | 'REJECT') => void} handleApproveChangeRequests - Function to handle approval of change requests
 * @property {string} title - The title of the approval page
 * @property {boolean} afterApproval - The after approval state
 * @property {() => void} setAfterApproval - The setter for after approval state
 * @property {string} requestorNoters - The submitter's notes
 * @property {string} urlChangeToStatus - The status change to from the URL
 * @property {string} statusForTitle - The status for the title
 * @property {string} changeRequestTitle - The title of the change request
 * @property {typeof import('../../../components/ChangeRequests/ChangeRequests.constants').CHANGE_REQUEST_SLUG_TYPES.BUDGET | typeof import('../../../components/ChangeRequests/ChangeRequests.constants').CHANGE_REQUEST_SLUG_TYPES.STATUS} statusChangeTo - The type of change request
 * @property {import("@reduxjs/toolkit/query").FetchBaseQueryError | import("@reduxjs/toolkit").SerializedError | undefined} errorAgreement - The error state for the agreement
 * @property {boolean} isLoadingAgreement - The loading state for the agreement
 * @property {Object[]} approvedBudgetLinesPreview - The updated budget lines
 * @property {boolean} is2849Ready - The readiness state for the 2849 form
 * @property {boolean} hasPermissionToViewPage - The permission to view the page. Dependant on 2849
 * @property {boolean} isApproverAndAgreementInReview - If logged in user has role of division director and agreement is in review state
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

    const { data: cans } = useGetCansQuery();

    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreement?.id);

    const groupedBudgetLinesByServicesComponent = agreement?.budget_line_items
        ? groupByServicesComponent(agreement.budget_line_items)
        : [];
    const budgetLinesInReview = agreement?.budget_line_items?.filter((bli) => bli.in_review) || [];
    const changeRequestsInReview = agreement?.budget_line_items
        ? getInReviewChangeRequests(agreement.budget_line_items)
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
    const budgetChangeRequests = changeRequestsInReview.filter((changeRequest) => changeRequest.has_budget_change);
    const budgetChangeBudgetLines = budgetLinesInReview.filter((bli) =>
        bli.change_requests_in_review.filter((cr) => cr.has_budget_change)
    );
    const statusChangeRequestsToPlanned = changeRequestsInReview.filter(
        (changeRequest) =>
            changeRequest.has_status_change && changeRequest.requested_change_data.status === BLI_STATUS.PLANNED
    );
    const statusChangeRequestsToExecuting = changeRequestsInReview.filter(
        (changeRequest) =>
            changeRequest.has_status_change && changeRequest.requested_change_data.status === BLI_STATUS.EXECUTING
    );

    const budgetChangeMessages = useChangeRequestsForBudgetLines(budgetChangeBudgetLines, null, true);
    const budgetLinesToPlannedMessages = useChangeRequestsForBudgetLines(budgetLinesInReview, BLI_STATUS.PLANNED);
    const budgetLinesToExecutingMessages = useChangeRequestsForBudgetLines(budgetLinesInReview, BLI_STATUS.EXECUTING);

    // NOTE: Permission checks
    const is2849Ready = false; // feature flag for 2849 readiness
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles) ?? [];
    const userIsDivisionDirector = userRoles.includes("division-director") ?? false;
    const userDivisionId = useSelector((state) => state.auth?.activeUser?.division) ?? null;

    const managingDivisionIds = agreement?.budget_line_items
        ? agreement.budget_line_items.flatMap((bli) =>
              bli.change_requests_in_review?.map((cr) => cr.managing_division_id) ?? []
          )
        : [];

    const doesAgreementBelongToDivisionDirector = managingDivisionIds.includes(userDivisionId) ?? false;
    const agreementHasBLIsUnderReview = agreement?.budget_line_items?.some((bli) => bli.in_review) ?? false;
    const hasPermissionToViewPage =
        userIsDivisionDirector && agreementHasBLIsUnderReview && doesAgreementBelongToDivisionDirector;
    // NOTE: This test is good enough for now until 2849 is ready
    const isApproverAndAgreementInReview = userIsDivisionDirector && agreementHasBLIsUnderReview;

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
     * @param {Object[]} originalBudgetLines - The original budget lines
     * @param {Object[]} cans - The CAN data retrieved from the RTL Query
     * @returns {Object[]} The updated budget lines
     */
    function createUpdatedBudgetLines(originalBudgetLines, cans) {
        if (!Array.isArray(originalBudgetLines)) {
            console.error("Expected an array, received:", originalBudgetLines);
            return [];
        }

        return originalBudgetLines.map((budgetLine) => {
            let updatedBudgetLine = { ...budgetLine };

            if (budgetLine.change_requests_in_review && budgetLine.change_requests_in_review.length > 0) {
                budgetLine.change_requests_in_review.forEach((changeRequest) => {
                    // Only apply changes based on the changeRequestType
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
        approvedBudgetLinesPreview = createUpdatedBudgetLines(agreement?.budget_line_items, cans);
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
        agreement,
        projectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        groupedUpdatedBudgetLinesByServicesComponent,
        budgetLinesInReview,
        changeRequestsInReview,
        changeInCans,
        notes,
        setNotes,
        confirmation,
        setConfirmation,
        showModal,
        setShowModal,
        modalProps,
        checkBoxText,
        handleCancel,
        handleApproveChangeRequests,
        title,
        changeRequestTitle,
        afterApproval,
        setAfterApproval,
        requestorNoters,
        urlChangeToStatus,
        statusForTitle,
        statusChangeTo,
        errorAgreement,
        isLoadingAgreement,
        approvedBudgetLinesPreview,
        is2849Ready,
        hasPermissionToViewPage,
        isApproverAndAgreementInReview
    };
};

export default useApproveAgreement;
