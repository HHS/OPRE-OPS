import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGetAgreementByIdQuery, useGetServicesComponentsListQuery } from "../../../api/opsAPI";
import {
    CHANGE_REQUEST_ACTION,
    CHANGE_REQUEST_SLUG_TYPES
} from "../../../components/ChangeRequests/ChangeRequests.constants";
import { BLI_STATUS, groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import { getInReviewChangeRequests } from "../../../helpers/changeRequests.helpers";
import { renderField, toTitleCaseFromSlug } from "../../../helpers/utils";
import useAlert from "../../../hooks/use-alert.hooks.js";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useToggle from "../../../hooks/useToggle";
import { getTotalByCans } from "../review/ReviewAgreement.helpers";
import { useReviewChangeRequestMutation } from "../../../api/opsAPI";

/**
 * Custom hook for managing the approval process of an agreement
 * @typedef {Object} ApproveAgreementHookResult
 * @property {Object|null} agreement - The agreement data
 * @property {string} projectOfficerName - The name of the project officer
 * @property {Object[]} servicesComponents - The services components
 * @property {Object[]} groupedBudgetLinesByServicesComponent - The budget lines grouped by services component
 * @property {Object[]} budgetLinesInReview - The budget lines in review
 * @property {Object[]} changeRequestsInReview - The change requests in review
 * @property {Object} changeInCans - The change in CANs
 * @property {string} notes - The reviewer notes
 * @property {Function} setNotes - The setter for reviewer notes
 * @property {boolean} confirmation - The confirmation state
 * @property {function(boolean): void} setConfirmation - The setter for confirmation state
 * @property {boolean} showModal - The modal visibility state
 * @property {function(boolean): void} setShowModal - The setter for modal visibility
 * @property {Object} modalProps - The modal properties
 * @property {string} checkBoxText - The text for the confirmation checkbox
 * @property {Function} handleCancel - Function to handle cancellation
 * @property {Function} handleDecline - Function to handle decline
 * @property {Function} handleApproveChangeRequests - Function to handle approval of change requests
 * @property {string} title - The title of the approval page
 * @property {boolean} afterApproval - The after approval state
 * @property {Function} setAfterApproval - The setter for after approval state
 * @property {string} submittersNotes - The submitter's notes
 * @property {string} changeToStatus - The status to change to
 * @property {string} statusForTitle - The status for the title
 * @property {string} changeRequestTitle - The title of the change request,
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
    let submittersNotes = "This is a test note"; // TODO: replace with actual data
    // @ts-ignore
    const agreementId = +urlPathParams.id;
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    let changeRequestType = searchParams.get("type") ?? "";
    let changeToStatus = searchParams.get("to")?.toUpperCase() ?? "";
    const checkBoxText =
        changeToStatus === BLI_STATUS.PLANNED
            ? "I understand that approving these budget lines will subtract the amounts from the FY budget"
            : "I understand that approving these budget lines will start the Procurement Process";
    const approveModalHeading =
        changeToStatus === BLI_STATUS.PLANNED
            ? "Are you sure you want to approve these budget lines for Planned Status? This will subtract the amounts from the FY budget."
            : "Are you sure you want to approve these budget lines for Executing Status? This will start the procurement process.";
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
    /**
     *  @typedef {import('../../../components/ChangeRequests/ChangeRequestsList/ChangeRequests').ChangeRequest} ChangeRequest
     *  @type {ChangeRequest[]}
     */
    const changeRequestsInReview = /** @type {ChangeRequest[]} */ (
        getInReviewChangeRequests(agreement?.budget_line_items)
    );
    const changeInCans = getTotalByCans(budgetLinesInReview);

    let statusForTitle = "";
    const status = changeToStatus === "EXECUTING" ? BLI_STATUS.EXECUTING : BLI_STATUS.PLANNED;
    if (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS) {
        statusForTitle = `- ${renderField(null, "status", status)}`;
    }
    const changeRequestTitle = toTitleCaseFromSlug(changeRequestType);
    const title = `Approval for ${changeRequestTitle} ${statusForTitle}`;

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading:
                "Are you sure you want to cancel? This will exit the review process and you can come back to it later.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Reviewing",
            handleConfirm: () => {
                navigate("/agreements");
            }
        });
    };

    const declineChangeRequest = () => {
        setAlert({
            type: "success",
            heading: "Not Yet Implemented",
            message: "Not yet implemented"
        });
    };

    const handleDecline = async () => {
        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to decline these budget lines for ${changeToStatus} Status?`,
            actionButtonText: "Decline",
            secondaryButtonText: "Cancel",
            handleConfirm: async () => {
                await declineChangeRequest();
                navigate("/agreements");
            }
        });
    };
    /**
     * Handles the approval of a change request
     * @param {{APPROVE: string, DECLINE: string, CANCEL: string}} action - The action to take
     */
    const approveChangeRequest = (action) => {
        const BUDGET_APPROVE =
            action === CHANGE_REQUEST_ACTION.APPROVE && changeRequestType === CHANGE_REQUEST_SLUG_TYPES.BUDGET;
        const BUDGET_REJECT =
            action === CHANGE_REQUEST_ACTION.REJECT && changeRequestType === CHANGE_REQUEST_SLUG_TYPES.BUDGET;
        const budgetChangeRequests = changeRequestsInReview.filter((changeRequest) => changeRequest.has_budget_change);
        const statusChangeRequestsToPlanned = changeRequestsInReview.filter(
            (changeRequest) =>
                changeRequest.has_status_change && changeRequest.requested_change_diff === BLI_STATUS.PLANNED
        );
        const statusChangeRequestsToExecuting = changeRequestsInReview.filter(
            (changeRequest) =>
                changeRequest.has_status_change && changeRequest.requested_change_diff === BLI_STATUS.EXECUTING
        );
        if (BUDGET_APPROVE || BUDGET_REJECT) {
            let promises = budgetChangeRequests.map((changeRequest) => {
                return reviewCR({
                    change_request_id: changeRequest.id,
                    action,
                    reviewer_notes: notes
                })
                    .unwrap()
                    .then((fulfilled) => {
                        console.log("BLI: approved", fulfilled);
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
                        heading: "Not Yet Implemented",
                        message: "Not yet implemented"
                    });
                }
            });
        }
    };
    // TODO: refactor to handle all cases
    /**
     * Handles the approval of a change request
     * @param {{APPROVE: string, DECLINE: string, CANCEL: string}} action - The action to take
     */
    const handleApproveChangeRequests = async (action) => {
        setShowModal(true);
        setModalProps({
            heading: approveModalHeading,
            actionButtonText: "Approve",
            secondaryButtonText: "Cancel",
            handleConfirm: async () => {
                await approveChangeRequest(action);
                navigate("/agreements?filter=change-requests");
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
        handleDecline,
        handleApproveChangeRequests,
        title,
        changeRequestTitle,
        afterApproval,
        setAfterApproval,
        submittersNotes,
        changeToStatus,
        statusForTitle
    };
};

export default useApproveAgreement;
