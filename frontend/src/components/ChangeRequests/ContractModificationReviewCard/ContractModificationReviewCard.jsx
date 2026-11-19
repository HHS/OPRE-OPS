import PropTypes from "prop-types";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useContractModificationReview from "../../../hooks/useContractModificationReview.hooks";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import SimpleAlert from "../../UI/Alert/SimpleAlert";
import Tooltip from "../../UI/USWDS/Tooltip";

const MOD_TYPE_LABEL = {
    MODIFIED_LOE: "Modified LOE",
    ADMIN: "Admin Change",
    AS_IS: "As-Is"
};

/**
 * ContractModificationReviewCard — For Review card for a Contract Modification request pending
 * the current user's review (#6546). A deliberately temporary "functional bullet tracer": quick
 * approve (✓) / decline (✕) icons are the entire interaction — no "Review agreement" link, no
 * detail view, no reviewer notes. Both are expected to be replaced once the real review page
 * (issue #3331) ships. Approve/decline logic is shared with the (currently unrendered)
 * `ContractModificationRequestReviewCard` via `useContractModificationReview`.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.request - A serialized ContractModificationRequest, as returned by
 *   GET /contract-modification-requests/pending-review/ (needs at least `id`, `agreement_id`,
 *   `created_by`, `created_on`, `modification_type`, `budget_line_items`).
 */
function ContractModificationReviewCard({ request }) {
    const agreementName = useGetAgreementName(request.agreement_id);
    const requestorName = useGetUserFullNameFromId(request.created_by);
    const { showModal, setShowModal, modalProps, handleReview, isSubmitDisabled, submitError } =
        useContractModificationReview(request);

    return (
        <div
            className="width-full padding-2 margin-top-4 bg-white hover:bg-base-lightest border-2px radius-lg border-base-light hover:border-base-lighter"
            data-cy="contract-modification-review-card"
            data-testid="contract-modification-review-card"
            style={{
                minHeight: "8.375rem",
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gridTemplateRows: "auto auto auto",
                gap: "1rem"
            }}
        >
            {/* Row 1, Col 1: Heading */}
            <div
                className="grid-col-1"
                style={{ whiteSpace: "nowrap" }}
            >
                <h2 className="margin-0 font-sans-sm">Contract Modification</h2>
            </div>

            {/* Row 1, Cols 2-5: Agreement name */}
            <dl
                className="font-12px margin-0 display-flex flex-column"
                style={{ gridColumn: "2 / 6", gap: "0.5rem" }}
            >
                <dt className="text-base-dark">Agreement</dt>
                <dd className="margin-0">{agreementName}</dd>
            </dl>

            {/* Row 1, Col 6: quick approve/decline icons */}
            <div
                className="grid-col-6 display-flex flex-justify-end"
                style={{ gap: "0.5rem" }}
            >
                <Tooltip
                    label="Approve"
                    position="top"
                >
                    <button
                        type="button"
                        id={`approve-${request.id}`}
                        aria-label="Approve"
                        disabled={isSubmitDisabled}
                        onClick={() => handleReview("APPROVE")}
                        data-cy="approve-contract-modification-icon-btn"
                    >
                        <FontAwesomeIcon
                            icon={faCheck}
                            size="2x"
                            className="text-primary height-2 width-2 cursor-pointer"
                        />
                    </button>
                </Tooltip>
                <Tooltip
                    label="Decline"
                    position="top"
                >
                    <button
                        type="button"
                        id={`decline-${request.id}`}
                        aria-label="Decline"
                        disabled={isSubmitDisabled}
                        onClick={() => handleReview("DECLINE")}
                        data-cy="decline-contract-modification-icon-btn"
                    >
                        <FontAwesomeIcon
                            icon={faXmark}
                            size="2x"
                            className="text-primary height-2 width-2 cursor-pointer"
                        />
                    </button>
                </Tooltip>
            </div>

            {/* Modification Type */}
            <dl
                className="font-12px margin-0 display-flex flex-column"
                style={{ gap: "0.5rem" }}
            >
                <dt className="text-base-dark">Modification Type</dt>
                <dd className="margin-0">{MOD_TYPE_LABEL[request.modification_type] ?? request.modification_type}</dd>
            </dl>

            {/* Requested by */}
            <dl
                className="font-12px margin-0 display-flex flex-column"
                style={{ gap: "0.5rem" }}
            >
                <dt className="text-base-dark">Requested by</dt>
                <dd className="margin-0">{requestorName || "Unknown"}</dd>
            </dl>

            {submitError && (
                <div style={{ gridColumn: "1 / 7" }}>
                    <SimpleAlert
                        type="error"
                        heading="Error"
                        message={submitError}
                        headingLevel={4}
                    />
                </div>
            )}

            {/* Footer: request date */}
            <footer
                className="font-12px display-flex flex-align-center"
                style={{ gridColumn: "1 / 7" }}
            >
                <div className="text-base-dark display-flex flex-align-center">
                    <FontAwesomeIcon
                        icon={faClock}
                        className="height-2 width-2 margin-right-1"
                        aria-hidden="true"
                    />
                    {formatDateToMonthDayYear(request.created_on)}
                </div>
            </footer>

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
}

ContractModificationReviewCard.propTypes = {
    request: PropTypes.shape({
        id: PropTypes.number.isRequired,
        agreement_id: PropTypes.number.isRequired,
        created_by: PropTypes.number,
        created_on: PropTypes.string,
        modification_type: PropTypes.string,
        budget_line_items: PropTypes.array
    }).isRequired
};

export default ContractModificationReviewCard;
