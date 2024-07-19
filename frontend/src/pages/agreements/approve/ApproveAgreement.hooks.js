import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useReviewChangeRequestMutation
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

/**
 *  @typedef {import('../../../components/ChangeRequests/ChangeRequestsList/ChangeRequests').ChangeRequest} ChangeRequest
 *  @type {ChangeRequest[]}
 */
/**
 * Custom hook for managing the approval process of an agreement
 * @typedef {Object} ApproveAgreementHookResult
 * @property {Object|null} agreement - The agreement data
 * @property {string} projectOfficerName - The name of the project officer
 * @property {Object[]} servicesComponents - The services components
 * @property {Object[]} groupedBudgetLinesByServicesComponent - The budget lines grouped by services component
 * @property {Object[]} budgetLinesInReview - The budget lines in review
 * @property {ChangeRequest[]} changeRequestsInReview - The change requests in review
 * @property {Object} changeInCans - The change in CANs
 * @property {string} notes - The reviewer notes
 * @property {Function} setNotes - The setter for reviewer notes
 * @property {boolean} confirmation - The confirmation state
 * @property {function(boolean): void} setConfirmation - The setter for confirmation state
 * @property {boolean} showModal - The modal visibility state
 * @property {function(boolean): void} setShowModal - The setter for modal visibility
 * @property {Object} modalProps - The modal properties
 * @property {string} checkBoxText - The text for the confirmation checkbox
 * @property {function (): void} handleCancel - Function to handle cancellation of the approval process
 * @property {Function} handleApproveChangeRequests - Function to handle approval of change requests
 * @property {string} title - The title of the approval page
 * @property {boolean} afterApproval - The after approval state
 * @property {Function} setAfterApproval - The setter for after approval state
 * @property {string} requestorNoters - The submitter's notes
 * @property {string} urlChangeToStatus - The status change to from the URL
 * @property {string} statusForTitle - The status for the title
 * @property {string} changeRequestTitle - The title of the change request,
 * @property {typeof CHANGE_REQUEST_SLUG_TYPES.BUDGET | typeof CHANGE_REQUEST_SLUG_TYPES.STATUS} statusChangeTo - The type of change request
 *
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
    const checkBoxText =
        statusChangeTo === BLI_STATUS.PLANNED
            ? "I understand that approving these budget lines will subtract the amounts from the FY budget"
            : "I understand that approving these budget lines will start the Procurement Process";

    const [afterApproval, setAfterApproval] = useToggle(true);

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });

    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreement?.id);

    if (isLoadingAgreement) {
        return <h1>Loading...</h1>;
    }
    if (errorAgreement) {
        return <h1>Oops, an error occurred</h1>;
    }

    const groupedBudgetLinesByServicesComponent = agreement?.budget_line_items
        ? groupByServicesComponent(agreement.budget_line_items)
        : [];
    const budgetLinesInReview = agreement?.budget_line_items?.filter((bli) => bli.in_review) || [];
    const changeRequestsInReview = /** @type {ChangeRequest[]} */ (
        getInReviewChangeRequests(agreement?.budget_line_items)
    );

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
        changeRequestsInReview.forEach((request) => {
            if (request?.requestor_notes) {
                uniqueNotes.add(request.requestor_notes);
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
            changeRequests = [...budgetChangeRequests];
        }
        if (BUDGET_REJECT) {
            heading = `Are you sure you want to decline this ${toTitleCaseFromSlug(changeRequestType).toLowerCase()}? The agreement will remain as it was before the change was requested.`;
            btnText = "Decline";
            alertType = "error";
            alertHeading = "Changes Declined";
            alertMsg =
                `The following change(s) have been declined on the ${agreement.display_name} agreement.\n\n` +
                `<strong>Edits Declined:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = [...budgetChangeRequests];
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
            changeRequests = [...statusChangeRequestsToPlanned];
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
            changeRequests = [...statusChangeRequestsToPlanned];
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
            changeRequests = [...statusChangeRequestsToExecuting];
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
            changeRequests = [...statusChangeRequestsToExecuting];
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
        statusChangeTo
    };
};

export default useApproveAgreement;
