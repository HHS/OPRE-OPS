import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faCheck, faEye, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as React from "react";
import { Link } from "react-router-dom";
import { titleGenerator } from "../../../helpers/changeRequests.helpers";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";
import Tooltip from "../../UI/USWDS/Tooltip";
import { CHANGE_REQUEST_ACTION } from "../ChangeRequests.constants";
import { urlGenerator } from "./ReviewCard.helpers";

/**
 * ReviewCard component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.changeRequestId - The ID of the change request
 * @param {string} props.type - The type of the card (e.g. "Budget", "Status")
 * @param {number} props.agreementId - The name of the agreement
 * @param {boolean} props.actionIcons - Whether the card has action icons
 * @param {string} props.requesterName - The name of the requester
 * @param {string} props.requestDate - The date of the request
 * @param {React.ReactNode} props.children - The children of the component
 * @param {Function} props.handleReviewChangeRequest - Function to handle review of change requests
 * @param {string} [props.bliToStatus] - The change to result of the budget line item after the change
 * @param {string} props.changeMsg - The message to display for the change
 * @param {boolean} [props.forceHover=false] - Whether to force hover state. needed for testing
 * @param {boolean} [props.isCondensed=false] - Whether the card is condensed
 * @param {Object} [props.wrapperStyles=""] - The styles to override the children wrapper
 * @returns {React.ReactElement} - The rendered component
 */
function ReviewCard({
    changeRequestId,
    type,
    agreementId,
    actionIcons,
    requesterName,
    requestDate,
    children,
    changeMsg,
    handleReviewChangeRequest,
    bliToStatus = "",
    forceHover = false,
    isCondensed = false,
    wrapperStyles = ""
}) {
    const [isHovered, setIsHovered] = React.useState(forceHover);
    const agreementName = useGetAgreementName(agreementId);
    const reviewData = {
        agreementName,
        type,
        bliToStatus,
        changeMsg
    };
    const url = urlGenerator(type, agreementId, bliToStatus);
    const title = titleGenerator(type);
    return (
        <div
            className={`width-full flex-column padding-2 margin-top-4 bg-white hover:bg-base-lightest border-2px radius-lg ${
                forceHover ? "bg-base-lightest border-base-lighter" : "border-base-light hover:border-base-lighter"
            }`}
            data-cy="review-card"
            style={{ minHeight: "8.375rem" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!isCondensed && (
                <header className="display-flex flex-justify">
                    <div className="display-flex">
                        <h2 className="margin-0 font-sans-sm">
                            {title} <br />
                            {bliToStatus}
                        </h2>
                        <dl className="font-12px margin-0 margin-left-4">
                            <dt className="margin-0 text-base-dark">Agreement</dt>
                            <dd className="margin-0">{agreementName}</dd>
                        </dl>
                    </div>
                    {(isHovered || forceHover) && actionIcons && (
                        <div>
                            <Tooltip
                                label="Approve"
                                position="top"
                            >
                                <button
                                    id="approve"
                                    aria-label="Approve"
                                    onClick={() =>
                                        handleReviewChangeRequest(
                                            changeRequestId,
                                            CHANGE_REQUEST_ACTION.APPROVE,
                                            null,
                                            reviewData
                                        )
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faCheck}
                                        size="2x"
                                        className="text-primary height-2 width-2 margin-right-1 cursor-pointer"
                                    />
                                </button>
                            </Tooltip>
                            <Tooltip
                                label="Decline"
                                position="top"
                            >
                                <button
                                    id="decline"
                                    aria-label="Decline"
                                    onClick={() =>
                                        handleReviewChangeRequest(
                                            changeRequestId,
                                            CHANGE_REQUEST_ACTION.REJECT,
                                            null,
                                            reviewData
                                        )
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faXmark}
                                        size="2x"
                                        className="text-primary height-2 width-2 margin-right-1 cursor-pointer"
                                    />
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </header>
            )}
            <section
                className="display-flex flex-justify margin-y-1"
                style={{ maxWidth: "50rem", ...wrapperStyles }}
            >
                <dl className="font-12px grid-col-2">
                    <dt className="text-base-dark">Requested By</dt>
                    <dd className="margin-0">{requesterName}</dd>
                </dl>
                {children}
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
                    <Link
                        to={url}
                        className="text-primary font-12px"
                        data-cy="approve-agreement"
                    >
                        View All
                        <FontAwesomeIcon
                            icon={faEye}
                            size="3x"
                            className="height-2 width-2 margin-left-1 cursor-pointer"
                        />
                    </Link>
                )}
            </footer>
        </div>
    );
}

export default ReviewCard;
