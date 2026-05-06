import PropTypes from "prop-types";
import { formatDateToMonthDayYear, convertToCurrency } from "../../../helpers/utils";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import Tag from "../../UI/Tag/Tag";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * BudgetTeamRequisitionReviewCard component for displaying pending budget team requisition reviews
 * Appears after Division Director approval, prompts budget team to enter requisition details
 *
 * NOTE: This component does NOT use the shared ReviewCard base component because it serves a different
 * purpose than change request cards. ReviewCard is designed for inline approve/reject actions on
 * change requests, while this card (like PreAwardReviewCard) is an informational card that links
 * to a detail page. The card structure is intentionally customized to show budget-specific metadata.
 *
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.agreementId - The ID of the agreement
 * @param {number} props.requestorId - The ID of the user who requested pre-award approval
 * @param {string} props.requestDate - The date of the approval request
 * @param {number} props.executingBliCount - Count of EXECUTING budget line items
 * @param {number} props.executingTotal - Sum of executing budget line items
 * @param {string} [props.obligateByDate] - Date by which funds must be obligated
 * @param {number} props.agreementTotal - Total agreement value
 * @param {boolean} [props.isCondensed=false] - Whether the card is condensed
 * @param {boolean} [props.forceHover=false] - Whether to force hover state
 * @returns {JSX.Element} - The rendered component
 */
function BudgetTeamRequisitionReviewCard({
    agreementId,
    requestorId,
    requestDate,
    executingBliCount,
    executingTotal,
    obligateByDate,
    agreementTotal,
    isCondensed = false,
    forceHover = false
}) {
    const agreementName = useGetAgreementName(agreementId);
    const requestorName = useGetUserFullNameFromId(requestorId);

    return (
        <div
            className={`width-full flex-column padding-2 margin-top-4 bg-white hover:bg-base-lightest border-2px radius-lg ${
                forceHover ? "bg-base-lightest border-base-lighter" : "border-base-light hover:border-base-lighter"
            }`}
            data-cy="budget-team-requisition-review-card"
            style={{ minHeight: "8.375rem" }}
        >
            {!isCondensed && (
                <header className="display-flex flex-justify">
                    <div className="display-flex">
                        <h2 className="margin-0 font-sans-sm">
                            Pre-Award Requisition
                            <br />
                            Review
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
                    <dt className="text-base-dark">Requested by</dt>
                    <dd className="margin-0">{requestorName || "Unknown"}</dd>
                </dl>
                <dl className="font-12px grid-col-2">
                    <dt className="text-base-dark">BLs Executing</dt>
                    <dd className="margin-0">
                        <Tag
                            tagStyle="darkTextLightBackground"
                            text={executingBliCount.toString()}
                            data-cy="executing-bli-count"
                        />
                    </dd>
                </dl>
                <dl className="font-12px grid-col-2">
                    <dt className="text-base-dark">Executing Total</dt>
                    <dd className="margin-0">{convertToCurrency(executingTotal)}</dd>
                </dl>
                {obligateByDate && (
                    <dl className="font-12px grid-col-2">
                        <dt className="text-base-dark">Obligate By</dt>
                        <dd className="margin-0">{formatDateToMonthDayYear(obligateByDate)}</dd>
                    </dl>
                )}
                <dl className="font-12px grid-col-2">
                    <dt className="text-base-dark">Agreement Total</dt>
                    <dd className="margin-0">{convertToCurrency(agreementTotal)}</dd>
                </dl>
            </section>
            <footer className="font-12px display-flex flex-justify flex-align-center">
                <div className="text-base-dark display-flex flex-align-center">
                    <FontAwesomeIcon
                        icon={faClock}
                        className="height-2 width-2 margin-right-1"
                        aria-hidden="true"
                    />
                    {formatDateToMonthDayYear(requestDate)}
                </div>
                {!isCondensed && (
                    <button
                        type="button"
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
                )}
            </footer>
        </div>
    );
}

BudgetTeamRequisitionReviewCard.propTypes = {
    agreementId: PropTypes.number.isRequired,
    requestorId: PropTypes.number.isRequired,
    requestDate: PropTypes.string.isRequired,
    executingBliCount: PropTypes.number.isRequired,
    executingTotal: PropTypes.number.isRequired,
    obligateByDate: PropTypes.string,
    agreementTotal: PropTypes.number.isRequired,
    isCondensed: PropTypes.bool,
    forceHover: PropTypes.bool
};

export default BudgetTeamRequisitionReviewCard;
