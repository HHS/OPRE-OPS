import * as React from "react";
import { useReviewContractModificationMutation } from "../../../api/opsAPI";
import SimpleAlert from "../../UI/Alert/SimpleAlert";
import TextArea from "../../UI/Form/TextArea";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import TermTag from "../../ChangeRequests/TermTag";
import ContractModificationEditCard from "./ContractModificationEditCard";

/**
 * @typedef {Object} ContractModificationRequest
 * @property {number} id
 * @property {string} requestor_notes
 * @property {import("./ContractModificationEditCard").ContractModificationEdit[]} edits
 * @property {number[]} budget_line_item_ids
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
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState(null);
    const [reviewerNotes, setReviewerNotes] = React.useState("");
    const [submitError, setSubmitError] = React.useState("");

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
                    .catch((error) => {
                        // e.g. a bundled budget line changed after this request was sent; the backend's reason
                        // is in errors, not a top-level error field
                        const backendMessage = Object.values(error?.data?.errors ?? {})
                            .flat()
                            .find((message) => typeof message === "string");
                        setSubmitError(backendMessage ?? "Failed to submit your review. Please try again.");
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
            {request.budget_line_item_ids.length > 0 && (
                <TermTag
                    label="Budget Lines to Execute"
                    value={request.budget_line_item_ids}
                    className="margin-top-2"
                />
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
                    disabled={isLoading}
                    data-cy="decline-contract-modification-btn"
                >
                    Decline
                </button>
                <button
                    className="usa-button"
                    onClick={() => handleReview("APPROVE")}
                    disabled={isLoading}
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
