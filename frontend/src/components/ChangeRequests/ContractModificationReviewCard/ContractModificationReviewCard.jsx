import PropTypes from "prop-types";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";

const MOD_TYPE_LABEL = {
    MODIFIED_LOE: "Modified LOE",
    ADMIN: "Admin Change",
    AS_IS: "As-Is",
    DE_OBLIGATION: "De-obligation"
};

/**
 * ContractModificationReviewCard — For Review card for a Contract Modification request pending
 * the current user's review (#6546), for any modification type including de-obligation
 * (OPS-6489). A "Review Agreement" link takes the Director to the dedicated Mod Approval page
 * (`ApproveModApproval`, `/agreements/:id/review-modification`), which now carries the
 * approve/decline interaction that this card's own quick icons used to -- the review page
 * ships, so per this card's own prior doc comment, the icons are replaced by the link, not kept
 * alongside it.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.request - A serialized ContractModificationRequest, as returned by
 *   GET /contract-modification-requests/pending-review/ (needs at least `id`, `agreement_id`,
 *   `created_by`, `created_on`, `modification_type`, `budget_line_items`).
 */
function ContractModificationReviewCard({ request }) {
    const navigate = useNavigate();
    const agreementName = useGetAgreementName(request.agreement_id);
    const requestorName = useGetUserFullNameFromId(request.created_by);

    const handleViewClick = (e) => {
        e.preventDefault();
        navigate(`/agreements/${request.agreement_id}/review-modification`);
    };

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

            {/* Row 1, Col 6: Review Agreement link */}
            <div
                className="grid-col-6 display-flex flex-justify-end flex-align-start"
                style={{ gap: "0.5rem" }}
            >
                <button
                    type="button"
                    onClick={handleViewClick}
                    className="usa-button--unstyled text-primary font-12px cursor-pointer"
                    data-cy="review-agreement-button"
                    aria-label={`Review agreement ${agreementName}`}
                >
                    Review Agreement
                    <FontAwesomeIcon
                        icon={faEye}
                        size="3x"
                        className="height-2 width-2 margin-left-1"
                    />
                </button>
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
