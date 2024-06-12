import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faCheck, faEye, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import * as React from "react";
import { Link } from "react-router-dom";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";
import Tooltip from "../../UI/USWDS/Tooltip";

/**
 * ReviewCard component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.type - The type of the card
 * @param {number} props.agreementId - The name of the agreement
 * @param {boolean} props.actionIcons - Whether the card has action icons
 * @param {string} props.requesterName - The name of the requester
 * @param {string} props.requestDate - The date of the request
 * @param {React.ReactNode} props.children - The children of the component
 * @returns {JSX.Element} - The rendered component
 */
function ReviewCard({ type, agreementId, actionIcons, requesterName, requestDate, children }) {
    const [isHovered, setIsHovered] = React.useState(false);
    const agreementName = useGetAgreementName(agreementId);

    return (
        <div
            className="width-full flex-column padding-2 margin-top-4 bg-white hover:bg-base-lightest border-base-light hover:border-base-lighter border-2px radius-lg"
            style={{ minHeight: "8.375rem" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <header className="display-flex flex-justify">
                <div className="display-flex">
                    <h2 className="margin-0 font-sans-sm">{type}</h2>
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
            <section className="display-flex margin-y-1 flex-justify maxw-tablet">
                <dl className="font-12px margin-right-4">
                    <dt className="text-base-dark">Requested By</dt>
                    <dd className="margin-0">{requesterName}</dd>
                </dl>
                {children}
            </section>
            <footer className="font-12px display-flex flex-justify flex-align-center">
                <dl className="margin-0">
                    <dt className="text-base-dark display-flex flex-align-center">
                        <FontAwesomeIcon
                            icon={faClock}
                            className="height-2 width-2 margin-right-1"
                        />
                        {formatDateToMonthDayYear(requestDate)}
                    </dt>
                </dl>
                <Link
                    to={`/agreements/approve/${agreementId}`}
                    className="text-primary font-12px"
                >
                    Review Agreement
                    <FontAwesomeIcon
                        icon={faEye}
                        size="3x"
                        className="height-2 width-2 margin-left-1 cursor-pointer"
                    />
                </Link>
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
    requestDate: PropTypes.string.isRequired,
    children: PropTypes.node
};