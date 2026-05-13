import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { convertToCurrency, formatDateToMonthDayYear } from "../../../helpers/utils";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import Tag from "../../UI/Tag/Tag";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * ApprovalFlowReviewCard - Base component for approval workflow informational cards
 *
 * This is a shared base component for cards that display approval requests with budget metadata
 * and link to detail/approval pages. It provides a consistent layout and structure while allowing
 * customization through configuration props.
 *
 * Used by:
 * - PreAwardReviewCard (Division Director approval)
 * - BudgetTeamRequisitionReviewCard (Budget Team requisition entry)
 *
 * NOTE: This component does NOT use the ReviewCard base component because it serves a different
 * purpose. ReviewCard is designed for inline approve/reject actions on change requests, while
 * this card is purely informational and navigates to a detail page.
 *
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.agreementId - The ID of the agreement
 * @param {number} props.requestorId - The ID of the user who requested approval
 * @param {string} props.requestDate - The date of the approval request
 * @param {number} props.executingBliCount - Count of executing budget line items
 * @param {number} props.executingTotal - Total amount of executing budget line items
 * @param {string} [props.obligateByDate] - Earliest obligate-by date from executing BLIs
 * @param {number} props.agreementTotal - Total agreement amount
 * @param {string|React.ReactNode} props.headingText - Card heading text (can include JSX like <br/>)
 * @param {string} props.navigationPath - Relative path to append to /agreements/{id}/
 * @param {string} props.dataCyPrefix - Prefix for data-cy and data-testid attributes
 * @param {string} props.buttonText - Button label text
 * @param {string} [props.requestorNotes] - Optional notes from the requestor
 * @param {boolean} [props.isCondensed=false] - Whether the card is condensed
 * @param {boolean} [props.forceHover=false] - Whether to force hover state
 * @returns {JSX.Element} - The rendered component
 */
function ApprovalFlowReviewCard({
    agreementId,
    requestorId,
    requestDate,
    executingBliCount,
    executingTotal,
    obligateByDate,
    agreementTotal,
    headingText,
    navigationPath,
    dataCyPrefix,
    buttonText,
    requestorNotes,
    isCondensed = false,
    forceHover = false
}) {
    const navigate = useNavigate();
    const agreementName = useGetAgreementName(agreementId);
    const requestorName = useGetUserFullNameFromId(requestorId);

    const handleViewClick = (e) => {
        e.preventDefault();
        navigate(`/agreements/${agreementId}/${navigationPath}`);
    };

    return (
        <div
            className={`width-full flex-column padding-2 margin-top-4 bg-white hover:bg-base-lightest border-2px radius-lg ${
                forceHover ? "bg-base-lightest border-base-lighter" : "border-base-light hover:border-base-lighter"
            }`}
            data-cy={dataCyPrefix}
            data-testid={dataCyPrefix}
            style={{ minHeight: "8.375rem" }}
        >
            {!isCondensed && (
                <header className="display-flex flex-justify">
                    <div className="display-flex">
                        <h2 className="margin-0 font-sans-sm">{headingText}</h2>
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
                            tagStyle="primaryDarkTextLightBackground"
                            text={executingBliCount.toString()}
                            data-cy="executing-bli-count"
                        />
                    </dd>
                </dl>
                <dl className="font-12px grid-col-2">
                    <dt className="text-base-dark">Executing Total</dt>
                    <dd className="margin-0">
                        <Tag
                            tagStyle="primaryDarkTextLightBackground"
                            text={convertToCurrency(executingTotal)}
                        />
                    </dd>
                </dl>
                {obligateByDate && (
                    <dl className="font-12px grid-col-2">
                        <dt className="text-base-dark">Obligate By</dt>
                        <dd className="margin-0">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={formatDateToMonthDayYear(obligateByDate)}
                            />
                        </dd>
                    </dl>
                )}
                <dl className="font-12px grid-col-2">
                    <dt className="text-base-dark">Agreement Total</dt>
                    <dd className="margin-0">
                        <Tag
                            tagStyle="primaryDarkTextLightBackground"
                            text={convertToCurrency(agreementTotal)}
                        />
                    </dd>
                </dl>
            </section>
            {requestorNotes && (
                <section className="margin-top-2">
                    <dl className="font-12px">
                        <dt className="text-base-dark margin-bottom-05">Notes</dt>
                        <dd className="margin-0 text-pre-wrap">{requestorNotes}</dd>
                    </dl>
                </section>
            )}
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
                        onClick={handleViewClick}
                        className="usa-button--unstyled text-primary font-12px cursor-pointer"
                        data-cy="review-agreement-button"
                        aria-label={`Review agreement ${agreementName}`}
                    >
                        {buttonText}
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

ApprovalFlowReviewCard.propTypes = {
    agreementId: PropTypes.number.isRequired,
    requestorId: PropTypes.number.isRequired,
    requestDate: PropTypes.string.isRequired,
    executingBliCount: PropTypes.number.isRequired,
    executingTotal: PropTypes.number.isRequired,
    obligateByDate: PropTypes.string,
    agreementTotal: PropTypes.number.isRequired,
    headingText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    navigationPath: PropTypes.string.isRequired,
    dataCyPrefix: PropTypes.string.isRequired,
    buttonText: PropTypes.string.isRequired,
    requestorNotes: PropTypes.string,
    isCondensed: PropTypes.bool,
    forceHover: PropTypes.bool
};

export default ApprovalFlowReviewCard;
