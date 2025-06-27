import PropTypes from "prop-types";
import { convertCodeForDisplay } from "../../../helpers/utils";
import Tag from "../Tag";
import Tooltip from "../USWDS/Tooltip";

/**
 * A component that displays a tag with a background color based on the status code.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.status - The status code to display.
 * @param {boolean} [props.inReview] - Whether or not the tag is in review.
 * @param {string} [props.lockedMessage] - The message to display when the tag is locked.
 * @param {boolean} [props.isObe] - Whether or not the tag is in review.
 *
 * @returns {JSX.Element} - The rendered component.
 */
const TableTag = ({ status, inReview = false, lockedMessage, isObe }) => {
    const statusText = convertCodeForDisplay("budgetLineStatus", status);
    let classNames = "";

    if (inReview && lockedMessage) {
        return (
            <Tooltip
                label={lockedMessage}
                position="left"
            >
                <Tag
                    className="bg-brand-data-viz-primary-9 text-white"
                    text="In Review"
                />
            </Tooltip>
        );
    }

    if (inReview) {
        return (
            <Tag
                className="bg-brand-data-viz-primary-9 text-white"
                text="In Review"
            />
        );
    }

    if (isObe) {
        return (
            <Tooltip
                label={"OBE budget lines are overcome by events and no longer happening"}
                position="left"
            >
                <Tag
                    className="bg-brand-data-viz-bl-by-status-4 text-white"
                    text="OBE"
                />
            </Tooltip>
        );
    }

    switch (statusText) {
        case "Draft":
            classNames += "bg-brand-data-viz-bl-by-status-1 text-ink";
            break;
        case "Planned":
            classNames += "bg-brand-data-viz-bl-by-status-2 text-white";
            break;
        case "Executing":
            classNames += "bg-brand-data-viz-bl-by-status-3 text-ink";
            break;
        case "Obligated":
            classNames += "bg-brand-data-viz-bl-by-status-4 text-white";
            break;
        default:
    }

    return (
        <Tag
            className={classNames}
            text={statusText}
        />
    );
};

TableTag.propTypes = {
    status: PropTypes.string.isRequired,
    isObe: PropTypes.bool,
    inReview: PropTypes.bool,
    lockedMessage: PropTypes.string
};

export default TableTag;
