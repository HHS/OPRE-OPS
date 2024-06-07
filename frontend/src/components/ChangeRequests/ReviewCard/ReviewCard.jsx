import * as React from "react";
import PropTypes from "prop-types";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";

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
            <header>
                <div>{typeLabel}</div>
            </header>
            <div>{agreementName}</div>
            <div>{actionIcons && <p>icons</p>}</div>
            <div>{requesterName}</div>
            <footer>
                <div>{requestDate}</div>
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
