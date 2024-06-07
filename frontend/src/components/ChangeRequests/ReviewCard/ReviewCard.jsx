import * as React from "react";
import PropTypes from "prop-types";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";
import Tooltip from "../../UI/USWDS/Tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { formatDateToMonthDayYear } from "../../../helpers/utils";

/**
 * ReviewCard component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.type - The type of the card
 * @param {number} props.agreementId - The name of the agreement
 * @param {boolean} props.actionIcons - Whether the card has action icons
 * @param {string} props.requesterName - The name of the requester
 * @param {string} props.requestDate - The date of the request
 * @returns {JSX.Element} - The rendered component
 */
function ReviewCard({ type, agreementId, actionIcons, requesterName, requestDate }) {
    const [isHovered, setIsHovered] = React.useState(false);
    const agreementName = useGetAgreementName(agreementId);
    let typeLabel = "";
    if (type === "budget_line_item_change_request") {
        typeLabel = "Budget Change";
    }
    return (
        <div
            className="width-full flex-column padding-2 margin-top-4 bg-white hover:bg-base-lightest border-base-light hover:border-base-lighter border-2px radius-lg"
            style={{ minHeight: "8.375rem" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <header className="display-flex flex-justify">
                <div className="display-flex">
                    <h2 className="margin-0 font-sans-sm">{typeLabel}</h2>
                    <dl className="font-12px margin-0 margin-left-4">
                        <dt className="margin-0 text-base-dark">Agreement</dt>
                        <dd className="margin-0">{agreementName}</dd>
                    </dl>
                </div>
                {isHovered && actionIcons && (
                    <div>
                        <Tooltip
                            label="Approve"
                            position="top"
                        >
                            <button
                                id="approve"
                                aria-label="Approve"
                                onClick={() => {
                                    alert("Not yet implemented");
                                }}
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
                                onClick={() => {
                                    alert("Not yet implemented");
                                }}
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
            <dl className="font-12px margin-0 margin-top-3">
                <dt className="margin-0 text-base-dark">Requested By</dt>
                <dd className="margin-0">{requesterName}</dd>
            </dl>
            <footer>
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark display-flex flex-align-center margin-top-2">
                        <FontAwesomeIcon
                            icon={faClock}
                            className="height-2 width-2 margin-right-1"
                        />
                        {formatDateToMonthDayYear(requestDate)}
                    </dt>
                </dl>
            </footer>
        </div>
    );
}

export default ReviewCard;
ReviewCard.propTypes = {
    type: PropTypes.string.isRequired,
    agreementId: PropTypes.number.isRequired,
    actionIcons: PropTypes.bool.isRequired,
    requesterName: PropTypes.string.isRequired,
    requestDate: PropTypes.string.isRequired
};
