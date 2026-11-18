import * as React from "react";
import { useReviewContractModificationMutation } from "../api/opsAPI";
import { scrollToTop } from "../helpers/scrollToTop.helper";
import { extractBackendErrorMessage } from "../helpers/utils";
import useAlert from "./use-alert.hooks";

/**
 * The approval alert says what the approval changed. Only executing budget lines changes
 * anything in OPS; the bundled edits, a COR change included (#3269), were applied when saved.
 * @param {Object} request - The contract modification request being approved.
 * @returns {string}
 */
const approvedMessage = (request) =>
    request.budget_line_items?.length
        ? "The selected budget lines have been moved to Executing."
        : "The Contract Modification has been approved.";

/**
 * Shared Approve/Decline confirmation flow for a Contract Modification request (#6546): the
 * confirmation-modal props, the `useReviewContractModificationMutation` call, the success/error
 * alert, and submit-disabling-after-success. Extracted out of `ContractModificationRequestReviewCard`
 * so the For Review list's quick-icon card (`ContractModificationReviewCard`) reuses the exact
 * same approve/decline behavior and alert copy instead of duplicating it.
 *
 * @param {Object} request - The contract modification request (needs at least `id` and
 *   `budget_line_items` for the approval message).
 * @returns {{
 *   showModal: boolean,
 *   setShowModal: Function,
 *   modalProps: {heading: string, actionButtonText: string, handleConfirm: Function} | null,
 *   handleReview: (action: "APPROVE" | "DECLINE", reviewerNotes?: string | null) => void,
 *   isSubmitDisabled: boolean,
 *   submitError: string
 * }}
 */
const useContractModificationReview = (request) => {
    const [reviewContractModification, { isLoading }] = useReviewContractModificationMutation();
    const { setAlert } = useAlert();
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState(null);
    const [submitError, setSubmitError] = React.useState("");
    // `isLoading` goes back to false as soon as the mutation resolves, before the refetch that
    // removes this request from view (now out of IN_REVIEW) lands — leaving a window where the
    // buttons re-enable and a second click could submit a duplicate review. Once a review
    // succeeds, this stays true until the card unmounts, so the buttons never re-enable on success.
    const [justSucceeded, setJustSucceeded] = React.useState(false);
    const isSubmitDisabled = isLoading || justSucceeded;

    const handleReview = (action, reviewerNotes = null) => {
        const isApprove = action === "APPROVE";
        setSubmitError("");
        setModalProps({
            heading: isApprove
                ? "Are you sure you want to approve this Contract Modification?"
                : "Are you sure you want to decline this Contract Modification?",
            actionButtonText: isApprove ? "Approve" : "Decline",
            handleConfirm: () => {
                reviewContractModification({ requestId: request.id, action, reviewerNotes: reviewerNotes || null })
                    .unwrap()
                    .then(() => {
                        setJustSucceeded(true);
                        // The card/row unmounts once the request leaves IN_REVIEW, so feedback goes
                        // through the page-level alert (role="status"/"alert", announced regardless)
                        // rather than local state.
                        setAlert({
                            // "error" (not "warning") so Alert.jsx's handleRole() gives this a
                            // role="alert" live region — "warning" gets no role and is never
                            // announced. Matches ApprovePreAwardApproval.hooks.js's precedent.
                            type: isApprove ? "success" : "error",
                            heading: isApprove ? "Contract Modification Approved" : "Contract Modification Declined",
                            message: isApprove
                                ? approvedMessage(request)
                                : "This Contract Modification has been declined and returned to the submitter."
                        });
                        scrollToTop();
                    })
                    .catch((error) => {
                        // e.g. a bundled budget line changed after this request was sent; the backend's reason
                        // is in errors, not a top-level error field
                        setSubmitError(
                            extractBackendErrorMessage(error) ?? "Failed to submit your review. Please try again."
                        );
                    });
            }
        });
        setShowModal(true);
    };

    return { showModal, setShowModal, modalProps, handleReview, isSubmitDisabled, submitError };
};

export default useContractModificationReview;
