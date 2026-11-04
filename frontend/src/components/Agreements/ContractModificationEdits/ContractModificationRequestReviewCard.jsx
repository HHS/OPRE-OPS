import * as React from "react";
import { useReviewContractModificationMutation } from "../../../api/opsAPI";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import { extractBackendErrorMessage } from "../../../helpers/utils";
import useAlert from "../../../hooks/use-alert.hooks";
import SimpleAlert from "../../UI/Alert/SimpleAlert";
import TextArea from "../../UI/Form/TextArea";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import TermTag from "../../ChangeRequests/TermTag";
import ContractModificationEditCard from "./ContractModificationEditCard";

/**
 * @typedef {Object} ContractModificationBudgetLineSummary
 * @property {number} id
 * @property {string | null} line_description
 * @property {string | null} amount
 * @property {number | null} fiscal_year
 * @property {string | null} can_display_name
 */

/**
 * @typedef {Object} ContractModificationRequest
 * @property {number} id
 * @property {string} requestor_notes
 * @property {import("./ContractModificationEditCard").ContractModificationEdit[]} edits
 * @property {number[]} budget_line_item_ids
 * @property {ContractModificationBudgetLineSummary[]} budget_line_items
 */

/**
 * The Division Director's Approve/Decline card for the agreement's in-review contract
 * modification (#1008). Shown instead of the read-only "In Review" alert when the viewer is
 * authorized to review it (`request.can_review`).
 *
 * @component
 * @param {Object} props
 * @param {ContractModificationRequest} props.request
 * @returns {React.ReactElement}
 */
const ContractModificationRequestReviewCard = ({ request }) => {
    const [reviewContractModification, { isLoading }] = useReviewContractModificationMutation();
    const { setAlert } = useAlert();
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState(null);
    const [reviewerNotes, setReviewerNotes] = React.useState("");
    const [submitError, setSubmitError] = React.useState("");
    // `isLoading` goes back to false as soon as the mutation resolves, before the refetch that
    // removes this card (now out of IN_REVIEW) lands — leaving a window where the buttons
    // re-enable and a second click could submit a duplicate review. Once a review succeeds,
    // this stays true until the card unmounts, so the buttons never re-enable on success.
    const [justSucceeded, setJustSucceeded] = React.useState(false);
    const isSubmitDisabled = isLoading || justSucceeded;

    const handleReview = (action) => {
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
                        // This card unmounts once the request leaves IN_REVIEW, so feedback goes through the
                        // page-level alert (role="status"/"alert", announced regardless) rather than local state.
                        setAlert({
                            // "error" (not "warning") so Alert.jsx's handleRole() gives this a
                            // role="alert" live region — "warning" gets no role and is never
                            // announced. Matches ApprovePreAwardApproval.hooks.js's precedent.
                            type: isApprove ? "success" : "error",
                            heading: isApprove ? "Contract Modification Approved" : "Contract Modification Declined",
                            message: isApprove
                                ? "The selected budget lines have been moved to Executing."
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

    return (
        <div
            className="ops-card bg-base-lightest border-1px border-base-light radius-md padding-2 margin-bottom-3"
            data-cy="contract-modification-request-review-card"
        >
            <h3 className="margin-top-0 font-sans-sm">Contract Modification Pending Your Review</h3>
            {request.requestor_notes && (
                <p className="font-12px">
                    <strong>Submitter notes:</strong> {request.requestor_notes}
                </p>
            )}
            {request.edits.length > 0 && (
                <ul
                    className="usa-list--unstyled display-flex flex-column"
                    style={{ gap: "1rem" }}
                >
                    {request.edits.map((edit) => (
                        <li key={edit.id}>
                            <ContractModificationEditCard edit={edit} />
                        </li>
                    ))}
                </ul>
            )}
            {request.budget_line_items?.length > 0 && (
                <div className="margin-top-2">
                    <p className="font-12px text-base-dark margin-0 margin-bottom-1">
                        <strong>Budget Lines to Execute</strong>
                    </p>
                    <ul
                        className="usa-list--unstyled display-flex flex-column"
                        style={{ gap: "1rem" }}
                    >
                        {request.budget_line_items.map((budgetLineItem) => (
                            <li key={budgetLineItem.id}>
                                <div
                                    className="padding-205 bg-white border-1px border-base-light radius-md display-flex flex-wrap"
                                    style={{ gap: "1rem" }}
                                    data-cy="contract-modification-budget-line-summary"
                                >
                                    <TermTag
                                        label="BL ID"
                                        value={budgetLineItem.id}
                                        className="margin-0"
                                    />
                                    <TermTag
                                        label="Description"
                                        value={budgetLineItem.line_description}
                                        className="margin-0"
                                    />
                                    <TermTag
                                        label="CAN"
                                        value={budgetLineItem.can_display_name}
                                        className="margin-0"
                                    />
                                    <TermTag
                                        label="Amount"
                                        value={formatCurrency(budgetLineItem.amount)}
                                        className="margin-0"
                                    />
                                    <TermTag
                                        label="FY"
                                        value={budgetLineItem.fiscal_year}
                                        className="margin-0"
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="margin-top-2">
                <TextArea
                    name="contract-modification-reviewer-notes"
                    label="Notes (optional)"
                    maxLength={150}
                    value={reviewerNotes}
                    onChange={(_name, value) => setReviewerNotes(value)}
                />
            </div>
            {submitError && (
                <SimpleAlert
                    type="error"
                    heading="Error"
                    message={submitError}
                    headingLevel={4}
                />
            )}
            <div className="display-flex flex-justify-end margin-top-2">
                <button
                    className="usa-button usa-button--outline margin-right-2"
                    onClick={() => handleReview("DECLINE")}
                    disabled={isSubmitDisabled}
                    data-cy="decline-contract-modification-btn"
                >
                    Decline
                </button>
                <button
                    className="usa-button"
                    onClick={() => handleReview("APPROVE")}
                    disabled={isSubmitDisabled}
                    data-cy="approve-contract-modification-btn"
                >
                    Approve
                </button>
            </div>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
        </div>
    );
};

export default ContractModificationRequestReviewCard;
