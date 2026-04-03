import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import TermTag from "../TermTag";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * PreAwardReviewCard component for displaying pending pre-award approval requests
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.agreementId - The ID of the agreement
 * @param {number} props.requestorId - The ID of the user who requested approval
 * @param {string} props.requestDate - The date of the approval request
 * @param {string} [props.requestorNotes] - Notes from the requestor
 * @param {boolean} [props.isCondensed=false] - Whether the card is condensed
 * @param {boolean} [props.forceHover=false] - Whether to force hover state
 * @returns {JSX.Element} - The rendered component
 */
function PreAwardReviewCard({
    agreementId,
    requestorId,
    requestDate,
    requestorNotes,
    isCondensed = false,
    forceHover = false
}) {
    const navigate = useNavigate();
    const agreementName = useGetAgreementName(agreementId);
    const requestorName = useGetUserFullNameFromId(requestorId);

    const handleViewClick = (e) => {
        e.preventDefault();
        navigate(`/agreements/${agreementId}/review-pre-award`);
    };

    return (
        <div
            className={`width-full flex-column padding-2 margin-top-4 bg-white hover:bg-base-lightest border-2px radius-lg ${
                forceHover ? "bg-base-lightest border-base-lighter" : "border-base-light hover:border-base-lighter"
            }`}
            data-cy="pre-award-review-card"
            style={{ minHeight: "8.375rem" }}
        >
            {!isCondensed && (
                <header className="display-flex flex-justify">
                    <div className="display-flex">
                        <h2 className="margin-0 font-sans-sm">
                            Pre-Award Approval
                            <br />
                            Request
                        </h2>
                        <dl className="font-12px margin-0 margin-left-4">
                            <dt className="margin-0 text-base-dark">Agreement</dt>
                            <dd className="margin-0">{agreementName}</dd>
                        </dl>
                    </div>
                </header>
            )}
            <section
                className="display-flex flex-justify margin-y-1"
                style={{ maxWidth: "50rem" }}
            >
                <dl className="font-12px grid-col-2">
                    <dt className="text-base-dark">Requested By</dt>
                    <dd className="margin-0">{requestorName || "Unknown"}</dd>
                </dl>
                {requestorNotes && (
                    <TermTag
                        label="Notes"
                        value={requestorNotes}
                        className="grid-col-6"
                    />
                )}
            </section>
            <footer className="font-12px display-flex flex-justify flex-align-center">
                <div className="text-base-dark display-flex flex-align-center">
                    <FontAwesomeIcon
                        icon={faClock}
                        className="height-2 width-2 margin-right-1"
                    />
                    {formatDateToMonthDayYear(requestDate)}
                </div>
                {!isCondensed && (
                    <button
                        onClick={handleViewClick}
                        className="usa-button--unstyled text-primary font-12px cursor-pointer"
                        data-cy="review-pre-award"
                    >
                        Review Request
                        <FontAwesomeIcon
                            icon={faEye}
                            size="3x"
                            className="height-2 width-2 margin-left-1"
                        />
                    </button>
                )}
            </footer>
        </div>
    );
}

PreAwardReviewCard.propTypes = {
    agreementId: PropTypes.number.isRequired,
    requestorId: PropTypes.number.isRequired,
    requestDate: PropTypes.string.isRequired,
    requestorNotes: PropTypes.string,
    isCondensed: PropTypes.bool,
    forceHover: PropTypes.bool
};

export default PreAwardReviewCard;
